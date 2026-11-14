from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Generic, List, Optional, TypeVar
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    has_more: bool


class ContentItemBrief(BaseModel):
    id: uuid.UUID
    content_type: str
    visual_format: str
    is_anime: bool
    title: str
    release_year: Optional[int] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    imdb_rating: Optional[Decimal] = None
    imdb_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class InteractionResponse(BaseModel):
    id: uuid.UUID
    content_id: uuid.UUID
    is_watchlisted: bool
    watchlist_added_at: Optional[datetime] = None
    watched_at: Optional[datetime] = None
    rating: Optional[Decimal] = None
    rating_updated_at: Optional[datetime] = None
    is_dismissed: bool
    dismissed_at: Optional[datetime] = None
    user_notes: Optional[str] = None
    content: Optional[ContentItemBrief] = None

    model_config = ConfigDict(from_attributes=True)


class WatchlistActionIn(BaseModel):
    content_id: uuid.UUID


class WatchedActionIn(BaseModel):
    content_id: uuid.UUID
    rating: Decimal = Field(
        ...,
        ge=Decimal("1.0"),
        le=Decimal("5.0"),
        description="Rating from 1.0 to 5.0 in 0.5 increments",
    )
    user_notes: Optional[str] = Field(None, max_length=2000)

    @field_validator("rating")
    @classmethod
    def validate_half_star(cls, v: Decimal) -> Decimal:
        if (v * 2) % 1 != 0:
            raise ValueError(
                "Rating must be in increments of 0.5 stars (e.g. 1.0, 1.5, 2.0, 2.5 ... 5.0)"
            )
        return v


class RatingUpdateIn(BaseModel):
    content_id: uuid.UUID
    rating: Decimal = Field(
        ...,
        ge=Decimal("1.0"),
        le=Decimal("5.0"),
        description="Rating from 1.0 to 5.0 in 0.5 increments",
    )

    @field_validator("rating")
    @classmethod
    def validate_half_star(cls, v: Decimal) -> Decimal:
        if (v * 2) % 1 != 0:
            raise ValueError("Rating must be in increments of 0.5 stars")
        return v


class DismissActionIn(BaseModel):
    content_id: uuid.UUID

