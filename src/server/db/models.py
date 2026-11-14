from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from .postgres import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# =====================================================================
# 1. User Entity (Strictly Single Owner in Production)
# =====================================================================
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    firebase_uid: Mapped[str] = mapped_column(
        String(128), unique=True, nullable=False, index=True
    )
    email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    display_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    interactions: Mapped[List[UserContentInteraction]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


# =====================================================================
# 2. Universal Content Item (Movies & Series across all mediums)
# =====================================================================
class ContentItem(Base):
    __tablename__ = "content_items"
    __table_args__ = (
        CheckConstraint(
            "content_type IN ('movie', 'series')", name="chk_content_type"
        ),
        CheckConstraint(
            "visual_format IN ('live_action', 'animation')", name="chk_visual_format"
        ),
        CheckConstraint(
            "release_year IS NULL OR (release_year BETWEEN 1880 AND 2100)",
            name="chk_release_year",
        ),
        CheckConstraint(
            "runtime_minutes IS NULL OR runtime_minutes > 0", name="chk_runtime"
        ),
        CheckConstraint(
            "total_seasons IS NULL OR total_seasons >= 0", name="chk_seasons_count"
        ),
        CheckConstraint(
            "total_episodes IS NULL OR total_episodes >= 0", name="chk_episodes_count"
        ),
        CheckConstraint(
            "(content_type = 'movie' AND total_seasons IS NULL) OR (content_type = 'series')",
            name="chk_movie_no_seasons",
        ),
        Index("idx_content_type_format", "content_type", "visual_format", "is_anime"),
        Index("idx_content_release_year", "release_year"),
        Index("idx_content_popularity", "popularity_score"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content_type: Mapped[str] = mapped_column(String(20), nullable=False)
    visual_format: Mapped[str] = mapped_column(
        String(20), nullable=False, default="live_action"
    )
    is_anime: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    original_title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    original_language: Mapped[str] = mapped_column(String(10), default="en")
    release_year: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    runtime_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_seasons: Mapped[Optional[int]] = mapped_column(SmallInteger, nullable=True)
    total_episodes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Released")
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tagline: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    poster_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    backdrop_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tmdb_vote_average: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(3, 1), nullable=True
    )
    tmdb_vote_count: Mapped[int] = mapped_column(Integer, default=0)
    imdb_rating: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(3, 1), nullable=True
    )
    imdb_vote_count: Mapped[int] = mapped_column(Integer, default=0)
    popularity_score: Mapped[Decimal] = mapped_column(
        Numeric(8, 3), default=Decimal("0.0")
    )
    is_adult: Mapped[bool] = mapped_column(Boolean, default=False)
    metadata_source: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True, default="local"
    )
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    identifiers: Mapped[List[ContentIdentifier]] = relationship(
        back_populates="content", cascade="all, delete-orphan"
    )
    interactions: Mapped[List[UserContentInteraction]] = relationship(
        back_populates="content", cascade="all, delete-orphan"
    )
    genres: Mapped[List[Genre]] = relationship(
        secondary="content_genres", back_populates="content_items"
    )
    seasons: Mapped[List[Season]] = relationship(
        back_populates="series", cascade="all, delete-orphan"
    )


# =====================================================================
# 3. Provider Identifier Bridge (Namespaced TMDB, IMDb, AniList, etc.)
# =====================================================================
class ContentIdentifier(Base):
    __tablename__ = "content_identifiers"
    __table_args__ = (
        CheckConstraint(
            "provider IN ('tmdb_movie', 'tmdb_tv', 'imdb', 'anilist', 'mal', 'movielens_v1')",
            name="chk_provider_namespace",
        ),
        UniqueConstraint("provider", "external_id", name="uq_provider_external_id"),
        Index("idx_identifier_lookup", "provider", "external_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("content_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(25), nullable=False)
    external_id: Mapped[str] = mapped_column(String(64), nullable=False)
    verified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    content: Mapped[ContentItem] = relationship(back_populates="identifiers")


# =====================================================================
# 4. Universal User Content Interaction (Consolidated Taste Profile)
# =====================================================================
class UserContentInteraction(Base):
    __tablename__ = "user_content_interactions"
    __table_args__ = (
        UniqueConstraint("user_id", "content_id", name="uq_user_content_pair"),
        # Rating is between 1.0 and 5.0 in 0.5 half-star increments
        CheckConstraint(
            "rating IS NULL OR (rating >= 1.0 AND rating <= 5.0 AND (rating * 2) = CAST(rating * 2 AS INT))",
            name="chk_valid_half_star_rating",
        ),
        # Marking watched mandates an explicit rating
        CheckConstraint(
            "(watched_at IS NULL) OR (watched_at IS NOT NULL AND rating IS NOT NULL)",
            name="chk_watched_mandates_rating",
        ),
        # Watchlist timestamp integrity
        CheckConstraint(
            "is_watchlisted = FALSE OR (is_watchlisted = TRUE AND watchlist_added_at IS NOT NULL)",
            name="chk_watchlist_integrity",
        ),
        # Dismissal timestamp integrity
        CheckConstraint(
            "is_dismissed = FALSE OR (is_dismissed = TRUE AND dismissed_at IS NOT NULL)",
            name="chk_dismiss_integrity",
        ),
        Index("idx_interact_watched", "user_id", "watched_at"),
        Index("idx_interact_watchlist", "user_id", "watchlist_added_at"),
        Index("idx_interact_dismissed", "user_id", "is_dismissed"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("content_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_watchlisted: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    watchlist_added_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    watched_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    rating: Mapped[Optional[Decimal]] = mapped_column(Numeric(2, 1), nullable=True)
    rating_updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dismissed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    user_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    user: Mapped[User] = relationship(back_populates="interactions")
    content: Mapped[ContentItem] = relationship(back_populates="interactions")


# =====================================================================
# 5. Taxonomy (Genres)
# =====================================================================
class Genre(Base):
    __tablename__ = "genres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    content_items: Mapped[List[ContentItem]] = relationship(
        secondary="content_genres", back_populates="genres"
    )


class ContentGenre(Base):
    __tablename__ = "content_genres"

    content_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("content_items.id", ondelete="CASCADE"),
        primary_key=True,
    )
    genre_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("genres.id", ondelete="RESTRICT"), primary_key=True
    )


# =====================================================================
# 6. Series Hierarchy (Seasons & Episodes Metadata)
# =====================================================================
class Season(Base):
    __tablename__ = "seasons"
    __table_args__ = (
        UniqueConstraint("series_id", "season_number", name="uq_series_season"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    series_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("content_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    season_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    air_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    episode_count: Mapped[int] = mapped_column(SmallInteger, default=0)
    poster_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    series: Mapped[ContentItem] = relationship(back_populates="seasons")
    episodes: Mapped[List[Episode]] = relationship(
        back_populates="season", cascade="all, delete-orphan"
    )


class Episode(Base):
    __tablename__ = "episodes"
    __table_args__ = (
        UniqueConstraint("season_id", "episode_number", name="uq_season_episode"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    season_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("seasons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    episode_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    overview: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    air_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    runtime_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    still_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    season: Mapped[Season] = relationship(back_populates="episodes")
