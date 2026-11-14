import os
import tempfile
from pathlib import Path

import pytest

TEST_DB = Path(tempfile.gettempdir()) / "movieflix_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["ENABLE_TRAILERS"] = "false"

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import delete  # noqa: E402

from src.server.db.models import HistoryItem, WatchlistItem  # noqa: E402
from src.server.db.postgres import Base, SessionLocal, engine  # noqa: E402
from src.server.main import app  # noqa: E402
from src.server.services import movie_service  # noqa: E402
from src.server.services.ml_service import ml_service  # noqa: E402


def fake_movie(imdb_id: str, title: str = "Test Movie") -> dict:
    return {
        "imdbID": imdb_id,
        "Title": title,
        "Year": "2024",
        "Poster": "N/A",
        "Type": "movie",
        "Plot": "A test movie.",
    }


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        db.execute(delete(WatchlistItem))
        db.execute(delete(HistoryItem))
        db.commit()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_omdb(monkeypatch):
    def _fetch(imdb_id: str):
        return fake_movie(imdb_id)

    monkeypatch.setattr(movie_service, "fetch_movie_by_imdb", _fetch)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_watchlist_roundtrip(client, mock_omdb):
    payload = {"user_id": "user-1", "imdb_id": "tt0000001", "movie_title": "Test Movie"}

    added = client.post("/api/watchlist", json=payload)
    assert added.status_code == 200
    assert added.json()["imdbID"] == "tt0000001"

    listed = client.get("/api/watchlist/user-1")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["Title"] == "Test Movie"

    removed = client.delete("/api/watchlist/user-1/tt0000001")
    assert removed.status_code == 200
    assert client.get("/api/watchlist/user-1").json() == []


def test_continue_watching(client, mock_omdb):
    response = client.post(
        "/api/history",
        json={
            "user_id": "user-1",
            "imdb_id": "tt0000002",
            "movie_title": "Half Watched",
            "progress": 50,
        },
    )
    assert response.status_code == 200

    continue_watching = client.get("/api/continue-watching/user-1")
    assert continue_watching.status_code == 200
    assert len(continue_watching.json()) == 1
    assert continue_watching.json()[0]["progress"] == 50


def test_imdb_mapping_loaded():
    assert ml_service.imdb_to_model_id.get("tt0111161") is not None


def test_more_like_this(client, mock_omdb):
    response = client.get("/api/recommendations/tt0111161")
    assert response.status_code == 200
    assert len(response.json()) > 0


def test_personalized_route_is_not_shadowed(client, mock_omdb):
    # /recommendations/{imdb_id} must not swallow /recommendations/personalized/...
    response = client.get("/api/recommendations/personalized/user-1")
    assert response.status_code == 200
    assert len(response.json()) == 10
