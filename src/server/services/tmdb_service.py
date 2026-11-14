"""CINECUE TMDB Client Service.

Provides asynchronous, rate-limited, and retry-resilient access to The Movie Database (TMDB) API.
Supports Movie, TV Series, Seasons, Episodes, Credits, External Identifiers, and Search.
Respects TMDB terms of service and attribution requirements.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
import logging
from typing import Any, Dict, List, Optional
import httpx

from ..config import settings

logger = logging.getLogger(__name__)

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

# Genre mapping for TMDB IDs to standard names
TMDB_GENRE_MAP: dict[int, str] = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics",
}


class TMDBService:
    """Async TMDB API client with exponential backoff and rate-limit handling."""

    def __init__(self, api_key: Optional[str] = None):
        self._api_key = api_key or settings.TMDB_API_KEY.strip()
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def is_configured(self) -> bool:
        """Check if TMDB API key is configured."""
        return bool(self._api_key)

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=TMDB_BASE_URL,
                timeout=httpx.Timeout(10.0, connect=5.0),
                headers={"Accept": "application/json"},
            )
        return self._client

    async def close(self) -> None:
        """Close underlying HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def _request(
        self, endpoint: str, params: Optional[Dict[str, Any]] = None, max_retries: int = 3
    ) -> Optional[Dict[str, Any]]:
        """Execute request against TMDB with retry logic and 429 backoff."""
        if not self.is_configured:
            logger.debug("TMDB request skipped: TMDB_API_KEY is not configured.")
            return None

        client = await self._get_client()
        query_params = {"api_key": self._api_key}
        if params:
            query_params.update(params)

        url = endpoint if endpoint.startswith("/") else f"/{endpoint}"

        for attempt in range(1, max_retries + 1):
            try:
                response = await client.get(url, params=query_params)
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 404:
                    logger.debug("TMDB resource not found: %s", endpoint)
                    return None
                elif response.status_code == 429:
                    # Rate limited: check Retry-After or apply exponential backoff
                    retry_after = response.headers.get("Retry-After")
                    wait_time = float(retry_after) if retry_after else (2 ** attempt * 0.5)
                    logger.warning(
                        "TMDB 429 rate limit hit. Backing off for %.2f seconds (attempt %d/%d)",
                        wait_time,
                        attempt,
                        max_retries,
                    )
                    await asyncio.sleep(wait_time)
                elif response.status_code >= 500:
                    wait_time = 2 ** attempt * 0.5
                    logger.warning(
                        "TMDB server error %d. Retrying in %.2f seconds (attempt %d/%d)",
                        response.status_code,
                        wait_time,
                        attempt,
                        max_retries,
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.warning("TMDB request returned HTTP %d: %s", response.status_code, endpoint)
                    return None
            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                wait_time = 2 ** attempt * 0.5
                logger.warning(
                    "TMDB network error (%s). Retrying in %.2f seconds (attempt %d/%d)",
                    exc.__class__.__name__,
                    wait_time,
                    attempt,
                    max_retries,
                )
                if attempt == max_retries:
                    logger.error("TMDB request failed after %d attempts for %s", max_retries, endpoint)
                    return None
                await asyncio.sleep(wait_time)
            except Exception as exc:
                logger.error("Unexpected error contacting TMDB endpoint %s: %s", endpoint, exc)
                return None

        return None

    # =========================================================================
    # Movies API
    # =========================================================================
    async def get_movie_details(self, tmdb_id: int | str) -> Optional[Dict[str, Any]]:
        """Fetch movie details including external IDs and credits."""
        data = await self._request(
            f"/movie/{tmdb_id}",
            params={"append_to_response": "external_ids,credits"},
        )
        if not data:
            return None
        return self._normalize_movie(data)

    async def get_popular_movies(self, page: int = 1) -> List[Dict[str, Any]]:
        """Fetch popular movies page."""
        data = await self._request("/movie/popular", params={"page": page})
        if not data or "results" not in data:
            return []
        return [self._normalize_movie_summary(m) for m in data["results"]]

    async def get_trending_movies(self, time_window: str = "week") -> List[Dict[str, Any]]:
        """Fetch trending movies for week or day."""
        data = await self._request(f"/trending/movie/{time_window}")
        if not data or "results" not in data:
            return []
        return [self._normalize_movie_summary(m) for m in data["results"]]

    async def search_movies(self, query: str, page: int = 1) -> List[Dict[str, Any]]:
        """Search movies by text query."""
        data = await self._request("/search/movie", params={"query": query, "page": page})
        if not data or "results" not in data:
            return []
        return [self._normalize_movie_summary(m) for m in data["results"]]

    # =========================================================================
    # TV Series API
    # =========================================================================
    async def get_tv_details(self, tmdb_id: int | str) -> Optional[Dict[str, Any]]:
        """Fetch TV series details including external IDs and credits."""
        data = await self._request(
            f"/tv/{tmdb_id}",
            params={"append_to_response": "external_ids,credits"},
        )
        if not data:
            return None
        return self._normalize_tv(data)

    async def get_tv_season(self, tmdb_id: int | str, season_number: int) -> Optional[Dict[str, Any]]:
        """Fetch TV season details with episode breakdown."""
        data = await self._request(f"/tv/{tmdb_id}/season/{season_number}")
        if not data:
            return None
        return self._normalize_season(data)

    async def get_popular_tv(self, page: int = 1) -> List[Dict[str, Any]]:
        """Fetch popular TV series page."""
        data = await self._request("/tv/popular", params={"page": page})
        if not data or "results" not in data:
            return []
        return [self._normalize_tv_summary(t) for t in data["results"]]

    async def get_trending_tv(self, time_window: str = "week") -> List[Dict[str, Any]]:
        """Fetch trending TV series."""
        data = await self._request(f"/trending/tv/{time_window}")
        if not data or "results" not in data:
            return []
        return [self._normalize_tv_summary(t) for t in data["results"]]

    async def search_tv(self, query: str, page: int = 1) -> List[Dict[str, Any]]:
        """Search TV series by text query."""
        data = await self._request("/search/tv", params={"query": query, "page": page})
        if not data or "results" not in data:
            return []
        return [self._normalize_tv_summary(t) for t in data["results"]]

    # =========================================================================
    # Normalizers & Classification Helpers
    # =========================================================================
    @staticmethod
    def classify_format_and_anime(
        genre_names_or_ids: List[Any],
        original_language: str,
        origin_country: Optional[List[str]] = None,
    ) -> tuple[str, bool]:
        """Classify visual_format ('animation' | 'live_action') and is_anime (boolean).

        Anime criteria:
        - Format is animation (contains Animation genre id 16 or name 'Animation').
        - Origin is Japanese (original_language == 'ja' or 'JP' in origin_country).
        """
        is_animation = False
        for g in genre_names_or_ids:
            if g == 16 or (isinstance(g, dict) and g.get("id") == 16):
                is_animation = True
                break
            if isinstance(g, str) and g.lower() == "animation":
                is_animation = True
                break
            if isinstance(g, dict) and g.get("name", "").lower() == "animation":
                is_animation = True
                break

        visual_format = "animation" if is_animation else "live_action"

        countries = [c.upper() for c in (origin_country or [])]
        is_anime = is_animation and (
            (original_language or "").lower() == "ja" or "JP" in countries
        )

        return visual_format, is_anime

    def _normalize_movie(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize detailed TMDB movie payload."""
        genres = [g["name"] for g in data.get("genres", []) if "name" in g]
        ext_ids = data.get("external_ids") or {}
        imdb_id = ext_ids.get("imdb_id")
        orig_lang = data.get("original_language", "en")
        origin_country = data.get("origin_country") or []

        visual_format, is_anime = self.classify_format_and_anime(
            data.get("genres", []), orig_lang, origin_country
        )

        release_date = data.get("release_date") or None
        release_year = None
        if release_date:
            try:
                release_year = int(release_date.split("-")[0])
            except (ValueError, IndexError):
                release_year = None

        poster_path = data.get("poster_path")
        poster_url = f"{TMDB_IMAGE_BASE_URL}/w500{poster_path}" if poster_path else None

        backdrop_path = data.get("backdrop_path")
        backdrop_url = (
            f"{TMDB_IMAGE_BASE_URL}/w1280{backdrop_path}" if backdrop_path else None
        )

        return {
            "tmdb_id": data.get("id"),
            "imdb_id": imdb_id,
            "title": data.get("title") or "Unknown Title",
            "original_title": data.get("original_title"),
            "content_type": "movie",
            "visual_format": visual_format,
            "is_anime": is_anime,
            "original_language": orig_lang,
            "overview": data.get("overview"),
            "tagline": data.get("tagline"),
            "release_date": release_date,
            "release_year": release_year,
            "runtime_minutes": data.get("runtime"),
            "status": data.get("status", "Released"),
            "poster_path": poster_url,
            "backdrop_path": backdrop_url,
            "popularity_score": data.get("popularity", 0.0),
            "tmdb_vote_average": data.get("vote_average"),
            "tmdb_vote_count": data.get("vote_count", 0),
            "is_adult": data.get("adult", False),
            "genres": genres,
        }

    def _normalize_movie_summary(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize concise movie result from popular/trending/search."""
        genre_ids = data.get("genre_ids", [])
        genres = [TMDB_GENRE_MAP[gid] for gid in genre_ids if gid in TMDB_GENRE_MAP]
        orig_lang = data.get("original_language", "en")
        origin_country = data.get("origin_country") or []

        visual_format, is_anime = self.classify_format_and_anime(
            genre_ids, orig_lang, origin_country
        )

        release_date = data.get("release_date") or None
        release_year = None
        if release_date:
            try:
                release_year = int(release_date.split("-")[0])
            except (ValueError, IndexError):
                release_year = None

        poster_path = data.get("poster_path")
        poster_url = f"{TMDB_IMAGE_BASE_URL}/w500{poster_path}" if poster_path else None

        backdrop_path = data.get("backdrop_path")
        backdrop_url = (
            f"{TMDB_IMAGE_BASE_URL}/w1280{backdrop_path}" if backdrop_path else None
        )

        return {
            "tmdb_id": data.get("id"),
            "title": data.get("title") or "Unknown Title",
            "original_title": data.get("original_title"),
            "content_type": "movie",
            "visual_format": visual_format,
            "is_anime": is_anime,
            "original_language": orig_lang,
            "overview": data.get("overview"),
            "release_date": release_date,
            "release_year": release_year,
            "poster_path": poster_url,
            "backdrop_path": backdrop_url,
            "popularity_score": data.get("popularity", 0.0),
            "tmdb_vote_average": data.get("vote_average"),
            "tmdb_vote_count": data.get("vote_count", 0),
            "is_adult": data.get("adult", False),
            "genres": genres,
        }

    def _normalize_tv(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize detailed TMDB TV payload."""
        genres = [g["name"] for g in data.get("genres", []) if "name" in g]
        ext_ids = data.get("external_ids") or {}
        imdb_id = ext_ids.get("imdb_id")
        orig_lang = data.get("original_language", "en")
        origin_country = data.get("origin_country") or []

        visual_format, is_anime = self.classify_format_and_anime(
            data.get("genres", []), orig_lang, origin_country
        )

        first_air_date = data.get("first_air_date") or None
        release_year = None
        if first_air_date:
            try:
                release_year = int(first_air_date.split("-")[0])
            except (ValueError, IndexError):
                release_year = None

        poster_path = data.get("poster_path")
        poster_url = f"{TMDB_IMAGE_BASE_URL}/w500{poster_path}" if poster_path else None

        backdrop_path = data.get("backdrop_path")
        backdrop_url = (
            f"{TMDB_IMAGE_BASE_URL}/w1280{backdrop_path}" if backdrop_path else None
        )

        seasons_raw = data.get("seasons", [])
        seasons = []
        for s in seasons_raw:
            s_poster = s.get("poster_path")
            seasons.append({
                "season_number": s.get("season_number"),
                "title": s.get("name") or f"Season {s.get('season_number')}",
                "overview": s.get("overview"),
                "air_date": s.get("air_date"),
                "episode_count": s.get("episode_count", 0),
                "poster_path": f"{TMDB_IMAGE_BASE_URL}/w500{s_poster}" if s_poster else None,
            })

        return {
            "tmdb_id": data.get("id"),
            "imdb_id": imdb_id,
            "title": data.get("name") or "Unknown Series",
            "original_title": data.get("original_name"),
            "content_type": "series",
            "visual_format": visual_format,
            "is_anime": is_anime,
            "original_language": orig_lang,
            "overview": data.get("overview"),
            "tagline": data.get("tagline"),
            "release_date": first_air_date,
            "release_year": release_year,
            "total_seasons": data.get("number_of_seasons"),
            "total_episodes": data.get("number_of_episodes"),
            "status": data.get("status", "Ended"),
            "poster_path": poster_url,
            "backdrop_path": backdrop_url,
            "popularity_score": data.get("popularity", 0.0),
            "tmdb_vote_average": data.get("vote_average"),
            "tmdb_vote_count": data.get("vote_count", 0),
            "is_adult": data.get("adult", False),
            "genres": genres,
            "seasons": seasons,
        }

    def _normalize_tv_summary(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize concise TV summary result."""
        genre_ids = data.get("genre_ids", [])
        genres = [TMDB_GENRE_MAP[gid] for gid in genre_ids if gid in TMDB_GENRE_MAP]
        orig_lang = data.get("original_language", "en")
        origin_country = data.get("origin_country") or []

        visual_format, is_anime = self.classify_format_and_anime(
            genre_ids, orig_lang, origin_country
        )

        first_air_date = data.get("first_air_date") or None
        release_year = None
        if first_air_date:
            try:
                release_year = int(first_air_date.split("-")[0])
            except (ValueError, IndexError):
                release_year = None

        poster_path = data.get("poster_path")
        poster_url = f"{TMDB_IMAGE_BASE_URL}/w500{poster_path}" if poster_path else None

        backdrop_path = data.get("backdrop_path")
        backdrop_url = (
            f"{TMDB_IMAGE_BASE_URL}/w1280{backdrop_path}" if backdrop_path else None
        )

        return {
            "tmdb_id": data.get("id"),
            "title": data.get("name") or "Unknown Series",
            "original_title": data.get("original_name"),
            "content_type": "series",
            "visual_format": visual_format,
            "is_anime": is_anime,
            "original_language": orig_lang,
            "overview": data.get("overview"),
            "release_date": first_air_date,
            "release_year": release_year,
            "poster_path": poster_url,
            "backdrop_path": backdrop_url,
            "popularity_score": data.get("popularity", 0.0),
            "tmdb_vote_average": data.get("vote_average"),
            "tmdb_vote_count": data.get("vote_count", 0),
            "is_adult": data.get("adult", False),
            "genres": genres,
        }

    def _normalize_season(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize TMDB season payload with episodes."""
        poster_path = data.get("poster_path")
        poster_url = f"{TMDB_IMAGE_BASE_URL}/w500{poster_path}" if poster_path else None

        episodes = []
        for ep in data.get("episodes", []):
            still_path = ep.get("still_path")
            episodes.append({
                "episode_number": ep.get("episode_number"),
                "title": ep.get("name") or f"Episode {ep.get('episode_number')}",
                "overview": ep.get("overview"),
                "air_date": ep.get("air_date"),
                "runtime_minutes": ep.get("runtime"),
                "still_path": f"{TMDB_IMAGE_BASE_URL}/w500{still_path}" if still_path else None,
            })

        return {
            "season_number": data.get("season_number"),
            "title": data.get("name"),
            "overview": data.get("overview"),
            "air_date": data.get("air_date"),
            "poster_path": poster_url,
            "episode_count": len(episodes),
            "episodes": episodes,
        }


# Singleton service instance
tmdb_service = TMDBService()
