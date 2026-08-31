import re
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.database import get_db
from app.models.problem import Problem
from app.schemas.problem import ProblemOut, AnswerCheck, AnswerResult

router = APIRouter()

# Seed problems if DB is empty
SEED_PROBLEMS = [
    {
        "topic": "Механика",
        "question": "Дене 20 м/с жылдамдықпен қозғалады және 4 с ішінде тоқтайды. Үдеуді табыңыз.",
        "formula": "a = \\frac{\\Delta v}{t}",
        "correct_answer": "-5",
        "solution": "a = (0 - 20) / 4 = -5 м/с². Теріс мән тежелуді білдіреді.",
        "difficulty": "easy",
        "tags": ["кинематика", "үдеу"],
    },
    {
        "topic": "Механика",
        "question": "Массасы 2 кг дененің импульсі 10 кг·м/с болса, жылдамдығын табыңыз.",
        "formula": "p = mv",
        "correct_answer": "5",
        "solution": "v = p/m = 10/2 = 5 м/с",
        "difficulty": "easy",
        "tags": ["импульс"],
    },
    {
        "topic": "Механика",
        "question": "Массасы 5 кг дене 10 м биіктіктен түседі. Потенциалдық энергиясын табыңыз. (g=10)",
        "formula": "E_p = mgh",
        "correct_answer": "500",
        "solution": "E_p = 5 × 10 × 10 = 500 Дж",
        "difficulty": "easy",
        "tags": ["энергия"],
    },
    {
        "topic": "Электромагнетизм",
        "question": "Кернеуі 220 В, кедергісі 44 Ом болса, ток күшін табыңыз.",
        "formula": "I = \\frac{U}{R}",
        "correct_answer": "5",
        "solution": "I = U/R = 220/44 = 5 А",
        "difficulty": "easy",
        "tags": ["Ом заңы", "тұрақты ток"],
    },
    {
        "topic": "Термодинамика",
        "question": "Дене 500 Дж жылу алды, ішкі энергиясы 300 Дж өсті. Жасалған жұмысты табыңыз.",
        "formula": "Q = \\Delta U + A",
        "correct_answer": "200",
        "solution": "A = Q - ΔU = 500 - 300 = 200 Дж",
        "difficulty": "medium",
        "tags": ["термодинамика", "бірінші бастама"],
    },
    {
        "topic": "Механика",
        "question": "Массасы 3 кг дене 6 м/с жылдамдықпен қозғалады. Кинетикалық энергиясын табыңыз.",
        "formula": "E_k = \\frac{mv^2}{2}",
        "correct_answer": "54",
        "solution": "Eₖ = (3 × 6²) / 2 = (3 × 36) / 2 = 54 Дж",
        "difficulty": "easy",
        "tags": ["энергия", "кинетикалық"],
    },
    {
        "topic": "Электромагнетизм",
        "question": "Ток күші 3 А, кедергі 5 Ом. 10 секундта бөлінетін жылуды табыңыз.",
        "formula": "Q = I^2 R t",
        "correct_answer": "450",
        "solution": "Q = 3² × 5 × 10 = 9 × 5 × 10 = 450 Дж",
        "difficulty": "medium",
        "tags": ["Жоуль-Ленц", "жылу"],
    },
    {
        "topic": "Механика",
        "question": "Маятниктің ауытқу периоды T=2π√(l/g). l=1 м болса, периодты табыңыз. (π≈3.14, g=10)",
        "formula": "T = 2\\pi\\sqrt{\\frac{l}{g}}",
        "correct_answer": "1.99",
        "solution": "T = 2 × 3.14 × √(1/10) = 6.28 × 0.316 ≈ 1.99 с",
        "difficulty": "hard",
        "tags": ["тербеліс", "маятник"],
    },
]


@router.get("/topics")
async def get_problem_topics(db: Session = Depends(get_db)):
    """Return distinct problem topics with counts."""
    from sqlalchemy import func
    rows = (
        db.query(Problem.topic, func.count(Problem.id))
        .group_by(Problem.topic)
        .order_by(func.count(Problem.id).desc())
        .all()
    )
    return [{"id": topic, "name": topic, "count": count} for topic, count in rows]


@router.get("", response_model=List[ProblemOut])
async def get_problems(
    difficulty: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Problem)
    if difficulty:
        query = query.filter(Problem.difficulty == difficulty)
    if topic:
        query = query.filter(Problem.topic == topic)
    return [ProblemOut.from_problem(p) for p in query.all()]


@router.get("/{problem_id}", response_model=ProblemOut)
async def get_problem(problem_id: int, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Есеп табылмады")
    return ProblemOut.from_problem(problem)


@router.post("/{problem_id}/check", response_model=AnswerResult)
async def check_answer(problem_id: int, body: AnswerCheck, request: Request, db: Session = Depends(get_db)):
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Есеп табылмады")

    # If no correct_answer stored, use AI to check
    if not problem.correct_answer:
        result = await _ai_check_answer(problem, body.answer)
    else:
        # Normalize answer for comparison
        user_ans = body.answer.strip().replace(",", ".").lower()
        correct = problem.correct_answer.strip().replace(",", ".").lower()

        is_correct = user_ans == correct
        result = AnswerResult(
            correct=is_correct,
            message="Дұрыс жауап!" if is_correct else f"Қате. Дұрыс жауап: {problem.correct_answer}",
            solution=problem.solution if not is_correct else None,
        )

    # Update streak on correct answer
    if result.correct:
        try:
            from app.routers.users import _extract_telegram_id
            from app.models.user import User
            from app.services.progress_service import update_streak
            telegram_id = _extract_telegram_id(request)
            if telegram_id:
                user = db.query(User).filter(User.telegram_id == telegram_id).first()
                if user:
                    update_streak(db, user)
                    db.commit()
        except Exception:
            pass

    return result


VERDICT_RE = re.compile(r"НӘТИЖЕ\s*:\s*(ДҰРЫС|ҚАТЕ)\b", re.IGNORECASE)


def parse_verdict(ai_response: str) -> bool:
    """True only for an explicit 'НӘТИЖЕ: ДҰРЫС' that is not negated ('ДҰРЫС ЕМЕС')."""
    for line in ai_response.split("\n"):
        m = VERDICT_RE.search(line)
        if not m:
            continue
        if m.group(1).upper() != "ДҰРЫС":
            return False
        tail = line[m.end():].strip().upper()
        return not tail.startswith("ЕМЕС")
    return False


def strip_verdict(ai_response: str) -> str:
    """Drop the verdict line — the card already shows the result."""
    lines = ai_response.strip().split("\n")
    if lines and VERDICT_RE.search(lines[0]):
        lines = lines[1:]
    return "\n".join(lines).strip()


async def _ai_check_answer(problem: Problem, user_answer: str) -> AnswerResult:
    import logging
    from app.services.ai_service import get_ai_answer

    logger = logging.getLogger(__name__)
    student = (user_answer or "").strip()

    prompt = (
        f"Физика есебі:\n{problem.question}\n\n"
        + (f"Формула: {problem.formula}\n\n" if problem.formula else "")
        + f"Оқушының жауабы (сөзбе-сөз): «{student}»\n\n"
        "Сен қатаң тексеруші мұғалімсің. Тәртіп:\n"
        "1. Алдымен есепті өзің шеш және дұрыс жауапты (сан + бірлік немесе формула) анықта.\n"
        "2. Содан кейін оқушының жауабын өз жауабыңмен салыстыр.\n"
        "3. ДҰРЫС деп тек мына жағдайда ғана бағала: оқушы жауабында дұрыс сан бар (бірлік жоқ болса да, "
        "±3 % дәлдікпен) немесе есеп формула сұраса — дұрыс формуланың эквиваленті бар.\n"
        "4. Қалған барлық жағдайда — ҚАТЕ: жауап бос, санды қамтымайды (сан сұралғанда), есепке қатысы жоқ "
        "мәтін, кездейсоқ әріптер, басқа тілдегі сөздер, «білмеймін», немесе сан дұрыс емес.\n"
        "5. Мейірімді болу үшін ҚАТЕ жауапты ДҰРЫС деп жазуға ТЫЙЫМ САЛЫНАДЫ.\n\n"
        "Жауап форматы (қатаң):\n"
        "1-жол: НӘТИЖЕ: ҚАТЕ  немесе  НӘТИЖЕ: ДҰРЫС\n"
        "2-жол: Оқушы жауабы қандай болғанын және неге солай бағаланғанын бір сөйлеммен айт.\n"
        "Содан кейін толық шешімді формулалармен жаз."
    )

    try:
        ai_response = await get_ai_answer(prompt, reasoning_effort="medium", temperature=0.0)
        is_correct = parse_verdict(ai_response)
        return AnswerResult(
            correct=is_correct,
            message="Дұрыс жауап!" if is_correct else "Қате жауап.",
            solution=strip_verdict(ai_response),
        )
    except Exception as e:
        logger.error(f"AI answer check failed for problem {problem.id}: {e}")
        return AnswerResult(
            correct=False,
            message="AI тексере алмады. Кейінірек қайталаңыз.",
            solution=None,
        )
