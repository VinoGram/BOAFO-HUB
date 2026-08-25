from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
import os

DATABASE_URL = os.getenv("DATABASE_URL", "")

engine = None
SessionLocal = None

if DATABASE_URL:
    try:
        # Neon gives postgresql:// — SQLAlchemy needs postgresql+psycopg2://
        url = DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)

        engine = create_engine(
            url,
            pool_pre_ping=True,
            connect_args={"sslmode": "require"},  # Neon requires SSL
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        print("[Database] Connected to Neon PostgreSQL")
    except Exception as e:
        print(f"[Database] Failed to connect: {e}")


def get_db():
    if not SessionLocal:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
