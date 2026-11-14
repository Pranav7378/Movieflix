from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, desc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..db.models import WatchlistItem
from ..db.postgres import get_db
from ..services.movie_service import get_movie

router = APIRouter(prefix="/api", tags=["watchlist"])


class WatchlistItemIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=128)
    imdb_id: str = Field(min_length=1, max_length=20)
    movie_title: str = Field(min_length=1, max_length=300)


def _movie_or_fallback(db: Session, imdb_id: str, title: str) -> dict[str, Any]:
    movie = get_movie(db, imdb_id, with_trailer=False)
    if movie:
        return movie
    return {
        "imdbID": imdb_id,
        "Title": title,
        "Year": "N/A",
        "Poster": "N/A",
        "Type": "movie",
    }


@router.post("/watchlist")
def add_to_watchlist(
    item: WatchlistItemIn,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Add a movie to the user's watchlist and return the full movie object."""
    existing = db.scalar(
        select(WatchlistItem).where(
            WatchlistItem.user_id == item.user_id,
            WatchlistItem.imdb_id == item.imdb_id,
        )
    )

    if existing is None:
        db.add(
            WatchlistItem(
                user_id=item.user_id,
                imdb_id=item.imdb_id,
                movie_title=item.movie_title,
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()

    return _movie_or_fallback(db, item.imdb_id, item.movie_title)


@router.get("/watchlist/{user_id}")
def get_watchlist(
    user_id: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get the user's watchlist with full movie data."""
    rows = list(
        db.scalars(
            select(WatchlistItem)
            .where(WatchlistItem.user_id == user_id)
            .order_by(desc(WatchlistItem.added_at))
        ).all()
    )

    return [
        _movie_or_fallback(db, row.imdb_id, row.movie_title)
        for row in rows
    ]


@router.delete("/watchlist/{user_id}/{imdb_id}")
def remove_from_watchlist(
    user_id: str,
    imdb_id: str,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Remove a movie from the watchlist."""
    result = db.execute(
        delete(WatchlistItem).where(
            WatchlistItem.user_id == user_id,
            WatchlistItem.imdb_id == imdb_id,
        )
    )
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found in watchlist")

    return {"message": "Removed from watchlist"}
