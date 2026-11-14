from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import settings
from ..db.models import MovieCache
from .omdb_service import fetch_movie_by_imdb
from .youtube_service import search_movie_trailer


def get_cached_movie(db: Session, imdb_id: str) -> dict | None:
    row = db.get(MovieCache, imdb_id)
    if row is None:
        return None

    data = dict(row.payload)
    if row.trailer_url:
        data["trailer_url"] = row.trailer_url
    return data


def get_movie(
    db: Session,
    imdb_id: str,
    *,
    with_trailer: bool = False,
) -> dict | None:
    """Return a movie, fetching OMDB/YouTube at most once and caching the result.

    A cached row is always served immediately; trailers are only looked up when
    requested and when we have not already attempted the lookup.
    """
    row = db.get(MovieCache, imdb_id)

    if row is not None:
        data = dict(row.payload)

        if (
            with_trailer
            and settings.ENABLE_TRAILERS
            and settings.YOUTUBE_API_KEY
            and not row.trailer_checked
        ):
            trailer = search_movie_trailer(data.get("Title", ""), data.get("Year", ""))
            row.trailer_checked = True
            if trailer:
                row.trailer_url = trailer
            db.commit()

        if row.trailer_url:
            data["trailer_url"] = row.trailer_url
        return data

    data = fetch_movie_by_imdb(imdb_id)
    if data is None:
        return None

    trailer = None
    trailer_checked = False
    if with_trailer and settings.ENABLE_TRAILERS and settings.YOUTUBE_API_KEY:
        trailer = search_movie_trailer(data.get("Title", ""), data.get("Year", ""))
        trailer_checked = True

    row = MovieCache(
        imdb_id=imdb_id,
        title=data.get("Title"),
        payload=data,
        trailer_url=trailer,
        trailer_checked=trailer_checked,
    )
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        # Another request cached this movie first; use the stored copy.
        db.rollback()
        cached = db.get(MovieCache, imdb_id)
        if cached is not None:
            data = dict(cached.payload)
            if cached.trailer_url:
                data["trailer_url"] = cached.trailer_url
            return data

    if trailer:
        data["trailer_url"] = trailer
    return data


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
