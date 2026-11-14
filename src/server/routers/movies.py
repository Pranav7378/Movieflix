from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from ..db.models import HistoryItem
from ..db.postgres import get_db
from ..services.ml_service import ml_service
from ..services.movie_service import get_movie, get_movies
from ..services.omdb_service import search_movies

router = APIRouter(prefix="/api", tags=["movies"])

# Curated IMDb IDs. Results are cached in Postgres after the first request, so
# these external calls only happen once per movie.
TRENDING_IMDB_IDS = [
    "tt0111161",  # The Shawshank Redemption
    "tt0068646",  # The Godfather
    "tt0468569",  # The Dark Knight
    "tt0071562",  # The Godfather Part II
    "tt0050083",  # 12 Angry Men
    "tt0108052",  # Schindler's List
    "tt0167260",  # LOTR: The Return of the King
    "tt0110912",  # Pulp Fiction
    "tt0060196",  # The Good, the Bad and the Ugly
    "tt0137523",  # Fight Club
    "tt1375666",  # Inception
    "tt0109830",  # Forrest Gump
    "tt0133093",  # The Matrix
    "tt0816692",  # Interstellar
    "tt0073486",  # One Flew Over the Cuckoo's Nest
    "tt0099685",  # Goodfellas
    "tt0047478",  # Seven Samurai
    "tt0114369",  # Se7en
    "tt0317248",  # City of God
    "tt0102926",  # The Silence of the Lambs
]


def _trending(db: Session) -> list[dict[str, Any]]:
    return get_movies(db, TRENDING_IMDB_IDS[:10], with_trailer=True)


def _top_rated(db: Session) -> list[dict[str, Any]]:
    return get_movies(db, TRENDING_IMDB_IDS[10:], with_trailer=True)


@router.get("/trending")
def get_trending(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """Get trending movies (cached)."""
    return _trending(db)


@router.get("/top-rated")
def get_top_rated(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """Get top-rated movies (cached)."""
    return _top_rated(db)


@router.get("/movies/{imdb_id}")
def get_movie_details(imdb_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Get movie details by IMDb ID."""
    movie = get_movie(db, imdb_id, with_trailer=True)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@router.get("/search")
def search_movies_endpoint(
    query: str,
    page: int = Query(1, ge=1),
) -> list[dict[str, Any]]:
    """Search movies via OMDB."""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query parameter is required")

    results = search_movies(query, page)
    return results.get("Search", [])


@router.get("/filter")
def filter_movies(
    genre: str | None = Query(None),
    year: str | None = Query(None),
    type: str | None = Query(None),
) -> list[dict[str, Any]]:
    """Lightweight filter on top of OMDB text search.

    OMDB has no true genre browse endpoint, so this searches the genre keyword
    and applies local filters. Kept for the current UI.
    """
    if not genre:
        return []

    movies = search_movies(genre, 1).get("Search", [])
    if type:
        movies = [m for m in movies if m.get("Type", "").lower() == type.lower()]
    if year:
        movies = [m for m in movies if str(m.get("Year", "")).startswith(year)]
    return movies


def _enrich_movie_ids(
    db: Session, imdb_ids: list[str], limit: int = 10
) -> list[dict[str, Any]]:
    movies: list[dict[str, Any]] = []
    for imdb_id in imdb_ids:
        if not imdb_id:
            continue
        movie = get_movie(db, imdb_id, with_trailer=False)
        if movie:
            movies.append(movie)
        if len(movies) >= limit:
            break
    return movies


@router.get("/recommendations/personalized/{user_id}")
def get_personalized_recommendations(
    user_id: str,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Recommendations based on the user's most recently watched movie."""
    recent = list(
        db.scalars(
            select(HistoryItem)
            .where(HistoryItem.user_id == user_id)
            .order_by(desc(HistoryItem.last_watched))
            .limit(3)
        ).all()
    )

    if not recent:
        return _trending(db)

    watched_ids = set(
        db.scalars(
            select(HistoryItem.imdb_id).where(HistoryItem.user_id == user_id)
        ).all()
    )

    similar = ml_service.get_similar_movies_by_imdb(recent[0].imdb_id, limit=30)
    candidate_ids = [
        movie["imdb_id"]
        for movie in similar
        if movie["imdb_id"] not in watched_ids
    ]
    recommendations = _enrich_movie_ids(db, candidate_ids, limit=10)
    return recommendations or _trending(db)


@router.get("/recommendations/{imdb_id}")
def get_recommendations(
    imdb_id: str,
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Content-based "More Like This" recommendations by IMDb ID."""
    similar = ml_service.get_similar_movies_by_imdb(imdb_id, limit=limit)
    return _enrich_movie_ids(db, [movie["imdb_id"] for movie in similar], limit=limit)
