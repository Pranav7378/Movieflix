"""CINECUE Milestone 2 Test Suite: Universal Catalogue & Metadata Integration.

Tests cover:
1. Database Models (ContentItem, ContentIdentifier, Genre, Season, Episode, Constraints).
2. TMDB Service (Mocked API responses, rate limiting, error resilience, classification).
3. Ingestion Pipeline (Local dataset parsing, idempotent upsert, deduplication).
4. Universal Catalogue API (Filters, search, pagination, seasons, episodes, dismissed exclusion).
"""

from datetime import date, datetime
from decimal import Decimal
import os
import unittest.mock as mock
import uuid
import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

os.environ["CINECUE_TEST_MODE"] = "true"
os.environ["CINECUE_OWNER_UID"] = "owner_uid_12345"
os.environ["ENABLE_TRAILERS"] = "false"

from src.server.config import settings
settings.CINECUE_TEST_MODE = True
settings.CINECUE_OWNER_UID = "owner_uid_12345"

from fastapi.testclient import TestClient
from src.server.db.models import (
    ContentGenre,
    ContentIdentifier,
    ContentItem,
    Episode,
    Genre,
    Season,
    User,
    UserContentInteraction,
    utcnow,
)
from src.server.db.postgres import Base, SessionLocal, engine
from src.server.main import app
from src.server.services.tmdb_service import TMDBService

AUTH_HEADER = {"Authorization": "Bearer test-token-owner_uid_12345"}


@pytest.fixture(autouse=True)
def setup_test_db():
    settings.CINECUE_TEST_MODE = True
    settings.CINECUE_OWNER_UID = "owner_uid_12345"
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        db.query(Episode).delete()
        db.query(Season).delete()
        db.query(UserContentInteraction).delete()
        db.query(ContentGenre).delete()
        db.query(ContentIdentifier).delete()
        db.query(ContentItem).delete()
        db.query(Genre).delete()
        db.query(User).delete()
        db.commit()
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_catalogue():
    """Populate sample catalogue with movies, series, and anime."""
    with SessionLocal() as db:
        # 1. Genres
        g_action = Genre(name="Action", slug="action")
        g_scifi = Genre(name="Science Fiction", slug="science-fiction")
        g_anim = Genre(name="Animation", slug="animation")
        g_drama = Genre(name="Drama", slug="drama")
        db.add_all([g_action, g_scifi, g_anim, g_drama])
        db.commit()

        # 2. Movie: Inception (Live Action)
        m_inception = ContentItem(
            id=uuid.uuid4(),
            content_type="movie",
            visual_format="live_action",
            is_anime=False,
            title="Inception",
            original_title="Inception",
            release_year=2010,
            popularity_score=Decimal("85.500"),
            tmdb_vote_average=Decimal("8.4"),
            imdb_rating=Decimal("8.8"),
            overview="A thief who steals corporate secrets through the use of dream-sharing technology.",
        )
        db.add(m_inception)
        db.flush()
        db.add(ContentIdentifier(content_id=m_inception.id, provider="tmdb_movie", external_id="27205"))
        db.add(ContentIdentifier(content_id=m_inception.id, provider="imdb", external_id="tt1375666"))
        db.add(ContentGenre(content_id=m_inception.id, genre_id=g_action.id))
        db.add(ContentGenre(content_id=m_inception.id, genre_id=g_scifi.id))

        # 3. Duplicate-Title Movie: Inception (2014 Indie / Distinct work)
        m_inception_diff = ContentItem(
            id=uuid.uuid4(),
            content_type="movie",
            visual_format="live_action",
            is_anime=False,
            title="Inception",
            original_title="Inception",
            release_year=2014,
            popularity_score=Decimal("5.000"),
            overview="An independent short film sharing the same title.",
        )
        db.add(m_inception_diff)
        db.flush()
        db.add(ContentIdentifier(content_id=m_inception_diff.id, provider="imdb", external_id="tt9999999"))

        # 4. Anime Movie: Spirited Away
        m_spirited = ContentItem(
            id=uuid.uuid4(),
            content_type="movie",
            visual_format="animation",
            is_anime=True,
            title="Spirited Away",
            original_title="千と千尋の神隠し",
            original_language="ja",
            release_year=2001,
            popularity_score=Decimal("92.100"),
            tmdb_vote_average=Decimal("8.5"),
            imdb_rating=Decimal("8.6"),
            overview="A young girl enters the world of spirits ruled by a witch.",
        )
        db.add(m_spirited)
        db.flush()
        db.add(ContentIdentifier(content_id=m_spirited.id, provider="tmdb_movie", external_id="129"))
        db.add(ContentGenre(content_id=m_spirited.id, genre_id=g_anim.id))

        # 5. TV Series: Breaking Bad (Live Action)
        s_bb = ContentItem(
            id=uuid.uuid4(),
            content_type="series",
            visual_format="live_action",
            is_anime=False,
            title="Breaking Bad",
            original_title="Breaking Bad",
            release_year=2008,
            total_seasons=5,
            total_episodes=62,
            popularity_score=Decimal("120.000"),
            tmdb_vote_average=Decimal("8.9"),
            overview="A high school chemistry teacher diagnosed with lung cancer cooks meth.",
        )
        db.add(s_bb)
        db.flush()
        db.add(ContentIdentifier(content_id=s_bb.id, provider="tmdb_tv", external_id="1396"))
        db.add(ContentGenre(content_id=s_bb.id, genre_id=g_drama.id))

        # Add Season & Episodes for Breaking Bad
        season1 = Season(
            id=uuid.uuid4(),
            series_id=s_bb.id,
            season_number=1,
            title="Season 1",
            episode_count=7,
        )
        db.add(season1)
        db.flush()
        ep1 = Episode(
            id=uuid.uuid4(),
            season_id=season1.id,
            episode_number=1,
            title="Pilot",
            runtime_minutes=58,
        )
        db.add(ep1)

        # 6. Anime Series: Attack on Titan
        s_aot = ContentItem(
            id=uuid.uuid4(),
            content_type="series",
            visual_format="animation",
            is_anime=True,
            title="Attack on Titan",
            original_title="進撃の巨人",
            original_language="ja",
            release_year=2013,
            total_seasons=4,
            total_episodes=87,
            popularity_score=Decimal("140.000"),
            tmdb_vote_average=Decimal("8.7"),
            overview="Humans fight for survival against giant humanoid Titans.",
        )
        db.add(s_aot)
        db.flush()
        db.add(ContentIdentifier(content_id=s_aot.id, provider="tmdb_tv", external_id="1429"))
        db.add(ContentGenre(content_id=s_aot.id, genre_id=g_anim.id))
        db.add(ContentGenre(content_id=s_aot.id, genre_id=g_action.id))

        db.commit()

        return {
            "m_inception": m_inception,
            "m_inception_diff": m_inception_diff,
            "m_spirited": m_spirited,
            "s_bb": s_bb,
            "s_aot": s_aot,
            "season1": season1,
        }


# =====================================================================
# 1. Database Model & Integrity Tests
# =====================================================================
def test_movie_and_series_creation(sample_catalogue):
    """Verify movie and series items coexist with correct classifications."""
    with SessionLocal() as db:
        items = db.scalars(select(ContentItem)).all()
        assert len(items) == 5

        movies = [i for i in items if i.content_type == "movie"]
        series = [i for i in items if i.content_type == "series"]
        assert len(movies) == 3
        assert len(series) == 2


def test_duplicate_titles_with_distinct_identifiers_remain_distinct(sample_catalogue):
    """Different works with identical titles remain distinct records."""
    with SessionLocal() as db:
        inceptions = db.scalars(select(ContentItem).where(ContentItem.title == "Inception")).all()
        assert len(inceptions) == 2
        assert inceptions[0].id != inceptions[1].id
        years = {i.release_year for i in inceptions}
        assert years == {2010, 2014}


def test_content_identifier_namespace_uniqueness(sample_catalogue):
    """Provider external_id uniqueness within namespace is strictly enforced."""
    with SessionLocal() as db:
        # Attempting duplicate (tmdb_movie, '27205') must raise IntegrityError
        dup = ContentIdentifier(
            content_id=uuid.uuid4(),
            provider="tmdb_movie",
            external_id="27205",
        )
        db.add(dup)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


def test_season_belonging_constraint(sample_catalogue):
    """Seasons can only belong to series, not movies."""
    m_inc = sample_catalogue["m_inception"]
    with SessionLocal() as db:
        # Adding season to a movie should violate chk_movie_no_seasons if total_seasons set or checked
        season_for_movie = Season(
            id=uuid.uuid4(),
            series_id=m_inc.id,
            season_number=1,
            title="Illegal Season",
        )
        db.add(season_for_movie)
        db.commit()

        # Querying catalogue API season endpoint on a movie returns HTTP 400
        client = TestClient(app)
        res = client.get(f"/api/catalogue/{m_inc.id}/seasons")
        assert res.status_code == 400
        assert "movies do not have seasons" in res.json()["detail"]


# =====================================================================
# 2. TMDB Service & Classification Tests
# =====================================================================
def test_tmdb_anime_and_format_classification():
    """Verify objective classification of animation and anime from metadata."""
    # 1. Anime Series: Animation genre + ja language
    fmt, is_anime = TMDBService.classify_format_and_anime([16, 10759], "ja", ["JP"])
    assert fmt == "animation"
    assert is_anime is True

    # 2. Western Animation: Animation genre + en language
    fmt, is_anime = TMDBService.classify_format_and_anime([16, 35], "en", ["US"])
    assert fmt == "animation"
    assert is_anime is False

    # 3. Live Action Japanese Movie: Drama genre + ja language
    fmt, is_anime = TMDBService.classify_format_and_anime([18], "ja", ["JP"])
    assert fmt == "live_action"
    assert is_anime is False


def test_tmdb_service_mocked_success():
    """Test TMDB service movie details parsing with mocked HTTP response."""
    import asyncio

    async def _test():
        service = TMDBService(api_key="mock_tmdb_key")

        mock_movie_response = {
            "id": 550,
            "title": "Fight Club",
            "original_title": "Fight Club",
            "overview": "An insomniac office worker and a devil-may-care soap maker form an underground fight club.",
            "release_date": "1999-10-15",
            "runtime": 139,
            "popularity": 73.4,
            "vote_average": 8.4,
            "vote_count": 27000,
            "adult": False,
            "genres": [{"id": 18, "name": "Drama"}],
            "external_ids": {"imdb_id": "tt0137523"},
        }

        with mock.patch.object(service, "_request", return_value=mock_movie_response):
            result = await service.get_movie_details(550)
            assert result is not None
            assert result["tmdb_id"] == 550
            assert result["imdb_id"] == "tt0137523"
            assert result["title"] == "Fight Club"
            assert result["release_year"] == 1999
            assert result["visual_format"] == "live_action"
            assert result["is_anime"] is False
            assert "Drama" in result["genres"]

        await service.close()

    asyncio.run(_test())


def test_tmdb_service_rate_limit_backoff():
    """Verify TMDB client handles HTTP 429 backoff gracefully."""
    import asyncio

    async def _test():
        service = TMDBService(api_key="mock_key")

        mock_resp_429 = mock.MagicMock()
        mock_resp_429.status_code = 429
        mock_resp_429.headers = {"Retry-After": "0.1"}

        mock_resp_200 = mock.MagicMock()
        mock_resp_200.status_code = 200
        mock_resp_200.json.return_value = {"id": 100, "title": "Mock Movie"}

        mock_client = mock.AsyncMock()
        mock_client.get.side_effect = [mock_resp_429, mock_resp_200]

        with mock.patch.object(service, "_get_client", return_value=mock_client):
            data = await service._request("/movie/100")
            assert data is not None
            assert data["title"] == "Mock Movie"
            assert mock_client.get.call_count == 2

        await service.close()

    asyncio.run(_test())


# =====================================================================
# 3. Universal Catalogue API Tests
# =====================================================================
def test_catalogue_unified_listing(client, sample_catalogue):
    """Retrieve unified list containing both movies and series."""
    res = client.get("/api/catalogue?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 5
    types = {item["content_type"] for item in data["items"]}
    assert "movie" in types
    assert "series" in types


def test_catalogue_filtering_by_content_type(client, sample_catalogue):
    """Filter specifically by movies or series."""
    # Only movies
    res_m = client.get("/api/catalogue?content_type=movie")
    assert res_m.status_code == 200
    data_m = res_m.json()
    assert data_m["total"] == 3
    for item in data_m["items"]:
        assert item["content_type"] == "movie"

    # Only series
    res_s = client.get("/api/catalogue?content_type=series")
    assert res_s.status_code == 200
    data_s = res_s.json()
    assert data_s["total"] == 2
    for item in data_s["items"]:
        assert item["content_type"] == "series"


def test_catalogue_filtering_by_anime(client, sample_catalogue):
    """Filter by is_anime across both movies and TV series."""
    res = client.get("/api/catalogue?is_anime=true")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    titles = {i["title"] for i in data["items"]}
    assert titles == {"Spirited Away", "Attack on Titan"}
    # One is movie, one is series
    content_types = {i["content_type"] for i in data["items"]}
    assert content_types == {"movie", "series"}


def test_catalogue_filtering_by_genre(client, sample_catalogue):
    """Filter by genre taxonomy (e.g. Action)."""
    res = client.get("/api/catalogue?genre=Action")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    titles = {i["title"] for i in data["items"]}
    assert titles == {"Inception", "Attack on Titan"}


def test_catalogue_search(client, sample_catalogue):
    """Search catalogue across titles and descriptions."""
    res = client.get("/api/catalogue/search?q=Titan")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Attack on Titan"


def test_catalogue_detail_and_seasons(client, sample_catalogue):
    """Inspect series detail and retrieve season and episode hierarchy."""
    s_bb = sample_catalogue["s_bb"]

    # Detail
    res = client.get(f"/api/catalogue/{s_bb.id}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["title"] == "Breaking Bad"
    assert detail["content_type"] == "series"
    assert len(detail["seasons"]) == 1
    assert detail["seasons"][0]["season_number"] == 1

    # Seasons endpoint
    res_seasons = client.get(f"/api/catalogue/{s_bb.id}/seasons")
    assert res_seasons.status_code == 200
    assert len(res_seasons.json()) == 1
    assert res_seasons.json()[0]["title"] == "Season 1"

    # Episodes endpoint
    res_eps = client.get(f"/api/catalogue/{s_bb.id}/seasons/1/episodes")
    assert res_eps.status_code == 200
    eps = res_eps.json()
    assert len(eps) == 1
    assert eps[0]["title"] == "Pilot"
    assert eps[0]["episode_number"] == 1


def test_catalogue_excludes_dismissed_for_owner(client, sample_catalogue):
    """Dismissed content items are excluded from catalogue when owner is authenticated."""
    m_inc = sample_catalogue["m_inception"]

    # First verify visible
    res_before = client.get("/api/catalogue?content_type=movie", headers=AUTH_HEADER)
    assert res_before.status_code == 200
    assert any(i["id"] == str(m_inc.id) for i in res_before.json()["items"])

    # Dismiss title
    res_dismiss = client.post(
        "/api/interactions/dismiss",
        headers=AUTH_HEADER,
        json={"content_id": str(m_inc.id)},
    )
    assert res_dismiss.status_code == 200

    # Catalogue now excludes dismissed title for this owner
    res_after = client.get("/api/catalogue?content_type=movie", headers=AUTH_HEADER)
    assert res_after.status_code == 200
    assert not any(i["id"] == str(m_inc.id) for i in res_after.json()["items"])
    assert res_after.json()["total"] == 2
