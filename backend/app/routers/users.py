import os

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database.database import get_db
from app.models.chat_history import ChatHistory
from app.models.progress import Progress
from app.models.test_result import TestResult
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, LevelUpdate, NotificationToggle, InactiveUserOut

router = APIRouter()

VALID_LEVELS = {"easy", "medium", "hard"}


def _get_admin_ids() -> set[int]:
    raw = os.getenv("ADMIN_TELEGRAM_IDS", "")
    return {int(x.strip()) for x in raw.split(",") if x.strip().isdigit()}


def _validate_telegram_init_data(init_data: str) -> bool:
    """Validate Telegram WebApp init data HMAC-SHA256 signature."""
    import hmac
    import hashlib
    import urllib.parse

    token = os.getenv("TELEGRAM_BOT_TOKEN", "") or os.getenv("BOT_TOKEN", "")
    if not token:
        return True  # Skip validation in dev when no token is configured

    params = dict(urllib.parse.parse_qsl(init_data))
    received_hash = params.pop("hash", "")
    if not received_hash:
        return False

    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(params.items())
    )
    secret_key = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_hash, received_hash)


def _extract_telegram_id(request: Request) -> int:
    """Extract and validate telegram_id from X-Telegram-Init-Data header."""
    init_data = request.headers.get("X-Telegram-Init-Data", "")
    if not init_data:
        raise HTTPException(status_code=401, detail="Авторизация қажет")

    if not _validate_telegram_init_data(init_data):
        raise HTTPException(status_code=401, detail="Жарамсыз авторизация деректері")

    import urllib.parse
    import json
    params = dict(urllib.parse.parse_qsl(init_data))
    user_str = params.get("user", "")
    if user_str:
        try:
            user_data = json.loads(user_str)
            return int(user_data.get("id", 0))
        except (json.JSONDecodeError, ValueError):
            pass
    raise HTTPException(status_code=401, detail="Telegram ID анықталмады")


async def _resolve_avatar_file_path(telegram_id: int) -> str | None:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "") or os.getenv("BOT_TOKEN", "")
    if not token:
        return None

    async with httpx.AsyncClient(timeout=12.0) as client:
        photos_resp = await client.get(
            f"https://api.telegram.org/bot{token}/getUserProfilePhotos",
            params={"user_id": telegram_id, "limit": 1},
        )
        if photos_resp.status_code != 200:
            return None
        photos_data = photos_resp.json()
        if not photos_data.get("ok"):
            return None

        photos = photos_data.get("result", {}).get("photos", [])
        if not photos or not photos[0]:
            return None

        largest = photos[0][-1]
        file_id = largest.get("file_id")
        if not file_id:
            return None

        file_resp = await client.get(
            f"https://api.telegram.org/bot{token}/getFile",
            params={"file_id": file_id},
        )
        if file_resp.status_code != 200:
            return None
        file_data = file_resp.json()
        if not file_data.get("ok"):
            return None

        return file_data.get("result", {}).get("file_path")


@router.get("/{telegram_id}/avatar")
async def get_user_avatar(telegram_id: int):
    token = os.getenv("TELEGRAM_BOT_TOKEN", "") or os.getenv("BOT_TOKEN", "")
    if not token:
        raise HTTPException(status_code=404, detail="Avatar жоқ")

    file_path = await _resolve_avatar_file_path(telegram_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="Avatar табылмады")

    async with httpx.AsyncClient(timeout=12.0) as client:
        file_resp = await client.get(f"https://api.telegram.org/file/bot{token}/{file_path}")
        if file_resp.status_code != 200:
            raise HTTPException(status_code=404, detail="Avatar жүктелмеді")

    content_type = file_resp.headers.get("content-type", "image/jpeg")
    return Response(content=file_resp.content, media_type=content_type)


@router.post("/register", response_model=UserOut)
async def register_user(body: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.telegram_id == body.telegram_id).first()
    is_new = user is None
    if is_new:
        user = User(
            telegram_id=body.telegram_id,
            username=body.username,
            photo_url=body.photo_url,
            first_name=body.first_name,
            last_name=body.last_name,
            language_code=body.language_code or "kk",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if user.is_banned:
            raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")
        user.username = body.username or user.username
        user.photo_url = body.photo_url or user.photo_url
        user.first_name = body.first_name or user.first_name
        user.last_name = body.last_name or user.last_name
        user.last_activity = datetime.now(timezone.utc)
        db.commit()
    out = UserOut.model_validate(user)
    out.is_new = is_new
    return out


@router.post("/level")
async def set_level(body: LevelUpdate, db: Session = Depends(get_db)):
    if body.level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail="Жарамсыз деңгей")
    user = db.query(User).filter(User.telegram_id == body.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")
    if user.is_banned:
        raise HTTPException(status_code=403, detail="Сіздің аккаунт бұғатталған")
    user.level = body.level
    user.last_activity = datetime.now(timezone.utc)
    db.commit()
    return {"status": "ok", "level": body.level}


@router.patch("/{telegram_id}/notifications")
async def toggle_notifications(
    telegram_id: int,
    body: NotificationToggle,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")
    user.notifications_enabled = body.enabled
    db.commit()
    return {"status": "ok", "notifications_enabled": body.enabled}


@router.get("/inactive", response_model=list[InactiveUserOut])
async def get_inactive_users(db: Session = Depends(get_db)):
    """
    Returns users who:
    - have not been active for 23+ hours
    - have notifications enabled
    - have not received a notification in the last 24 hours
    Marks them as notified (sets notification_sent_at) atomically.
    """
    now = datetime.now(timezone.utc)
    cutoff_active = now - timedelta(hours=23)
    cutoff_notif = now - timedelta(hours=24)

    users = (
        db.query(User)
        .filter(
            User.notifications_enabled == True,
            User.last_activity <= cutoff_active,
            User.notification_sent_at.is_(None) | (User.notification_sent_at <= cutoff_notif),
        )
        .all()
    )

    for u in users:
        u.notification_sent_at = now
    db.commit()

    return users


# ─── MINI APP ADMIN ENDPOINTS ────────────────────────────────────────────────


@router.get("/admin/list")
async def admin_user_list(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str = Query(""),
    db: Session = Depends(get_db),
):
    """List users for admin monitoring (auth via Telegram initData)."""
    caller_id = _extract_telegram_id(request)
    if caller_id not in _get_admin_ids():
        raise HTTPException(status_code=403, detail="Рұқсат жоқ")

    query = db.query(User)
    if q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(
            (User.first_name.ilike(like)) | (User.username.ilike(like))
        )
    total = query.count()
    users = query.order_by(User.last_activity.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": [
            {
                "id": u.id,
                "telegram_id": u.telegram_id,
                "first_name": u.first_name,
                "last_name": u.last_name,
                "username": u.username,
                "score": u.score or 0,
                "streak": u.streak or 0,
                "level": u.level,
                "is_active": u.is_active,
                "last_activity": u.last_activity.isoformat() if u.last_activity else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/admin/stats")
async def admin_dashboard_stats(
    request: Request,
    db: Session = Depends(get_db),
):
    """Dashboard stats for admin monitoring."""
    caller_id = _extract_telegram_id(request)
    if caller_id not in _get_admin_ids():
        raise HTTPException(status_code=403, detail="Рұқсат жоқ")

    from app.models.admin_test import AdminTestQuestion
    from app.models.problem import Problem

    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    week_ago = today_start - timedelta(days=7)

    total_users = db.query(func.count(User.id)).scalar() or 0
    active_today = db.query(func.count(User.id)).filter(User.last_activity >= today_start).scalar() or 0
    active_week = db.query(func.count(User.id)).filter(User.last_activity >= week_ago).scalar() or 0
    total_tests_taken = db.query(func.count(TestResult.id)).scalar() or 0
    total_questions = db.query(func.count(AdminTestQuestion.id)).scalar() or 0
    total_problems = db.query(func.count(Problem.id)).scalar() or 0

    # Average test score
    avg_score_row = db.query(func.avg(TestResult.percentage)).scalar()
    avg_score = round(avg_score_row, 1) if avg_score_row else 0

    # Tests per day (last 7 days)
    tests_per_day = []
    for i in range(6, -1, -1):
        day_start = today_start - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        count = db.query(func.count(TestResult.id)).filter(
            TestResult.created_at >= day_start, TestResult.created_at < day_end
        ).scalar() or 0
        tests_per_day.append({"date": day_start.strftime("%d.%m"), "count": count})

    # Most failed questions (questions with lowest correct rate)
    all_tests = db.query(TestResult).all()
    question_stats = {}  # question_id -> {correct: 0, total: 0}
    for t in all_tests:
        if not t.answers:
            continue
        for a in t.answers:
            qid = a.get("question_id")
            if qid is None:
                continue
            if qid not in question_stats:
                question_stats[qid] = {"correct": 0, "total": 0}
            question_stats[qid]["total"] += 1
            if a.get("correct"):
                question_stats[qid]["correct"] += 1

    hardest_questions = []
    for qid, stats in sorted(question_stats.items(), key=lambda x: x[1]["correct"] / max(x[1]["total"], 1)):
        if stats["total"] < 2:
            continue
        q = db.query(AdminTestQuestion).filter(AdminTestQuestion.id == qid).first()
        if q:
            hardest_questions.append({
                "id": qid,
                "question": q.question[:80],
                "topic": q.topic,
                "correct_rate": round(stats["correct"] / stats["total"] * 100, 1),
                "attempts": stats["total"],
            })
        if len(hardest_questions) >= 5:
            break

    return {
        "total_users": total_users,
        "active_today": active_today,
        "active_week": active_week,
        "total_tests_taken": total_tests_taken,
        "total_questions": total_questions,
        "total_problems": total_problems,
        "avg_score": avg_score,
        "tests_per_day": tests_per_day,
        "hardest_questions": hardest_questions,
    }


@router.get("/admin/{user_id}/activity")
async def admin_user_activity(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """Detailed user activity for admin monitoring (auth via Telegram initData)."""
    caller_id = _extract_telegram_id(request)
    if caller_id not in _get_admin_ids():
        raise HTTPException(status_code=403, detail="Рұқсат жоқ")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пайдаланушы табылмады")

    from app.models.admin_test import AdminTestQuestion

    tests = (
        db.query(TestResult)
        .filter(TestResult.user_id == user.id)
        .order_by(TestResult.created_at.desc())
        .limit(50)
        .all()
    )
    progress = db.query(Progress).filter(Progress.user_id == user.id).all()
    chats = (
        db.query(ChatHistory)
        .filter(ChatHistory.telegram_id == user.telegram_id)
        .order_by(ChatHistory.created_at.desc())
        .limit(30)
        .all()
    )

    # Batch-load all referenced questions to avoid N+1
    all_question_ids = set()
    for t in tests:
        if t.answers:
            for a in t.answers:
                qid = a.get("question_id")
                if qid:
                    all_question_ids.add(qid)
    question_map = {}
    if all_question_ids:
        qs = db.query(AdminTestQuestion).filter(AdminTestQuestion.id.in_(all_question_ids)).all()
        question_map = {q.id: q for q in qs}

    # Build detailed test history
    test_history = []
    for t in tests:
        wrong_questions = []
        if t.answers:
            for a in t.answers:
                if not a.get("correct"):
                    q = question_map.get(a.get("question_id"))
                    if q:
                        wrong_questions.append({
                            "question": q.question[:100],
                            "topic": q.topic,
                        })
        test_history.append({
            "id": t.id,
            "total_questions": t.total_questions,
            "correct_answers": t.correct_answers,
            "percentage": round(t.percentage, 1),
            "date": t.created_at.isoformat() if t.created_at else None,
            "wrong_questions": wrong_questions,
        })

    # Score trend (chronological)
    score_trend = [
        {"date": t.created_at.strftime("%d.%m") if t.created_at else "?", "score": round(t.percentage, 1)}
        for t in reversed(tests)
    ]

    # Best & worst topics from test answers
    topic_scores = {}
    for t in tests:
        if not t.answers:
            continue
        for a in t.answers:
            q = question_map.get(a.get("question_id"))
            if not q:
                continue
            if q.topic not in topic_scores:
                topic_scores[q.topic] = {"correct": 0, "total": 0}
            topic_scores[q.topic]["total"] += 1
            if a.get("correct"):
                topic_scores[q.topic]["correct"] += 1

    topic_accuracy = [
        {
            "topic": topic,
            "correct": s["correct"],
            "total": s["total"],
            "accuracy": round(s["correct"] / s["total"] * 100, 1) if s["total"] > 0 else 0,
        }
        for topic, s in sorted(topic_scores.items(), key=lambda x: x[1]["correct"] / max(x[1]["total"], 1))
    ]

    # Days since registration
    if user.created_at:
        created = user.created_at.replace(tzinfo=timezone.utc) if user.created_at.tzinfo is None else user.created_at
        days_active = (datetime.now(timezone.utc) - created).days
    else:
        days_active = 0

    return {
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "username": user.username,
            "score": user.score or 0,
            "streak": user.streak or 0,
            "level": user.level,
            "is_active": user.is_active,
            "is_banned": user.is_banned,
            "notifications_enabled": user.notifications_enabled,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_activity": user.last_activity.isoformat() if user.last_activity else None,
        },
        "test_history": test_history,
        "score_trend": score_trend,
        "topic_accuracy": topic_accuracy,
        "topic_progress": [
            {
                "topic_id": p.topic_id,
                "topic_name": p.topic_name,
                "completion_percent": round(p.completion_percent, 1),
                "problems_solved": p.problems_solved,
                "last_updated": p.last_updated.isoformat() if p.last_updated else None,
            }
            for p in progress
        ],
        "chat_history": [
            {
                "role": c.role,
                "content": c.content[:500],
                "date": c.created_at.isoformat() if c.created_at else None,
            }
            for c in reversed(chats)
        ],
        "summary": {
            "total_tests": len(tests),
            "avg_score": round(sum(t.percentage for t in tests) / len(tests), 1) if tests else 0,
            "best_score": round(max((t.percentage for t in tests), default=0), 1),
            "worst_score": round(min((t.percentage for t in tests), default=0), 1),
            "total_problems_solved": sum(p.problems_solved for p in progress),
            "topics_started": len(progress),
            "ai_questions_asked": len([c for c in chats if c.role == "user"]),
            "days_active": days_active,
        },
    }
