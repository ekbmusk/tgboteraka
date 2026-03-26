from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./physics_bot.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    from app.models import user, problem, test_result, progress as prog  # noqa
    from app.models import admin_user, admin_test, theory_content, broadcast_log, chat_history  # noqa
    Base.metadata.create_all(bind=engine)
    _migrate_sqlite()
    _seed_admin_user()
    _seed_admin_tests()
    _seed_theory_content()
    _seed_problems()


def _migrate_sqlite():
    """Add missing columns to existing SQLite tables without dropping data."""
    if "sqlite" not in DATABASE_URL:
        return

    migrations = [
        ("users", "level",                  "VARCHAR DEFAULT 'medium'"),
        ("users", "is_admin",               "BOOLEAN DEFAULT 0"),
        ("users", "is_banned",              "BOOLEAN DEFAULT 0"),
        ("users", "notifications_enabled",  "BOOLEAN DEFAULT 1"),
        ("users", "notification_sent_at",   "DATETIME"),
        ("users", "photo_url",              "VARCHAR"),
        ("users", "last_daily_date",        "VARCHAR"),
    ]

    import logging
    logger = logging.getLogger(__name__)

    with engine.connect() as conn:
        for table, column, col_def in migrations:
            try:
                conn.execute(
                    __import__("sqlalchemy").text(
                        f"ALTER TABLE {table} ADD COLUMN {column} {col_def}"
                    )
                )
                conn.commit()
            except Exception as e:
                err_msg = str(e).lower()
                if "duplicate column" in err_msg or "already exists" in err_msg:
                    pass  # Column already exists — safe to ignore
                else:
                    logger.warning(f"Migration failed for {table}.{column}: {e}")


def _seed_admin_user():
    from app.models.admin_user import AdminUser
    from app.utils.auth import hash_password

    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")
    if not username or not password:
        return

    with SessionLocal() as db:
        existing = db.query(AdminUser).filter(AdminUser.username == username).first()
        if existing:
            existing.password_hash = hash_password(password)
            existing.is_active = True
            db.commit()
            return
        admin = AdminUser(username=username, password_hash=hash_password(password), is_active=True)
        db.add(admin)
        db.commit()


def _seed_theory_content():
    from app.models.theory_content import TheoryContent

    seeds = [
        {"topic_id": "mechanics", "title": "Механика"},
        {"topic_id": "thermodynamics", "title": "Термодинамика"},
        {"topic_id": "electromagnetism", "title": "Электромагнетизм"},
        {"topic_id": "optics", "title": "Оптика"},
        {"topic_id": "quantum", "title": "Кванттық физика"},
        {"topic_id": "nuclear", "title": "Ядролық физика"},
        {"topic_id": "lecture_01", "title": "1-лекция: Механика негіздері"},
        {"topic_id": "lecture_02", "title": "2-лекция: Кинематика"},
        {"topic_id": "lecture_03", "title": "3-лекция: Динамика"},
        {"topic_id": "lecture_04", "title": "4-лекция: Ньютон заңдары"},
        {"topic_id": "lecture_05", "title": "5-лекция: Жұмыс және энергия"},
        {"topic_id": "lecture_06", "title": "6-лекция: Сақталу заңдары"},
        {"topic_id": "lecture_07", "title": "7-лекция: Айналмалы қозғалыс"},
        {"topic_id": "lecture_08", "title": "8-лекция: Импульс моменті"},
        {"topic_id": "lecture_09", "title": "9-лекция: Тартылыс заңы"},
        {"topic_id": "lecture_10", "title": "10-лекция: Салыстырмалылық теориясы"},
        {"topic_id": "lecture_11", "title": "11-лекция: Қысым және гидростатика"},
        {"topic_id": "lecture_12", "title": "12-лекция: Гидродинамика"},
        {"topic_id": "lecture_13", "title": "13-лекция: Сұйықтық динамикасы"},
        {"topic_id": "lecture_14", "title": "14-лекция: Тербелістер"},
        {"topic_id": "lecture_15", "title": "15-лекция: Акустика"},
    ]

    with SessionLocal() as db:
        for topic in seeds:
            existing = db.query(TheoryContent).filter(
                TheoryContent.topic_id == topic["topic_id"]
            ).first()
            if not existing:
                db.add(TheoryContent(topic_id=topic["topic_id"], title=topic["title"], blocks=[]))
        db.commit()


def _seed_admin_tests():
    from app.models.admin_test import AdminTestQuestion
    from app.routers.tests import TEST_BANK

    with SessionLocal() as db:
        existing_count = db.query(AdminTestQuestion).count()
        if existing_count > 0:
            return

        for item in TEST_BANK:
            options = item.get("options", [])
            if len(options) != 4:
                continue

            correct_idx = int(item.get("correct_answer", 0))
            if correct_idx < 0 or correct_idx > 3:
                correct_idx = 0

            db.add(
                AdminTestQuestion(
                    topic="Жалпы физика",
                    question=item.get("question", ""),
                    option_a=options[0],
                    option_b=options[1],
                    option_c=options[2],
                    option_d=options[3],
                    correct_option=["A", "B", "C", "D"][correct_idx],
                    explanation=item.get("explanation"),
                )
            )

        db.commit()


def _seed_problems():
    from app.models.problem import Problem
    from app.routers.problems import SEED_PROBLEMS

    with SessionLocal() as db:
        if db.query(Problem).count() > 0:
            return
        for p in SEED_PROBLEMS:
            db.add(Problem(**p))
        db.commit()
