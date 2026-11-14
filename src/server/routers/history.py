from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from ..db.models import HistoryItem, utcnow
from ..db.postgres import get_db
from ..services.movie_service import get_movie

router = APIRouter(prefix="/api", tags=["history"])


class HistoryItemIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=128)
    imdb_id: str = Field(min_length=1, max_length=20)
    movie_title: str = Field(min_length=1, max_length=300)
    progress: float = Field(ge=0, le=100)


def _serialize(row: HistoryItem) -> dict[str, Any]:
    return {
        "imdb_id": row.imdb_id,
        "movie_title": row.movie_title,
        "progress": row.progress,
        "last_watched": row.last_watched.isoformat() if row.last_watched else None,
    }


@router.post("/history")
def add_to_history(
    item: HistoryItemIn,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Add or update a movie in viewing history."""
    row = db.scalar(
        select(HistoryItem).where(
            HistoryItem.user_id == item.user_id,
            HistoryItem.imdb_id == item.imdb_id,
        )
    )

    if row is None:
        row = HistoryItem(
            user_id=item.user_id,
            imdb_id=item.imdb_id,
            movie_title=item.movie_title,
            progress=item.progress,
        )
        db.add(row)
    else:
        row.movie_title = item.movie_title
        row.progress = item.progress
        row.last_watched = utcnow()

    db.commit()
    db.refresh(row)

    return {"message": "History updated", "data": _serialize(row)}


@router.get("/history/{user_id}")
def get_history(
    user_id: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Get the user's viewing history enriched with movie metadata."""
    rows = list(
        db.scalars(
            select(HistoryItem)
            .where(HistoryItem.user_id == user_id)
            .order_by(desc(HistoryItem.last_watched))
            .limit(50)
        ).all()
    )
    results: list[dict[str, Any]] = []
    for row in rows:
        data = _serialize(row)
        movie = get_movie(db, row.imdb_id, with_trailer=False)
        if movie:
            data["Poster"] = movie.get("Poster")
            data["Year"] = movie.get("Year")
            data["Genre"] = movie.get("Genre")
            data["imdbRating"] = movie.get("imdbRating")
        results.append(data)
    return results


@router.get("/continue-watching/{user_id}")
def get_continue_watching(
    user_id: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Movies the user has started but not finished (5% < progress < 95%)."""
    rows = list(
        db.scalars(
            select(HistoryItem)
            .where(
                HistoryItem.user_id == user_id,
                HistoryItem.progress > 5,
                HistoryItem.progress < 95,
            )
            .order_by(desc(HistoryItem.last_watched))
            .limit(10)
        ).all()
    )

    movies: list[dict[str, Any]] = []
    for row in rows:
        movie = get_movie(db, row.imdb_id, with_trailer=False)
        if movie is None:
            continue
        movie["progress"] = row.progress
        movies.append(movie)
    return movies
