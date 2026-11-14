"""CINECUE Universal Catalogue Router.

Provides unified endpoints for discovering, searching, filtering, and inspecting
movies and TV series across all formats and animation classifications.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import asc, desc, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from ..db.models import (
    ContentGenre,
    ContentIdentifier,
    ContentItem,
    Episode,
    Genre,
    Season,
    User,
    UserContentInteraction,
)
from ..db.postgres import get_db
from ..schemas.catalogue import (
    CataloguePaginatedResponse,
    ContentItemDetail,
    ContentItemSummary,
    EpisodeBrief,
    GenreBrief,
    IdentifierBrief,
    SeasonBrief,
    UserInteractionStatus,
)
from ..services.auth_service import get_optional_owner

router = APIRouter(prefix="/api/catalogue", tags=["catalogue"])


def _extract_imdb_id(item: ContentItem) -> Optional[str]:
    """Helper to find IMDb ID from attached identifiers."""
    if item.identifiers:
        for ident in item.identifiers:
            if ident.provider == "imdb":
                return ident.external_id
    return None


def _to_summary(item: ContentItem) -> ContentItemSummary:
    """Transform ContentItem model to ContentItemSummary schema."""
    genre_names = [g.name for g in item.genres] if item.genres else []
    return ContentItemSummary(
        id=item.id,
        content_type=item.content_type,
        visual_format=item.visual_format,
        is_anime=item.is_anime,
        title=item.title,
        original_title=item.original_title,
        original_language=item.original_language,
        release_year=item.release_year,
        release_date=item.release_date,
        runtime_minutes=item.runtime_minutes,
        total_seasons=item.total_seasons,
        total_episodes=item.total_episodes,
        status=item.status,
        overview=item.overview,
        poster_path=item.poster_path,
        backdrop_path=item.backdrop_path,
        popularity_score=item.popularity_score,
        tmdb_vote_average=item.tmdb_vote_average,
        imdb_rating=item.imdb_rating,
        imdb_id=_extract_imdb_id(item),
        genres=genre_names,
    )


# =====================================================================
# 1. Unified Catalogue Discovery & Browsing
# =====================================================================
@router.get("", response_model=CataloguePaginatedResponse[ContentItemSummary])
def get_catalogue(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    content_type: Optional[str] = Query(None, pattern="^(movie|series)$"),
    genre: Optional[str] = Query(None),
    visual_format: Optional[str] = Query(None, pattern="^(live_action|animation)$"),
    is_anime: Optional[bool] = Query(None),
    language: Optional[str] = Query(None),
    release_year: Optional[int] = Query(None),
    min_year: Optional[int] = Query(None),
    max_year: Optional[int] = Query(None),
    sort_by: str = Query("popularity", pattern="^(popularity|rating|release_date|title)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    owner: Optional[User] = Depends(get_optional_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve unified catalogue of movies and series with flexible multi-attribute filters."""
    query = select(ContentItem)

    # Content Type filter ('movie' | 'series')
    if content_type:
        query = query.where(ContentItem.content_type == content_type)

    # Visual Format filter ('live_action' | 'animation')
    if visual_format:
        query = query.where(ContentItem.visual_format == visual_format)

    # Anime classification filter (Boolean)
    if is_anime is not None:
        query = query.where(ContentItem.is_anime.is_(is_anime))

    # Language filter
    if language:
        query = query.where(ContentItem.original_language == language.lower())

    # Release Year filters
    if release_year:
        query = query.where(ContentItem.release_year == release_year)
    else:
        if min_year:
            query = query.where(ContentItem.release_year >= min_year)
        if max_year:
            query = query.where(ContentItem.release_year <= max_year)

    # Genre filter (by name or slug)
    if genre:
        clean_genre = genre.strip()
        query = query.join(ContentGenre, ContentGenre.content_id == ContentItem.id).join(
            Genre, Genre.id == ContentGenre.genre_id
        ).where(
            (func.lower(Genre.name) == clean_genre.lower()) | (Genre.slug == clean_genre.lower())
        )

    # Exclude dismissed titles if owner is authenticated
    if owner:
        dismissed_subq = (
            select(UserContentInteraction.content_id)
            .where(
                UserContentInteraction.user_id == owner.id,
                UserContentInteraction.is_dismissed.is_(True),
            )
            .scalar_subquery()
        )
        query = query.where(ContentItem.id.not_in(dismissed_subq))

    # Count total matching
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0

    # Sorting
    is_desc = sort_order.lower() == "desc"
    order_func = desc if is_desc else asc

    if sort_by == "rating":
        order_col = order_func(func.coalesce(ContentItem.tmdb_vote_average, ContentItem.imdb_rating, 0))
    elif sort_by == "release_date":
        order_col = order_func(func.coalesce(ContentItem.release_date, ContentItem.release_year, 0))
    elif sort_by == "title":
        order_col = order_func(ContentItem.title)
    else:  # default 'popularity'
        order_col = order_func(func.coalesce(ContentItem.popularity_score, 0))

    offset = (page - 1) * limit
    items = list(
        db.scalars(
            query.options(
                selectinload(ContentItem.genres),
                selectinload(ContentItem.identifiers),
            )
            .order_by(order_col)
            .offset(offset)
            .limit(limit)
        ).unique().all()
    )

    return CataloguePaginatedResponse(
        items=[_to_summary(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        has_more=(offset + limit) < total,
    )


# =====================================================================
# 2. Catalogue Search
# =====================================================================
@router.get("/search", response_model=CataloguePaginatedResponse[ContentItemSummary])
def search_catalogue(
    q: str = Query(..., min_length=1),
    content_type: Optional[str] = Query(None, pattern="^(movie|series)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    owner: Optional[User] = Depends(get_optional_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Search catalogue titles and overviews using fuzzy text search."""
    search_term = f"%{q.strip()}%"
    query = select(ContentItem).where(
        (ContentItem.title.ilike(search_term))
        | (ContentItem.original_title.ilike(search_term))
        | (ContentItem.overview.ilike(search_term))
    )

    if content_type:
        query = query.where(ContentItem.content_type == content_type)

    if owner:
        dismissed_subq = (
            select(UserContentInteraction.content_id)
            .where(
                UserContentInteraction.user_id == owner.id,
                UserContentInteraction.is_dismissed.is_(True),
            )
            .scalar_subquery()
        )
        query = query.where(ContentItem.id.not_in(dismissed_subq))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    offset = (page - 1) * limit

    items = list(
        db.scalars(
            query.options(
                selectinload(ContentItem.genres),
                selectinload(ContentItem.identifiers),
            )
            .order_by(desc(ContentItem.popularity_score), desc(ContentItem.release_year))
            .offset(offset)
            .limit(limit)
        ).unique().all()
    )

    return CataloguePaginatedResponse(
        items=[_to_summary(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        has_more=(offset + limit) < total,
    )


# =====================================================================
# 3. Trending & Popular Endpoints
# =====================================================================
@router.get("/trending", response_model=List[ContentItemSummary])
def get_trending(
    limit: int = Query(20, ge=1, le=50),
    owner: Optional[User] = Depends(get_optional_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve top trending items across movies and TV series."""
    query = select(ContentItem)
    if owner:
        dismissed_subq = (
            select(UserContentInteraction.content_id)
            .where(
                UserContentInteraction.user_id == owner.id,
                UserContentInteraction.is_dismissed.is_(True),
            )
            .scalar_subquery()
        )
        query = query.where(ContentItem.id.not_in(dismissed_subq))

    items = list(
        db.scalars(
            query.options(
                selectinload(ContentItem.genres),
                selectinload(ContentItem.identifiers),
            )
            .order_by(
                desc(func.coalesce(ContentItem.popularity_score, 0)),
                desc(func.coalesce(ContentItem.tmdb_vote_average, 0)),
            )
            .limit(limit)
        ).unique().all()
    )
    return [_to_summary(i) for i in items]


@router.get("/popular", response_model=List[ContentItemSummary])
def get_popular(
    content_type: Optional[str] = Query(None, pattern="^(movie|series)$"),
    limit: int = Query(20, ge=1, le=50),
    owner: Optional[User] = Depends(get_optional_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve top popular titles ordered by popularity score."""
    query = select(ContentItem)
    if content_type:
        query = query.where(ContentItem.content_type == content_type)

    if owner:
        dismissed_subq = (
            select(UserContentInteraction.content_id)
            .where(
                UserContentInteraction.user_id == owner.id,
                UserContentInteraction.is_dismissed.is_(True),
            )
            .scalar_subquery()
        )
        query = query.where(ContentItem.id.not_in(dismissed_subq))

    items = list(
        db.scalars(
            query.options(
                selectinload(ContentItem.genres),
                selectinload(ContentItem.identifiers),
            )
            .order_by(desc(ContentItem.popularity_score))
            .limit(limit)
        ).unique().all()
    )
    return [_to_summary(i) for i in items]


# =====================================================================
# 4. Taxonomy (Genres List)
# =====================================================================
@router.get("/genres", response_model=List[GenreBrief])
def get_genres(db: Session = Depends(get_db)) -> Any:
    """Retrieve normalized genres available in the catalogue."""
    genres = list(db.scalars(select(Genre).order_by(Genre.name)).all())
    return genres


# =====================================================================
# 5. Content Detail & Seasons Hierarchy
# =====================================================================
@router.get("/{content_id}", response_model=ContentItemDetail)
def get_content_detail(
    content_id: uuid.UUID,
    owner: Optional[User] = Depends(get_optional_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve complete metadata, external identifiers, and seasons for a title."""
    item = db.scalar(
        select(ContentItem)
        .options(
            selectinload(ContentItem.genres),
            selectinload(ContentItem.identifiers),
            selectinload(ContentItem.seasons),
        )
        .where(ContentItem.id == content_id)
    )
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content item not found in catalogue.",
        )

    # Check owner interaction status if authenticated
    user_status = None
    if owner:
        inter = db.scalar(
            select(UserContentInteraction).where(
                UserContentInteraction.user_id == owner.id,
                UserContentInteraction.content_id == content_id,
            )
        )
        if inter:
            user_status = UserInteractionStatus(
                is_watchlisted=inter.is_watchlisted,
                is_watched=inter.watched_at is not None,
                watched_at=inter.watched_at,
                rating=inter.rating,
                is_dismissed=inter.is_dismissed,
            )

    seasons_brief = None
    if item.content_type == "series" and item.seasons:
        seasons_brief = [
            SeasonBrief(
                id=s.id,
                season_number=s.season_number,
                title=s.title,
                overview=s.overview,
                air_date=s.air_date,
                episode_count=s.episode_count,
                poster_path=s.poster_path,
            )
            for s in sorted(item.seasons, key=lambda s: s.season_number)
        ]

    identifiers_brief = [
        IdentifierBrief(provider=i.provider, external_id=i.external_id)
        for i in (item.identifiers or [])
    ]

    summary = _to_summary(item)
    return ContentItemDetail(
        **summary.model_dump(),
        tagline=item.tagline,
        tmdb_vote_count=item.tmdb_vote_count,
        imdb_vote_count=item.imdb_vote_count,
        is_adult=item.is_adult,
        metadata_source=item.metadata_source,
        last_synced_at=item.last_synced_at,
        identifiers=identifiers_brief,
        seasons=seasons_brief,
        user_interaction=user_status,
    )


@router.get("/{content_id}/seasons", response_model=List[SeasonBrief])
def get_series_seasons(content_id: uuid.UUID, db: Session = Depends(get_db)) -> Any:
    """Retrieve all season records for a TV series."""
    item = db.get(ContentItem, content_id)
    if not item:
        raise HTTPException(status_code=404, detail="Title not found.")
    if item.content_type != "series":
        raise HTTPException(
            status_code=400,
            detail="Seasons are only applicable to TV series (movies do not have seasons).",
        )

    seasons = list(
        db.scalars(
            select(Season)
            .where(Season.series_id == content_id)
            .order_by(Season.season_number)
        ).all()
    )
    return [
        SeasonBrief(
            id=s.id,
            season_number=s.season_number,
            title=s.title,
            overview=s.overview,
            air_date=s.air_date,
            episode_count=s.episode_count,
            poster_path=s.poster_path,
        )
        for s in seasons
    ]


@router.get(
    "/{content_id}/seasons/{season_number}/episodes",
    response_model=List[EpisodeBrief],
)
def get_season_episodes(
    content_id: uuid.UUID,
    season_number: int,
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve episode metadata for a specific season of a TV series."""
    season = db.scalar(
        select(Season)
        .options(selectinload(Season.episodes))
        .where(
            Season.series_id == content_id,
            Season.season_number == season_number,
        )
    )
    if not season:
        raise HTTPException(
            status_code=404,
            detail=f"Season {season_number} not found for this series.",
        )

    return [
        EpisodeBrief(
            id=ep.id,
            episode_number=ep.episode_number,
            title=ep.title,
            overview=ep.overview,
            air_date=ep.air_date,
            runtime_minutes=ep.runtime_minutes,
            still_path=ep.still_path,
        )
        for ep in sorted(season.episodes, key=lambda e: e.episode_number)
    ]
