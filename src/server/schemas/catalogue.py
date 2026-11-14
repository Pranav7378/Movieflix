"""CINECUE Catalogue Schemas.

Pydantic v2 schemas for the Universal Catalogue API.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Generic, List, Optional, TypeVar
import uuid

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class GenreBrief(BaseModel):
    id: int
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)


class IdentifierBrief(BaseModel):
    provider: str
    external_id: str

    model_config = ConfigDict(from_attributes=True)


class EpisodeBrief(BaseModel):
    id: uuid.UUID
    episode_number: int
    title: str
    overview: Optional[str] = None
    air_date: Optional[date] = None
    runtime_minutes: Optional[int] = None
    still_path: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SeasonBrief(BaseModel):
    id: uuid.UUID
    season_number: int
    title: Optional[str] = None
    overview: Optional[str] = None
    air_date: Optional[date] = None
    episode_count: int = 0
    poster_path: Optional[str] = None
    episodes: Optional[List[EpisodeBrief]] = None

    model_config = ConfigDict(from_attributes=True)


class ContentItemSummary(BaseModel):
    id: uuid.UUID
    content_type: str
    visual_format: str
    is_anime: bool
    title: str
    original_title: Optional[str] = None
    original_language: str = "en"
    release_year: Optional[int] = None
    release_date: Optional[date] = None
    runtime_minutes: Optional[int] = None
    total_seasons: Optional[int] = None
    total_episodes: Optional[int] = None
    status: str = "Released"
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    popularity_score: Optional[Decimal] = None
    tmdb_vote_average: Optional[Decimal] = None
    imdb_rating: Optional[Decimal] = None
    imdb_id: Optional[str] = None
    genres: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class UserInteractionStatus(BaseModel):
    is_watchlisted: bool = False
    is_watched: bool = False
    watched_at: Optional[datetime] = None
    rating: Optional[Decimal] = None
    is_dismissed: bool = False


class ContentItemDetail(ContentItemSummary):
    tagline: Optional[str] = None
    tmdb_vote_count: int = 0
    imdb_vote_count: int = 0
    is_adult: bool = False
    metadata_source: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    identifiers: List[IdentifierBrief] = Field(default_factory=list)
    seasons: Optional[List[SeasonBrief]] = None
    user_interaction: Optional[UserInteractionStatus] = None


class CataloguePaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    has_more: bool
