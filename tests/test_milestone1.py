from decimal import Decimal
import os
import tempfile
import uuid
import pytest
from fastapi.testclient import TestClient

# Configure test environment variables before importing app
os.environ["CINECUE_TEST_MODE"] = "true"
os.environ["CINECUE_OWNER_UID"] = "owner_uid_12345"
os.environ["ENABLE_TRAILERS"] = "false"

from src.server.config import settings
settings.CINECUE_TEST_MODE = True
settings.CINECUE_OWNER_UID = "owner_uid_12345"

from src.server.db.models import ContentIdentifier, ContentItem, User, UserContentInteraction
from src.server.db.postgres import Base, SessionLocal, engine
from src.server.main import app

AUTH_HEADER = {"Authorization": "Bearer test-token-owner_uid_12345"}
STRANGER_HEADER = {"Authorization": "Bearer test-token-stranger_uid_99999"}


@pytest.fixture(autouse=True)
def setup_test_db():
    settings.CINECUE_TEST_MODE = True
    settings.CINECUE_OWNER_UID = "owner_uid_12345"
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        db.query(UserContentInteraction).delete()
        db.query(ContentIdentifier).delete()
        db.query(ContentItem).delete()
        db.query(User).delete()
        db.commit()
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_movie():
    with SessionLocal() as db:
        item = ContentItem(
            id=uuid.uuid4(),
            content_type="movie",
            visual_format="live_action",
            is_anime=False,
            title="Inception",
            release_year=2010,
            poster_path="https://example.com/inception.jpg",
            imdb_rating=Decimal("8.8"),
        )
        db.add(item)
        db.flush()
        ident = ContentIdentifier(
            content_id=item.id,
            provider="imdb",
            external_id="tt1375666",
        )
        db.add(ident)
        db.commit()
        db.refresh(item)
        return item


# =====================================================================
# 1. Authentication & Security Boundary Tests
# =====================================================================
def test_missing_auth_token_rejected(client):
    """Endpoints mandate Bearer token; missing token returns HTTP 401."""
    res = client.get("/api/interactions")
    assert res.status_code == 401
    assert "Missing authentication credentials" in res.json()["detail"]


def test_stranger_uid_rejected_with_403(client):
    """Any Firebase UID not matching CINECUE_OWNER_UID is rejected with HTTP 403."""
    res = client.get("/api/interactions", headers=STRANGER_HEADER)
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]


def test_owner_auth_and_auto_provisioning(client):
    """Valid owner token provisions User record and returns interactions list."""
    res = client.get("/api/interactions", headers=AUTH_HEADER)
    assert res.status_code == 200
    assert res.json()["total"] == 0

    with SessionLocal() as db:
        user = db.query(User).filter(User.firebase_uid == "owner_uid_12345").first()
        assert user is not None
        assert user.firebase_uid == "owner_uid_12345"


# =====================================================================
# 2. Watchlist State Transitions
# =====================================================================
def test_add_and_remove_watchlist(client, sample_movie):
    """Add title to watchlist and verify independent removal."""
    # Add to watchlist
    res = client.post(
        "/api/interactions/watchlist",
        headers=AUTH_HEADER,
        json={"content_id": str(sample_movie.id)},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_watchlisted"] is True
    assert data["watchlist_added_at"] is not None

    # Query watchlist collection
    res_list = client.get("/api/interactions/watchlist", headers=AUTH_HEADER)
    assert res_list.status_code == 200
    assert res_list.json()["total"] == 1
    assert res_list.json()["items"][0]["content"]["title"] == "Inception"

    # Remove from watchlist
    res_del = client.delete(
        f"/api/interactions/watchlist/{sample_movie.id}",
        headers=AUTH_HEADER,
    )
    assert res_del.status_code == 200
    assert res_del.json()["is_watchlisted"] is False
    assert res_del.json()["watchlist_added_at"] is None


# =====================================================================
# 3. Watched & Half-Star Rating Validation
# =====================================================================
def test_mark_watched_valid_half_star_rating(client, sample_movie):
    """Mandatory rating in valid 0.5 increment succeeds."""
    res = client.post(
        "/api/interactions/watched",
        headers=AUTH_HEADER,
        json={
            "content_id": str(sample_movie.id),
            "rating": 4.5,
            "user_notes": "Masterpiece of modern sci-fi.",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["watched_at"] is not None
    assert float(data["rating"]) == 4.5
    assert data["user_notes"] == "Masterpiece of modern sci-fi."


def test_mark_watched_invalid_rating_increments_rejected(client, sample_movie):
    """Ratings not in 0.5 increments (e.g. 3.7) are rejected by validator with HTTP 422."""
    res = client.post(
        "/api/interactions/watched",
        headers=AUTH_HEADER,
        json={
            "content_id": str(sample_movie.id),
            "rating": 3.7,
        },
    )
    assert res.status_code == 422
    assert "increments of 0.5" in str(res.json())


def test_mark_watched_out_of_bounds_rating_rejected(client, sample_movie):
    """Ratings exceeding 5.0 or under 1.0 are rejected."""
    res = client.post(
        "/api/interactions/watched",
        headers=AUTH_HEADER,
        json={"content_id": str(sample_movie.id), "rating": 5.5},
    )
    assert res.status_code == 422


def test_undo_watched_status_preserves_rating(client, sample_movie):
    """Undoing watched status clears watched_at while retaining personal rating."""
    # First mark watched
    client.post(
        "/api/interactions/watched",
        headers=AUTH_HEADER,
        json={"content_id": str(sample_movie.id), "rating": 4.0},
    )

    # Undo watched
    res_undo = client.delete(
        f"/api/interactions/watched/{sample_movie.id}",
        headers=AUTH_HEADER,
    )
    assert res_undo.status_code == 200
    data = res_undo.json()
    assert data["watched_at"] is None
    # Rating is preserved per specification
    assert float(data["rating"]) == 4.0


# =====================================================================
# 4. Dismissal State Transitions & Recommendation Exclusion
# =====================================================================
def test_dismiss_and_restore_content(client, sample_movie):
    """Dismiss content item, verify exclusion, and restore."""
    # Dismiss
    res_dismiss = client.post(
        "/api/interactions/dismiss",
        headers=AUTH_HEADER,
        json={"content_id": str(sample_movie.id)},
    )
    assert res_dismiss.status_code == 200
    assert res_dismiss.json()["is_dismissed"] is True

    # Check dismissed filter
    res_list = client.get("/api/interactions?filter=dismissed", headers=AUTH_HEADER)
    assert res_list.status_code == 200
    assert res_list.json()["total"] == 1

    # Restore dismissal
    res_restore = client.delete(
        f"/api/interactions/dismiss/{sample_movie.id}",
        headers=AUTH_HEADER,
    )
    assert res_restore.status_code == 200
    assert res_restore.json()["is_dismissed"] is False

