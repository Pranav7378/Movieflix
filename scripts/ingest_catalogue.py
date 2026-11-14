"""CINECUE Catalogue Ingestion Pipeline.

Ingests and unifies movies from local datasets (MovieLens + TMDB dict),
enriches metadata via TMDB API, imports TV series and anime,
and normalizes genres and provider identifiers idempotently.

Usage:
    python scripts/ingest_catalogue.py [--limit N] [--batch-size B] [--enrich-tmdb] [--import-tv] [--dry-run]
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import datetime
from decimal import Decimal
import os
from pathlib import Path
import pickle
import re
import sys
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid

import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.server.config import settings
from src.server.db.models import (
    ContentGenre,
    ContentIdentifier,
    ContentItem,
    Episode,
    Genre,
    Season,
    utcnow,
)
from src.server.db.postgres import SessionLocal, init_db
from src.server.services.tmdb_service import TMDBService, tmdb_service

# Normalized standard genre name map
GENRE_NORMALIZATION: dict[str, str] = {
    "action": "Action",
    "adventure": "Adventure",
    "animation": "Animation",
    "children": "Children",
    "children's": "Children",
    "comedy": "Comedy",
    "crime": "Crime",
    "documentary": "Documentary",
    "drama": "Drama",
    "fantasy": "Fantasy",
    "film-noir": "Film-Noir",
    "horror": "Horror",
    "musical": "Musical",
    "mystery": "Mystery",
    "romance": "Romance",
    "sci-fi": "Science Fiction",
    "science fiction": "Science Fiction",
    "thriller": "Thriller",
    "war": "War",
    "western": "Western",
    "action & adventure": "Action & Adventure",
    "kids": "Kids",
    "sci-fi & fantasy": "Sci-Fi & Fantasy",
}

# Baseline TV series catalog for zero-key offline readiness
BASELINE_TV_SERIES = [
    {
        "tmdb_id": 1396,
        "imdb_id": "tt0903747",
        "title": "Breaking Bad",
        "original_title": "Breaking Bad",
        "overview": "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family's future.",
        "release_year": 2008,
        "visual_format": "live_action",
        "is_anime": False,
        "original_language": "en",
        "total_seasons": 5,
        "total_episodes": 62,
        "status": "Ended",
        "poster_path": "https://image.tmdb.org/t/p/w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg",
        "popularity_score": Decimal("130.500"),
        "tmdb_vote_average": Decimal("8.9"),
        "genres": ["Drama", "Crime", "Thriller"],
        "seasons": [
            {"season_number": 1, "title": "Season 1", "episode_count": 7},
            {"season_number": 2, "title": "Season 2", "episode_count": 13},
            {"season_number": 3, "title": "Season 3", "episode_count": 13},
            {"season_number": 4, "title": "Season 4", "episode_count": 13},
            {"season_number": 5, "title": "Season 5", "episode_count": 16},
        ],
    },
    {
        "tmdb_id": 66732,
        "imdb_id": "tt4574334",
        "title": "Stranger Things",
        "original_title": "Stranger Things",
        "overview": "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
        "release_year": 2016,
        "visual_format": "live_action",
        "is_anime": False,
        "original_language": "en",
        "total_seasons": 4,
        "total_episodes": 34,
        "status": "Returning Series",
        "poster_path": "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
        "popularity_score": Decimal("112.400"),
        "tmdb_vote_average": Decimal("8.6"),
        "genres": ["Drama", "Fantasy", "Mystery", "Science Fiction"],
        "seasons": [
            {"season_number": 1, "title": "Season 1", "episode_count": 8},
            {"season_number": 2, "title": "Season 2", "episode_count": 9},
            {"season_number": 3, "title": "Season 3", "episode_count": 8},
            {"season_number": 4, "title": "Season 4", "episode_count": 9},
        ],
    },
    {
        "tmdb_id": 1429,
        "imdb_id": "tt2560140",
        "title": "Attack on Titan",
        "original_title": "進撃の巨人",
        "overview": "Several hundred years ago, humans were nearly exterminated by Titans. Eren Yeager vows to cleanse the earth of the giant humanoids after a Titan brings about the destruction of his hometown and the death of his mother.",
        "release_year": 2013,
        "visual_format": "animation",
        "is_anime": True,
        "original_language": "ja",
        "total_seasons": 4,
        "total_episodes": 87,
        "status": "Ended",
        "poster_path": "https://image.tmdb.org/t/p/w500/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg",
        "popularity_score": Decimal("145.200"),
        "tmdb_vote_average": Decimal("8.7"),
        "genres": ["Animation", "Action & Adventure", "Sci-Fi & Fantasy"],
        "seasons": [
            {"season_number": 1, "title": "Season 1", "episode_count": 25},
            {"season_number": 2, "title": "Season 2", "episode_count": 12},
            {"season_number": 3, "title": "Season 3", "episode_count": 22},
            {"season_number": 4, "title": "The Final Season", "episode_count": 28},
        ],
    },
    {
        "tmdb_id": 94605,
        "imdb_id": "tt11126994",
        "title": "Arcane",
        "original_title": "Arcane",
        "overview": "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.",
        "release_year": 2021,
        "visual_format": "animation",
        "is_anime": False,
        "original_language": "en",
        "total_seasons": 2,
        "total_episodes": 18,
        "status": "Ended",
        "poster_path": "https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn397rWW2vQiL.jpg",
        "popularity_score": Decimal("165.800"),
        "tmdb_vote_average": Decimal("8.7"),
        "genres": ["Animation", "Action & Adventure", "Sci-Fi & Fantasy", "Drama"],
        "seasons": [
            {"season_number": 1, "title": "Season 1", "episode_count": 9},
            {"season_number": 2, "title": "Season 2", "episode_count": 9},
        ],
    },
    {
        "tmdb_id": 46260,
        "imdb_id": "tt2098220",
        "title": "Hunter x Hunter",
        "original_title": "HUNTER×HUNTER",
        "overview": "Twelve-year-old Gon Freecss aspires to become a Hunter in hopes of finding his father, Ging, a legendary master Hunter who abandoned him as an infant.",
        "release_year": 2011,
        "visual_format": "animation",
        "is_anime": True,
        "original_language": "ja",
        "total_seasons": 6,
        "total_episodes": 148,
        "status": "Ended",
        "poster_path": "https://image.tmdb.org/t/p/w500/ucmpFdWzNxsnW02apMRPtT4540d.jpg",
        "popularity_score": Decimal("118.900"),
        "tmdb_vote_average": Decimal("8.9"),
        "genres": ["Animation", "Action & Adventure", "Sci-Fi & Fantasy"],
        "seasons": [
            {"season_number": 1, "title": "Hunter Exam Arc", "episode_count": 26},
            {"season_number": 2, "title": "Zoldyck Family & Heavens Arena Arc", "episode_count": 12},
            {"season_number": 3, "title": "Phantom Troupe Arc", "episode_count": 20},
            {"season_number": 4, "title": "Greed Island Arc", "episode_count": 17},
            {"season_number": 5, "title": "Chimera Ant Arc", "episode_count": 61},
            {"season_number": 6, "title": "Election Arc", "episode_count": 12},
        ],
    },
]


def clean_title_and_year(raw_title: str) -> Tuple[str, Optional[int]]:
    """Extract release year from MovieLens title format like 'Toy Story (1995)'."""
    raw = (raw_title or "").strip()
    match = re.search(r"\(([12][8901]\d{2})\)$", raw)
    if match:
        year = int(match.group(1))
        title = re.sub(r"\s*\(([12][8901]\d{2})\)$", "", raw).strip()
        # Handle trailing articles like 'Shawshank Redemption, The'
        if ", The" in title:
            title = "The " + title.replace(", The", "")
        elif ", A" in title:
            title = "A " + title.replace(", A", "")
        return title, year
    return raw, None


def get_or_create_genres(db: Session, genre_names: Set[str]) -> Dict[str, Genre]:
    """Ensure all genre records exist in DB and return mapping {normalized_name: Genre}."""
    existing_genres = {g.name: g for g in db.scalars(select(Genre)).all()}
    created = False

    for raw_name in genre_names:
        clean_name = GENRE_NORMALIZATION.get(raw_name.strip().lower(), raw_name.strip())
        if not clean_name or clean_name == "(no genres listed)":
            continue
        if clean_name not in existing_genres:
            slug = re.sub(r"[^a-z0-9]+", "-", clean_name.lower()).strip("-")
            genre_obj = Genre(name=clean_name, slug=slug)
            db.add(genre_obj)
            existing_genres[clean_name] = genre_obj
            created = True

    if created:
        db.commit()
    return existing_genres


def build_local_dataset() -> List[Dict[str, Any]]:
    """Merge MovieLens CSVs and TMDB movie_dict.pkl into unified movie candidate dicts."""
    data_dir = BASE_DIR / "src" / "data"
    links_path = data_dir / "links.csv"
    movies_path = data_dir / "movies.csv"
    dict_path = BASE_DIR / "src" / "movie_dict.pkl"

    candidates_by_tmdb: Dict[int, Dict[str, Any]] = {}
    candidates_by_imdb: Dict[str, Dict[str, Any]] = {}
    records: List[Dict[str, Any]] = []

    # 1. Load MovieLens datasets
    if links_path.exists() and movies_path.exists():
        df_links = pd.read_csv(links_path)
        df_movies = pd.read_csv(movies_path)
        df_merged = pd.merge(df_movies, df_links, on="movieId")

        for _, row in df_merged.iterrows():
            movielens_id = str(row["movieId"])
            raw_title = str(row["title"])
            title, year = clean_title_and_year(raw_title)

            # Format IMDb ID as 'tt0123456'
            imdb_id = None
            if pd.notna(row.get("imdbId")):
                raw_imdb = str(int(row["imdbId"]))
                imdb_id = f"tt{raw_imdb.zfill(7)}"

            tmdb_id = None
            if pd.notna(row.get("tmdbId")):
                tmdb_id = int(row["tmdbId"])

            raw_genres = str(row.get("genres", "")).split("|")
            clean_genres = [
                GENRE_NORMALIZATION.get(g.strip().lower(), g.strip())
                for g in raw_genres
                if g.strip() and g.strip() != "(no genres listed)"
            ]

            visual_format = "animation" if "Animation" in clean_genres else "live_action"

            record = {
                "title": title,
                "original_title": title,
                "release_year": year,
                "visual_format": visual_format,
                "is_anime": False,
                "content_type": "movie",
                "genres": clean_genres,
                "movielens_id": movielens_id,
                "imdb_id": imdb_id,
                "tmdb_id": tmdb_id,
                "metadata_source": "movielens",
            }

            if tmdb_id:
                candidates_by_tmdb[tmdb_id] = record
            elif imdb_id:
                candidates_by_imdb[imdb_id] = record
            else:
                records.append(record)

    # 2. Enrich/overlay with TMDB movie_dict.pkl (4,806 rich movie records)
    if dict_path.exists():
        with open(dict_path, "rb") as fp:
            mdict = pickle.load(fp)
        df_dict = pd.DataFrame(mdict)

        for _, row in df_dict.iterrows():
            if pd.isna(row.get("movie_id")):
                continue
            tmdb_id = int(row["movie_id"])
            dict_title = str(row.get("title", "")).strip()
            tags = str(row.get("tags", "")).strip()

            if tmdb_id in candidates_by_tmdb:
                # Merge into existing MovieLens record
                rec = candidates_by_tmdb[tmdb_id]
                if tags and not rec.get("overview"):
                    rec["overview"] = tags
                if not rec.get("title"):
                    rec["title"] = dict_title
            else:
                # New record from movie_dict not present in MovieLens
                candidates_by_tmdb[tmdb_id] = {
                    "title": dict_title,
                    "original_title": dict_title,
                    "release_year": None,
                    "visual_format": "live_action",
                    "is_anime": False,
                    "content_type": "movie",
                    "genres": [],
                    "overview": tags if tags else None,
                    "movielens_id": None,
                    "imdb_id": None,
                    "tmdb_id": tmdb_id,
                    "metadata_source": "tmdb_dict",
                }

    all_records = list(candidates_by_tmdb.values()) + list(candidates_by_imdb.values()) + records
    return all_records


def ingest_movies_batch(
    db: Session,
    records: List[Dict[str, Any]],
    limit: Optional[int] = None,
    batch_size: int = 500,
) -> Tuple[int, int]:
    """Ingest candidate movie records into database in idempotent batches."""
    target_records = records[:limit] if limit and limit > 0 else records
    total = len(target_records)
    print(f"Ingesting up to {total} movie records (batch size: {batch_size})...")

    # Pre-extract all genre names to populate taxonomy in one shot
    all_genre_names: Set[str] = set()
    for r in target_records:
        for g in r.get("genres", []):
            all_genre_names.add(g)
    genre_map = get_or_create_genres(db, all_genre_names)

    # Pre-load existing identifier index into memory for instant duplicate lookup
    existing_ident_rows = db.execute(
        select(ContentIdentifier.provider, ContentIdentifier.external_id, ContentIdentifier.content_id)
    ).all()
    # Key: (provider, external_id) -> content_id
    ident_lookup: Dict[Tuple[str, str], uuid.UUID] = {
        (row[0], row[1]): row[2] for row in existing_ident_rows
    }

    inserted_count = 0
    updated_count = 0

    for i in range(0, total, batch_size):
        batch = target_records[i : i + batch_size]
        for rec in batch:
            tmdb_id = str(rec["tmdb_id"]) if rec.get("tmdb_id") else None
            imdb_id = rec.get("imdb_id")
            ml_id = rec.get("movielens_id")

            # Check if this item is already in DB through any of its external identifiers
            content_id = None
            if tmdb_id and ("tmdb_movie", tmdb_id) in ident_lookup:
                content_id = ident_lookup[("tmdb_movie", tmdb_id)]
            elif imdb_id and ("imdb", imdb_id) in ident_lookup:
                content_id = ident_lookup[("imdb", imdb_id)]
            elif ml_id and ("movielens_v1", ml_id) in ident_lookup:
                content_id = ident_lookup[("movielens_v1", ml_id)]

            if content_id:
                # Update existing record if new metadata is present
                existing_item = db.get(ContentItem, content_id)
                if existing_item:
                    if rec.get("overview") and not existing_item.overview:
                        existing_item.overview = rec["overview"]
                    if rec.get("release_year") and not existing_item.release_year:
                        existing_item.release_year = rec["release_year"]
                    updated_count += 1
            else:
                # Insert new ContentItem
                new_item = ContentItem(
                    id=uuid.uuid4(),
                    content_type="movie",
                    visual_format=rec.get("visual_format", "live_action"),
                    is_anime=rec.get("is_anime", False),
                    title=rec.get("title") or "Unknown Movie",
                    original_title=rec.get("original_title"),
                    release_year=rec.get("release_year"),
                    overview=rec.get("overview"),
                    metadata_source=rec.get("metadata_source", "local"),
                )
                db.add(new_item)
                db.flush()

                content_id = new_item.id
                inserted_count += 1

                # Add identifiers
                if tmdb_id:
                    db.add(ContentIdentifier(content_id=content_id, provider="tmdb_movie", external_id=tmdb_id))
                    ident_lookup[("tmdb_movie", tmdb_id)] = content_id
                if imdb_id:
                    db.add(ContentIdentifier(content_id=content_id, provider="imdb", external_id=imdb_id))
                    ident_lookup[("imdb", imdb_id)] = content_id
                if ml_id:
                    db.add(ContentIdentifier(content_id=content_id, provider="movielens_v1", external_id=ml_id))
                    ident_lookup[("movielens_v1", ml_id)] = content_id

                # Link Genres
                for g_name in rec.get("genres", []):
                    clean_g = GENRE_NORMALIZATION.get(g_name.strip().lower(), g_name.strip())
                    if clean_g in genre_map:
                        db.add(ContentGenre(content_id=content_id, genre_id=genre_map[clean_g].id))

        db.commit()
        print(f"  Processed {min(i + batch_size, total)}/{total} movies...")

    return inserted_count, updated_count


async def enrich_via_tmdb(db: Session, svc: TMDBService, limit: int = 50) -> int:
    """Enrich movie records missing poster/overview through TMDB API."""
    if not svc.is_configured:
        print("TMDB_API_KEY is not configured; skipping TMDB enrichment.")
        return 0

    print(f"Querying up to {limit} movies with TMDB identifiers for enrichment...")
    stmt = (
        select(ContentItem, ContentIdentifier.external_id)
        .join(ContentIdentifier, ContentIdentifier.content_id == ContentItem.id)
        .where(
            ContentIdentifier.provider == "tmdb_movie",
            ContentItem.poster_path.is_(None),
        )
        .limit(limit)
    )
    items_to_enrich = db.execute(stmt).all()
    if not items_to_enrich:
        print("No items currently need TMDB enrichment.")
        return 0

    enriched = 0
    for item, tmdb_id in items_to_enrich:
        details = await svc.get_movie_details(tmdb_id)
        if details:
            if details.get("poster_path"):
                item.poster_path = details["poster_path"]
            if details.get("backdrop_path"):
                item.backdrop_path = details["backdrop_path"]
            if details.get("overview") and not item.overview:
                item.overview = details["overview"]
            if details.get("runtime_minutes"):
                item.runtime_minutes = details["runtime_minutes"]
            if details.get("popularity_score"):
                item.popularity_score = Decimal(str(details["popularity_score"]))
            if details.get("tmdb_vote_average"):
                item.tmdb_vote_average = Decimal(str(details["tmdb_vote_average"]))
            item.metadata_source = "tmdb"
            item.last_synced_at = utcnow()
            enriched += 1
            await asyncio.sleep(0.05)  # Rate limiting friendliness

    db.commit()
    print(f"Successfully enriched {enriched} movies with high-res TMDB metadata.")
    return enriched


async def ingest_tv_series(db: Session, svc: TMDBService, fetch_online: bool = True) -> int:
    """Ingest TV series catalog including baseline series and live TMDB popular/anime series."""
    print("Ingesting TV series and anime catalog...")

    # Pre-extract genres for baseline TV
    all_tv_genres: Set[str] = set()
    for s in BASELINE_TV_SERIES:
        for g in s.get("genres", []):
            all_tv_genres.add(g)
    genre_map = get_or_create_genres(db, all_tv_genres)

    series_candidates: List[Dict[str, Any]] = list(BASELINE_TV_SERIES)

    if fetch_online and svc.is_configured:
        print("Fetching popular and trending TV series from TMDB API...")
        popular_tv = await svc.get_popular_tv(page=1)
        trending_tv = await svc.get_trending_tv(time_window="week")

        for tv_sum in popular_tv + trending_tv:
            tmdb_id = tv_sum.get("tmdb_id")
            if not tmdb_id or any(s.get("tmdb_id") == tmdb_id for s in series_candidates):
                continue
            details = await svc.get_tv_details(tmdb_id)
            if details:
                series_candidates.append(details)
                await asyncio.sleep(0.05)

    ingested = 0
    for s_data in series_candidates:
        tmdb_id = str(s_data["tmdb_id"])
        # Check if already present
        existing_ident = db.scalar(
            select(ContentIdentifier).where(
                ContentIdentifier.provider == "tmdb_tv",
                ContentIdentifier.external_id == tmdb_id,
            )
        )
        if existing_ident:
            continue

        item = ContentItem(
            id=uuid.uuid4(),
            content_type="series",
            visual_format=s_data.get("visual_format", "live_action"),
            is_anime=s_data.get("is_anime", False),
            title=s_data.get("title") or "Unknown Series",
            original_title=s_data.get("original_title"),
            original_language=s_data.get("original_language", "en"),
            release_year=s_data.get("release_year"),
            total_seasons=s_data.get("total_seasons"),
            total_episodes=s_data.get("total_episodes"),
            status=s_data.get("status", "Ended"),
            overview=s_data.get("overview"),
            poster_path=s_data.get("poster_path"),
            backdrop_path=s_data.get("backdrop_path"),
            popularity_score=s_data.get("popularity_score") or Decimal("50.0"),
            tmdb_vote_average=s_data.get("tmdb_vote_average"),
            metadata_source="tmdb" if svc.is_configured else "baseline",
            last_synced_at=utcnow(),
        )
        db.add(item)
        db.flush()

        # Add TMDB TV Identifier
        db.add(ContentIdentifier(content_id=item.id, provider="tmdb_tv", external_id=tmdb_id))
        if s_data.get("imdb_id"):
            db.add(ContentIdentifier(content_id=item.id, provider="imdb", external_id=s_data["imdb_id"]))

        # Link Genres
        for g_name in s_data.get("genres", []):
            clean_g = GENRE_NORMALIZATION.get(g_name.strip().lower(), g_name.strip())
            if clean_g in genre_map:
                db.add(ContentGenre(content_id=item.id, genre_id=genre_map[clean_g].id))

        # Ingest Seasons metadata
        for season_info in s_data.get("seasons", []):
            s_num = season_info.get("season_number")
            if s_num is None:
                continue
            season_record = Season(
                id=uuid.uuid4(),
                series_id=item.id,
                season_number=s_num,
                title=season_info.get("title") or f"Season {s_num}",
                overview=season_info.get("overview"),
                air_date=season_info.get("air_date"),
                episode_count=season_info.get("episode_count", 0),
                poster_path=season_info.get("poster_path"),
            )
            db.add(season_record)

        ingested += 1

    db.commit()
    print(f"Successfully ingested {ingested} TV series with season metadata.")
    return ingested


async def run_pipeline(
    limit: Optional[int] = None,
    batch_size: int = 500,
    enrich: bool = False,
    import_tv: bool = True,
    dry_run: bool = False,
) -> None:
    """Execute complete ingestion pipeline."""
    print("=" * 65)
    print("CINECUE Milestone 2: Catalogue Ingestion & Unified Pipeline")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print("=" * 65)

    if dry_run:
        print("[DRY RUN] Validating datasets without database modification...")
        records = build_local_dataset()
        print(f"[DRY RUN] Successfully assembled {len(records)} unified movie records.")
        return

    init_db()
    with SessionLocal() as db:
        # 1. Ingest Movies
        records = build_local_dataset()
        inserted, updated = ingest_movies_batch(db, records, limit=limit, batch_size=batch_size)

        # 2. Enrich via TMDB if requested
        if enrich:
            await enrich_via_tmdb(db, tmdb_service, limit=50)

        # 3. Ingest TV series and Anime
        if import_tv:
            await ingest_tv_series(db, tmdb_service, fetch_online=enrich)

        # 4. Report Final Catalogue Counts
        movie_count = db.scalar(select(func.count(ContentItem.id)).where(ContentItem.content_type == "movie")) or 0
        series_count = db.scalar(select(func.count(ContentItem.id)).where(ContentItem.content_type == "series")) or 0
        anime_count = db.scalar(select(func.count(ContentItem.id)).where(ContentItem.is_anime.is_(True))) or 0
        genre_count = db.scalar(select(func.count(Genre.id))) or 0
        ident_count = db.scalar(select(func.count(ContentIdentifier.id))) or 0
        season_count = db.scalar(select(func.count(Season.id))) or 0

        print("=" * 65)
        print("Ingestion Completed Successfully:")
        print(f"  • Total Movies in Catalogue: {movie_count}")
        print(f"  • Total TV Series in Catalogue: {series_count}")
        print(f"  • Anime Titles (Movies + Series): {anime_count}")
        print(f"  • Total Unique Genres: {genre_count}")
        print(f"  • External Provider Identifiers: {ident_count}")
        print(f"  • Seasons Metadata: {season_count}")
        print(f"  • New Movies Inserted this run: {inserted}")
        print(f"  • Existing Movies Updated: {updated}")
        print("=" * 65)


def main():
    parser = argparse.ArgumentParser(description="CINECUE Unified Catalogue Ingestion")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of movies to ingest")
    parser.add_argument("--batch-size", type=int, default=500, help="Database commit batch size")
    parser.add_argument("--enrich-tmdb", action="store_true", help="Enrich metadata using TMDB API")
    parser.add_argument("--import-tv", action="store_true", default=True, help="Import TV series catalogue")
    parser.add_argument("--dry-run", action="store_true", help="Validate datasets without database writes")

    args = parser.parse_args()
    asyncio.run(
        run_pipeline(
            limit=args.limit,
            batch_size=args.batch_size,
            enrich=args.enrich_tmdb,
            import_tv=args.import_tv,
            dry_run=args.dry_run,
        )
    )


if __name__ == "__main__":
    main()
