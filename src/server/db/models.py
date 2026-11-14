from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .postgres import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)  # Firebase UID
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class MovieCache(Base):
    """Cached OMDB payloads so we only hit the external APIs once per movie."""

    __tablename__ = "movie_cache"

    imdb_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON)
    trailer_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    trailer_checked: Mapped[bool] = mapped_column(default=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )


class WatchlistItem(Base):
    __tablename__ = "watchlist"
    __table_args__ = (
        UniqueConstraint("user_id", "imdb_id", name="uq_watchlist_user_movie"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    imdb_id: Mapped[str] = mapped_column(String(20), index=True)
    movie_title: Mapped[str] = mapped_column(String(300))
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class HistoryItem(Base):
    __tablename__ = "history"
    __table_args__ = (
        UniqueConstraint("user_id", "imdb_id", name="uq_history_user_movie"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    imdb_id: Mapped[str] = mapped_column(String(20), index=True)
    movie_title: Mapped[str] = mapped_column(String(300))
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    last_watched: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
