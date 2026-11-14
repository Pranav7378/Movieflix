from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from ..db.models import ContentIdentifier, ContentItem, User, UserContentInteraction, utcnow
from ..db.postgres import get_db
from ..services.auth_service import get_current_owner
from ..services.movie_service import get_movie

router = APIRouter(prefix="/api", tags=["watchlist"])


class WatchlistItemIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=128)
    imdb_id: str = Field(min_length=1, max_length=20)
    movie_title: str = Field(min_length=1, max_length=300)


def _resolve_content_item(db: Session, imdb_id: str, title: str) -> ContentItem:
    stmt = (
        select(ContentItem)
        .join(ContentIdentifier, ContentIdentifier.content_id == ContentItem.id)
        .where(ContentIdentifier.provider == "imdb", ContentIdentifier.external_id == imdb_id)
    )
    item = db.scalar(stmt)
    if not item:
        # Fetch or bootstrap ContentItem via movie_service
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
    return item


@router.post("/watchlist")
def add_to_watchlist(
    item_in: WatchlistItemIn,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Add a movie to the owner's watchlist."""
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
            is_watchlisted=True,
            watchlist_added_at=now,
        )
        db.add(interaction)
    else:
        interaction.is_watchlisted = True
        interaction.watchlist_added_at = now
        interaction.updated_at = now

    db.commit()
    movie = get_movie(db, item_in.imdb_id, with_trailer=False)
    return movie or {
        "id": str(content.id),
        "imdbID": item_in.imdb_id,
        "Title": item_in.movie_title,
        "Year": "N/A",
        "Poster": "N/A",
        "Type": "movie",
    }


@router.get("/watchlist/{user_id}")
def get_watchlist(
    user_id: str,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get owner's active watchlist."""
    interactions = list(
        db.scalars(
            select(UserContentInteraction)
            .options(joinedload(UserContentInteraction.content).joinedload(ContentItem.identifiers))
            .where(
                UserContentInteraction.user_id == owner.id,
                UserContentInteraction.is_watchlisted.is_(True),
            )
            .order_by(desc(UserContentInteraction.watchlist_added_at))
        ).unique().all()
    )

    results: list[dict[str, Any]] = []
    for inter in interactions:
        c = inter.content
        if not c:
            continue
        imdb_id = next((i.external_id for i in c.identifiers if i.provider == "imdb"), None)
        if imdb_id:
            movie = get_movie(db, imdb_id, with_trailer=False)
            if movie:
                results.append(movie)
                continue
        results.append({
            "id": str(c.id),
            "imdbID": imdb_id or str(c.id),
            "Title": c.title,
            "Year": str(c.release_year or "N/A"),
            "Poster": c.poster_path or "N/A",
            "Type": c.content_type,
            "imdbRating": str(c.imdb_rating or "N/A"),
        })

    return results


@router.delete("/watchlist/{user_id}/{imdb_id}")
def remove_from_watchlist(
    user_id: str,
    imdb_id: str,
    owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Remove a movie from the owner's watchlist."""
    stmt = (
        select(UserContentInteraction)
        .join(ContentItem, ContentItem.id == UserContentInteraction.content_id)
        .join(ContentIdentifier, ContentIdentifier.content_id == ContentItem.id)
        .where(
            UserContentInteraction.user_id == owner.id,
            ContentIdentifier.provider == "imdb",
            ContentIdentifier.external_id == imdb_id,
        )
    )
    interaction = db.scalar(stmt)
    if not interaction:
        raise HTTPException(status_code=404, detail="Item not found in watchlist")

    interaction.is_watchlisted = False
    interaction.watchlist_added_at = None
    interaction.updated_at = utcnow()
    db.commit()

    return {"message": "Removed from watchlist"}
