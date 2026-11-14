from decimal import Decimal
import re
from typing import Any, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..config import settings
from ..db.models import ContentIdentifier, ContentItem
from .omdb_service import fetch_movie_by_imdb
from .youtube_service import search_movie_trailer


def _parse_int(val: Any) -> Optional[int]:
    if not val or val == "N/A":
        return None
    match = re.search(r"\d+", str(val).replace(",", ""))
    return int(match.group()) if match else None


def _parse_decimal(val: Any) -> Optional[Decimal]:
    if not val or val == "N/A":
        return None
    try:
        return Decimal(str(val))
    except Exception:
        return None


def _content_to_movie_dict(item: ContentItem, imdb_id: str, trailer_url: Optional[str] = None) -> dict[str, Any]:
    runtime_str = f"{item.runtime_minutes} min" if item.runtime_minutes else "N/A"
    return {
        "id": str(item.id),
        "content_id": str(item.id),
        "imdbID": imdb_id,
        "Title": item.title,
        "Year": str(item.release_year) if item.release_year else "N/A",
        "Poster": item.poster_path or "N/A",
        "Plot": item.overview or "N/A",
        "Runtime": runtime_str,
        "imdbRating": str(item.imdb_rating) if item.imdb_rating else "N/A",
        "Type": item.content_type,
        "visual_format": item.visual_format,
        "is_anime": item.is_anime,
        "trailer_url": trailer_url,
    }


def get_movie(
    db: Session,
    imdb_id: str,
    *,
    with_trailer: bool = False,
) -> dict | None:
    """Return a movie from universal ContentItem, fetching OMDB/YouTube at most once."""
    # 1. Look up existing ContentItem via ContentIdentifier
    stmt = (
        select(ContentItem)
        .join(ContentIdentifier, ContentIdentifier.content_id == ContentItem.id)
        .where(
            ContentIdentifier.provider == "imdb",
            ContentIdentifier.external_id == imdb_id,
        )
    )
    item = db.scalar(stmt)

    if item is not None:
        trailer_url = None
        if with_trailer and settings.ENABLE_TRAILERS and settings.YOUTUBE_API_KEY:
            trailer_url = search_movie_trailer(item.title, str(item.release_year or ""))
        return _content_to_movie_dict(item, imdb_id, trailer_url)

    # 2. Fetch fresh data from OMDB API
    data = fetch_movie_by_imdb(imdb_id)
    if data is None:
        return None

    trailer_url = None
    if with_trailer and settings.ENABLE_TRAILERS and settings.YOUTUBE_API_KEY:
        trailer_url = search_movie_trailer(data.get("Title", ""), data.get("Year", ""))

    content_type = "series" if data.get("Type") == "series" else "movie"
    genre_str = data.get("Genre", "").lower()
    country_str = data.get("Country", "").lower()
    visual_format = "animation" if "animation" in genre_str else "live_action"
    is_anime = ("japan" in country_str and "animation" in genre_str) or ("anime" in genre_str)

    item = ContentItem(
        id=uuid.uuid4(),
        content_type=content_type,
        visual_format=visual_format,
        is_anime=is_anime,
        title=data.get("Title") or "Untitled",
        overview=data.get("Plot"),
        poster_path=data.get("Poster"),
        release_year=_parse_int(data.get("Year")),
        runtime_minutes=_parse_int(data.get("Runtime")),
        imdb_rating=_parse_decimal(data.get("imdbRating")),
        imdb_vote_count=_parse_int(data.get("imdbVotes")) or 0,
    )
    db.add(item)
    db.flush()

    ident = ContentIdentifier(
        content_id=item.id,
        provider="imdb",
        external_id=imdb_id,
    )
    db.add(ident)

    try:
        db.commit()
        db.refresh(item)
    except IntegrityError:
        db.rollback()
        item = db.scalar(stmt)
        if item is None:
            return None

    return _content_to_movie_dict(item, imdb_id, trailer_url)


def get_movies(
    db: Session,
    imdb_ids: list[str],
    *,
    with_trailer: bool = False,
) -> list[dict]:
    """Enrich a list of IMDb IDs, skipping any that cannot be resolved."""
    movies: list[dict] = []
    for imdb_id in imdb_ids:
        movie = get_movie(db, imdb_id, with_trailer=with_trailer)
        if movie is not None:
            movies.append(movie)
    return movies
