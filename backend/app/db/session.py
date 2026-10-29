"""SQLAlchemy engine and request-scoped session factory."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def normalize_database_url(url: str) -> str:
    """Normalize common PostgreSQL URLs to the psycopg 3 SQLAlchemy dialect."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


engine = create_engine(
    normalize_database_url(get_settings().database_url),
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def get_db() -> Generator[Session, None, None]:
    """Yield a database session and always close it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
