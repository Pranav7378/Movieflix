"""Quick database sanity check.

Run from the project root:
    .\\venv\\Scripts\\python.exe check_db.py
"""

from sqlalchemy import func, select

from src.server.db.models import HistoryItem, MovieCache, WatchlistItem
from src.server.db.postgres import DATABASE_URL, SessionLocal, init_db


def main() -> None:
    init_db()
    print(f"Database: {DATABASE_URL.split('@')[-1]}\n")

    with SessionLocal() as db:
        for model, label in (
            (WatchlistItem, "watchlist items"),
            (HistoryItem, "history items"),
            (MovieCache, "cached movies"),
        ):
            count = db.scalar(select(func.count()).select_from(model)) or 0
            print(f"{label}: {count}")

        rows = db.scalars(select(WatchlistItem).limit(5)).all()
        if rows:
            print("\nRecent watchlist entries:")
            for row in rows:
                print(f"  - {row.movie_title} ({row.imdb_id})")


if __name__ == "__main__":
    main()
