from decimal import Decimal
from typing import Any, Optional
import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from ..db.models import ContentIdentifier, ContentItem, User, UserContentInteraction, utcnow
from ..db.postgres import get_db
from ..services.auth_service import get_current_owner
from ..services.movie_service import get_movie

router = APIRouter(prefix="/api", tags=["history"])


class HistoryItemIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=128)
    imdb_id: str = Field(min_length=1, max_length=20)
    movie_title: str = Field(min_length=1, max_length=300)
    progress: float = Field(default=100.0, ge=0, le=100)
    rating: Optional[float] = Field(None, ge=1.0, le=5.0)


def _resolve_content_item(db: Session, imdb_id: str, title: str) -> ContentItem:
    stmt = (
        select(ContentItem)
        .join(ContentIdentifier, ContentIdentifier.content_id == ContentItem.id)
        .where(ContentIdentifier.provider == "imdb", ContentIdentifier.external_id == imdb_id)
    )
    item = db.scalar(stmt)
    if not item:
        movie = get_movie(db, imdb_id, with_trailer=False)
        item = db.scalar(stmt)
        if not item:
            item = ContentItem(
                id=uuid.uuid4(),
                content_type="movie",
                title=title,
            )
            db.add(item)
            db.flush()
            db.add(ContentIdentifier(content_id=item.id, provider="imdb", external_id=imdb_id))
            db.commit()
            db.refresh(item)
    if item and title and title != "Unknown Title":
        item.title = title
        db.commit()
    return item


@router.post("/history")
def add_to_history(
    item_in: HistoryItemIn,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Add or update a movie in viewing history for the authenticated owner."""
    content = _resolve_content_item(db, item_in.imdb_id, item_in.movie_title)

    interaction = db.scalar(
        select(UserContentInteraction).where(
            UserContentInteraction.user_id == owner.id,
            UserContentInteraction.content_id == content.id,
        )
    )
    now = utcnow()
    if not interaction:
        interaction = UserContentInteraction(
            user_id=owner.id,
            content_id=content.id,
            watched_at=now,
            rating=Decimal(str(item_in.rating)) if item_in.rating is not None else Decimal("5.0"),
            rating_updated_at=now if item_in.rating is not None else None,
        )
        db.add(interaction)
    else:
        interaction.watched_at = now
        if item_in.rating is not None:
            interaction.rating = Decimal(str(item_in.rating))
            interaction.rating_updated_at = now
        elif interaction.rating is None:
            interaction.rating = Decimal("5.0")
        interaction.updated_at = now

    db.commit()
    db.refresh(interaction)

    return {
        "message": "History updated",
        "data": {
            "imdb_id": item_in.imdb_id,
            "movie_title": item_in.movie_title,
            "progress": item_in.progress,
            "last_watched": interaction.watched_at.isoformat() if interaction.watched_at else None,
            "rating": float(interaction.rating) if interaction.rating else None,
        },
    }


@router.get("/history/{user_id}")
def get_history(
    user_id: str,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get owner's viewing history enriched with poster and metadata."""
    interactions = list(
        db.scalars(
            select(UserContentInteraction)
            .options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
            .where(
                UserContentInteraction.user_id == owner.id,
                UserContentInteraction.watched_at.isnot(None),
            )
            .order_by(desc(UserContentInteraction.watched_at))
            .limit(50)
        ).unique().all()
    )

    results: list[dict[str, Any]] = []
    for inter in interactions:
        c = inter.content
        if not c:
            continue
        imdb_id = next((i.external_id for i in c.identifiers if i.provider == "imdb"), None)
        movie = get_movie(db, imdb_id, with_trailer=False) if imdb_id else None

        results.append({
            "imdb_id": imdb_id or str(c.id),
            "content_id": str(c.id),
            "movie_title": c.title,
            "progress": 100.0,
            "last_watched": inter.watched_at.isoformat() if inter.watched_at else None,
            "rating": float(inter.rating) if inter.rating else None,
            "Poster": movie.get("Poster") if movie else c.poster_path,
            "Year": movie.get("Year") if movie else str(c.release_year or "N/A"),
            "imdbRating": movie.get("imdbRating") if movie else str(c.imdb_rating or "N/A"),
        })

    return results


@router.get("/continue-watching/{user_id}")
def get_continue_watching(
    user_id: str,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get continue watching titles."""
    return []
