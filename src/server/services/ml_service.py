import pickle
from pathlib import Path
from typing import Any

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SRC_DIR = Path(__file__).resolve().parents[2]


class MLRecommendationService:
    """Content-based recommender built from the bundled TMDB-style movie tags.

    The bundled ``movie_dict.pkl`` contains ``movie_id`` values that are TMDB
    IDs (not MovieLens IDs), so the IMDb mapping is built from the ``tmdbId``
    column of MovieLens' ``links.csv``.
    """

    def __init__(self) -> None:
        self.movie_dict: dict[str, Any] = {}
        self.movies_df: pd.DataFrame | None = None
        self.tfidf_matrix: Any = None
        self.model_id_to_imdb: dict[int, str] = {}
        self.imdb_to_model_id: dict[str, int] = {}
        self.load_model()
        self.load_links()

    def load_model(self) -> None:
        movie_dict_path = SRC_DIR / "movie_dict.pkl"

        try:
            with open(movie_dict_path, "rb") as f:
                self.movie_dict = pickle.load(f)

            movies_df = pd.DataFrame(self.movie_dict)
            movies_df["movie_id"] = movies_df["movie_id"].astype(int)
            movies_df["tags"] = movies_df["tags"].fillna("").astype(str)

            vectorizer = TfidfVectorizer(stop_words="english")
            self.tfidf_matrix = vectorizer.fit_transform(movies_df["tags"])
            self.movies_df = movies_df

            print(f"Loaded ML model with {len(movies_df)} movies")
        except Exception as exc:  # pragma: no cover - startup diagnostics
            print(f"Error loading ML model: {exc}")
            self.movie_dict = {"movie_id": [], "title": [], "tags": []}
            self.movies_df = pd.DataFrame(self.movie_dict)
            self.tfidf_matrix = None

    def load_links(self) -> None:
        """Build TMDB <-> IMDb ID mappings from MovieLens links.csv."""
        links_path = SRC_DIR / "data" / "links.csv"
        if not links_path.exists():
            print("links.csv not found; IMDb recommendations disabled")
            return

        try:
            links = pd.read_csv(links_path)
            for row in links.itertuples(index=False):
                if pd.isna(row.imdbId) or pd.isna(row.tmdbId):
                    continue
                model_id = int(row.tmdbId)
                imdb_id = f"tt{int(row.imdbId):07d}"
                self.model_id_to_imdb[model_id] = imdb_id
                self.imdb_to_model_id[imdb_id] = model_id
            print(f"Loaded {len(self.model_id_to_imdb)} TMDB/IMDb mappings")
        except Exception as exc:  # pragma: no cover - startup diagnostics
            print(f"Error loading links.csv: {exc}")

    def get_trending_movies(self, limit: int = 20) -> list[dict[str, Any]]:
        if self.movies_df is None or len(self.movies_df) == 0:
            return []
        return self.movies_df.head(limit).to_dict("records")

    def get_similar_movies(self, model_id: int, limit: int = 10) -> list[dict[str, Any]]:
        """Content-based recommendations for a TMDB movie ID."""
        if self.tfidf_matrix is None or self.movies_df is None:
            return []

        matches = self.movies_df.index[self.movies_df["movie_id"] == model_id]
        if len(matches) == 0:
            return []

        movie_index = int(matches[0])
        scores = cosine_similarity(
            self.tfidf_matrix[movie_index], self.tfidf_matrix
        ).ravel()
        ranked = scores.argsort()[::-1]

        recommendations: list[dict[str, Any]] = []
        for index in ranked:
            if int(index) == movie_index:
                continue
            if scores[index] <= 0:
                continue
            recommendations.append(self.movies_df.iloc[int(index)].to_dict())
            if len(recommendations) >= limit:
                break
        return recommendations

    def get_similar_movies_by_imdb(
        self, imdb_id: str, limit: int = 10
    ) -> list[dict[str, Any]]:
        model_id = self.imdb_to_model_id.get(imdb_id)
        if model_id is None:
            return []

        # Not every model movie has a MovieLens/IMDb link, so over-fetch and
        # keep only movies we can resolve to an IMDb ID.
        candidates = self.get_similar_movies(model_id, limit * 10)

        enriched: list[dict[str, Any]] = []
        for movie in candidates:
            resolved = self.model_id_to_imdb.get(int(movie["movie_id"]))
            if resolved:
                enriched.append({**movie, "imdb_id": resolved})
            if len(enriched) >= limit:
                break
        return enriched


ml_service = MLRecommendationService()
