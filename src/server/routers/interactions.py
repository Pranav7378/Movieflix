from __future__ import annotations

from typing import Any, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, joinedload

from ..db.models import ContentIdentifier, ContentItem, User, UserContentInteraction, utcnow
from ..db.postgres import get_db
from ..schemas.interactions import (
    ContentItemBrief,
    DismissActionIn,
    InteractionResponse,
    PaginatedResponse,
    RatingUpdateIn,
    WatchedActionIn,
    WatchlistActionIn,
)
from ..services.auth_service import get_current_owner

router = APIRouter(prefix="/api/interactions", tags=["interactions"])


def _to_response(interaction: UserContentInteraction) -> InteractionResponse:
    content_brief = None
    if interaction.content:
        c = interaction.content
        imdb_id = None
        if c.identifiers:
            for ident in c.identifiers:
                if ident.provider == "imdb":
                    imdb_id = ident.external_id
                    break
        content_brief = ContentItemBrief(
            id=c.id,
            content_type=c.content_type,
            visual_format=c.visual_format,
            is_anime=c.is_anime,
            title=c.title,
            release_year=c.release_year,
            poster_path=c.poster_path,
            backdrop_path=c.backdrop_path,
            imdb_rating=c.imdb_rating,
            imdb_id=imdb_id,
        )

    return InteractionResponse(
        id=interaction.id,
        content_id=interaction.content_id,
        is_watchlisted=interaction.is_watchlisted,
        watchlist_added_at=interaction.watchlist_added_at,
        watched_at=interaction.watched_at,
        rating=interaction.rating,
        rating_updated_at=interaction.rating_updated_at,
        is_dismissed=interaction.is_dismissed,
        dismissed_at=interaction.dismissed_at,
        user_notes=interaction.user_notes,
        content=content_brief,
    )


def _get_or_create_interaction(
    db: Session, user_id: uuid.UUID, content_id: uuid.UUID
) -> UserContentInteraction:
    content = db.scalar(select(ContentItem).where(ContentItem.id == content_id))
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ContentItem '{content_id}' not found.",
        )

    interaction = db.scalar(
        select(UserContentInteraction)
        .options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
        .where(
            UserContentInteraction.user_id == user_id,
            UserContentInteraction.content_id == content_id,
        )
    )

    if not interaction:
        interaction = UserContentInteraction(
            user_id=user_id,
            content_id=content_id,
            is_watchlisted=False,
            is_dismissed=False,
        )
        db.add(interaction)
        db.flush()
        db.refresh(interaction)

    return interaction


# =====================================================================
# 1. Collection Queries (Watchlist, Watched, All Interactions)
# =====================================================================
@router.get("", response_model=PaginatedResponse[InteractionResponse])
def get_all_interactions(
    status_filter: Optional[str] = Query(None, alias="filter", pattern="^(watchlist|watched|dismissed)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve all interactions for the authenticated owner with optional filter."""
    base_query = select(UserContentInteraction).where(UserContentInteraction.user_id == owner.id)

    if status_filter == "watchlist":
        base_query = base_query.where(UserContentInteraction.is_watchlisted.is_(True))
    elif status_filter == "watched":
        base_query = base_query.where(UserContentInteraction.watched_at.isnot(None))
    elif status_filter == "dismissed":
        base_query = base_query.where(UserContentInteraction.is_dismissed.is_(True))

    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0
    offset = (page - 1) * limit

    items = list(
        db.scalars(
            base_query.options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
            .order_by(desc(UserContentInteraction.updated_at))
            .offset(offset)
            .limit(limit)
        ).unique().all()
    )

    return PaginatedResponse(
        items=[_to_response(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        has_more=(offset + limit) < total,
    )


@router.get("/watchlist", response_model=PaginatedResponse[InteractionResponse])
def get_watchlist(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve owner's active watchlist ordered by recently added."""
    query = (
        select(UserContentInteraction)
        .where(
            UserContentInteraction.user_id == owner.id,
            UserContentInteraction.is_watchlisted.is_(True),
        )
    )
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    offset = (page - 1) * limit

    items = list(
        db.scalars(
            query.options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
            .order_by(desc(UserContentInteraction.watchlist_added_at))
            .offset(offset)
            .limit(limit)
        ).unique().all()
    )

    return PaginatedResponse(
        items=[_to_response(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        has_more=(offset + limit) < total,
    )


@router.get("/watched", response_model=PaginatedResponse[InteractionResponse])
def get_watched(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Retrieve owner's cinema diary (watched titles) ordered by recently watched."""
    query = (
        select(UserContentInteraction)
        .where(
            UserContentInteraction.user_id == owner.id,
            UserContentInteraction.watched_at.isnot(None),
        )
    )
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    offset = (page - 1) * limit

    items = list(
        db.scalars(
            query.options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
            .order_by(desc(UserContentInteraction.watched_at))
            .offset(offset)
            .limit(limit)
        ).unique().all()
    )

    return PaginatedResponse(
        items=[_to_response(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        has_more=(offset + limit) < total,
    )


@router.get("/{content_id}", response_model=InteractionResponse)
def get_interaction(
    content_id: uuid.UUID,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Get owner's interaction state for a specific content item."""
    interaction = db.scalar(
        select(UserContentInteraction)
        .options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
        .where(
            UserContentInteraction.user_id == owner.id,
            UserContentInteraction.content_id == content_id,
        )
    )
    if not interaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No interaction recorded for this title.",
        )
    return _to_response(interaction)


# =====================================================================
# 2. Watchlist State Transitions
# =====================================================================
@router.post("/watchlist", response_model=InteractionResponse)
def add_to_watchlist(
    action: WatchlistActionIn,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Add a content item to the owner's watchlist."""
    interaction = _get_or_create_interaction(db, owner.id, action.content_id)
    interaction.is_watchlisted = True
    interaction.watchlist_added_at = utcnow()
    interaction.updated_at = utcnow()
    db.commit()
    db.refresh(interaction)
    return _to_response(interaction)


@router.delete("/watchlist/{content_id}", response_model=InteractionResponse)
def remove_from_watchlist(
    content_id: uuid.UUID,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Remove title from watchlist without deleting rating or watched status."""
    interaction = db.scalar(
        select(UserContentInteraction)
        .options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
        .where(
            UserContentInteraction.user_id == owner.id,
            UserContentInteraction.content_id == content_id,
        )
    )
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found.")

    interaction.is_watchlisted = False
    interaction.watchlist_added_at = None
    interaction.updated_at = utcnow()
    db.commit()
    db.refresh(interaction)
    return _to_response(interaction)


# =====================================================================
# 3. Watched & Rating State Transitions
# =====================================================================
@router.post("/watched", response_model=InteractionResponse)
def mark_as_watched(
    action: WatchedActionIn,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Mark a title as watched. Mandates an explicit half-star rating (1.0 to 5.0)."""
    interaction = _get_or_create_interaction(db, owner.id, action.content_id)
    now = utcnow()
    interaction.watched_at = now
    interaction.rating = action.rating
    interaction.rating_updated_at = now
    if action.user_notes is not None:
        interaction.user_notes = action.user_notes
    # Marking watched clears any prior dismissal
    interaction.is_dismissed = False
    interaction.dismissed_at = None
    interaction.updated_at = now

    db.commit()
    db.refresh(interaction)
    return _to_response(interaction)


@router.patch("/rating", response_model=InteractionResponse)
def update_rating(
    action: RatingUpdateIn,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Update personal rating for a content item."""
    interaction = db.scalar(
        select(UserContentInteraction)
        .options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
        .where(
            UserContentInteraction.user_id == owner.id,
            UserContentInteraction.content_id == action.content_id,
        )
    )
    if not interaction:
        interaction = _get_or_create_interaction(db, owner.id, action.content_id)

    now = utcnow()
    interaction.rating = action.rating
    interaction.rating_updated_at = now
    interaction.updated_at = now
    db.commit()
    db.refresh(interaction)
    return _to_response(interaction)


@router.delete("/watched/{content_id}", response_model=InteractionResponse)
def undo_watched_status(
    content_id: uuid.UUID,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Undo watched status while retaining personal rating."""
    interaction = db.scalar(
        select(UserContentInteraction)
        .options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
        .where(
            UserContentInteraction.user_id == owner.id,
            UserContentInteraction.content_id == content_id,
        )
    )
    if not interaction or not interaction.watched_at:
        raise HTTPException(status_code=404, detail="Title is not marked as watched.")

    interaction.watched_at = None
    # Rating is preserved per specification
    interaction.updated_at = utcnow()
    db.commit()
    db.refresh(interaction)
    return _to_response(interaction)


# =====================================================================
# 4. Dismissal State Transitions
# =====================================================================
@router.post("/dismiss", response_model=InteractionResponse)
def dismiss_content(
    action: DismissActionIn,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Dismiss a title to exclude it from recommendation feeds."""
    interaction = _get_or_create_interaction(db, owner.id, action.content_id)
    now = utcnow()
    interaction.is_dismissed = True
    interaction.dismissed_at = now
    interaction.updated_at = now
    db.commit()
    db.refresh(interaction)
    return _to_response(interaction)


@router.delete("/dismiss/{content_id}", response_model=InteractionResponse)
def restore_dismissed_content(
    content_id: uuid.UUID,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> Any:
    """Reverse title dismissal and make it eligible for recommendations."""
    interaction = db.scalar(
        select(UserContentInteraction)
        .options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
        .where(
            UserContentInteraction.user_id == owner.id,
            UserContentInteraction.content_id == content_id,
        )
    )
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found.")

    interaction.is_dismissed = False
    interaction.dismissed_at = None
    interaction.updated_at = utcnow()
    db.commit()
    db.refresh(interaction)
    return _to_response(interaction)

