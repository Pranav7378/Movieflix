# CINECUE – ML Recommendation System Audit (Read-Only Analysis)

**Audit Date:** November 2026  
**Auditor:** Senior ML Engineer  
**Scope:** In-depth audit of the machine learning recommendation pipeline, datasets, database models, runtime dependencies, performance bottlenecks, and API interfaces.

---

## 1. Executive Summary

CINECUE currently employs an **offline-stemmed, unigram TF-IDF item-to-item content recommender** spanning a fixed corpus of **4,806 movies** originating from the Kaggle TMDB 5000 dataset. Movie identity bridging between TMDB IDs and IMDb IDs is executed via MovieLens `links.csv`.

* **Model Architecture:** Single-vectorizer TF-IDF over pre-stemmed `tags` strings containing concatenated overviews, keywords, cast, and crew.
* **Personalization Reality:** **Pseudo-personalized / 1-hop seed matching.** The system does not maintain a user taste profile, does not aggregate viewing patterns across multiple films, does not use user ratings, and ignores watchlists. It identifies the single most recently logged movie (`recent[0].imdb_id`), executes an item-to-item similarity query for that single film, filters out previously logged IDs, and falls back to a static list of 10 hardcoded trending movies if history is empty.
* **Coverage Gap:** Only **3,536 out of 4,806 movies (73.7%)** possess a valid mapping in `links.csv`. If a user logs or inspects an unmapped movie (or any film released after 2017), the ML service returns an empty list `[]`, silently defaulting to the static fallback.
* **Runtime & Free-Tier Suitability:** Memory consumption is exceptionally lean (~1.5 MB sparse matrix, ~2.8 MB DataFrame, ~120–180 MB process RSS), easily fitting Render's 512 MB free tier. However, the vectorizer is re-fitted on startup rather than pre-serialized, incurring a **10–12 second boot penalty**.

---

## 2. Current Architecture

The recommendation pipeline runs synchronously inside FastAPI, orchestrated by `src/server/services/ml_service.py` and exposed via `src/server/routers/movies.py`.

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Client Request: GET /api/recommendations/personalized/{user_id}     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. PostgreSQL Query: SELECT imdb_id FROM history                       │
│    WHERE user_id = :uid ORDER BY last_watched DESC LIMIT 3             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │ History empty?                                │ History exists
            ▼                                               ▼
┌───────────────────────┐               ┌────────────────────────────────┐
│ Fallback: _trending() │               │ Extract recent[0].imdb_id      │
│ (10 hardcoded IDs)    │               └───────────────┬────────────────┘
└───────────────────────┘                               │
                                                        ▼
                                        ┌────────────────────────────────┐
                                        │ 3. ID Resolution:              │
                                        │    imdb_to_model_id[imdb_id]   │
                                        └───────────────┬────────────────┘
                                                        │
                                                        ▼
                                        ┌────────────────────────────────┐
                                        │ 4. Cosine Similarity Vector:   │
                                        │    cosine_similarity(          │
                                        │      tfidf_matrix[movie_idx],  │
                                        │      tfidf_matrix              │
                                        │    )                           │
                                        └───────────────┬────────────────┘
                                                        │
                                                        ▼
                                        ┌────────────────────────────────┐
                                        │ 5. Filter & Over-fetch:        │
                                        │    - Exclude seed movie        │
                                        │    - Drop cosine_sim <= 0      │
                                        │    - Over-fetch top 300 items  │
                                        │    - Keep items in links.csv   │
                                        │    - Drop already watched IDs  │
                                        │    - Slice top 10 candidates   │
                                        └───────────────┬────────────────┘
                                                        │
                                                        ▼
                                        ┌────────────────────────────────┐
                                        │ 6. Metadata Enrichment:        │
                                        │    _enrich_movie_ids()         │
                                        │    - Check Postgres movie_cache│
                                        │    - If uncached: live OMDb API│
                                        └───────────────┬────────────────┘
                                                        │
                                                        ▼
                                        ┌────────────────────────────────┐
                                        │ 7. Return JSON list of 10      │
                                        │    enriched movie DTOs         │
                                        └────────────────────────────────┘
```

---

## 3. Dataset and Metadata Audit

### 3.1 Data Sources & Formats

1. **`src/movie_dict.pkl` (2.2 MB)**: A pickled Python dictionary (`dict_keys(['movie_id', 'title', 'tags'])`) representing a preprocessed subset of the Kaggle TMDB 5000 dataset containing **4,806 movies**.
2. **`src/data/links.csv` (198 KB)**: MovieLens `ml-latest-small` cross-reference table containing **9,742 records** with columns: `movieId`, `imdbId`, and `tmdbId`.
3. **Dead Artifacts**:
   - `src/movies.pkl` (2.2 MB): Pickled using legacy pandas; raises `ModuleNotFoundError: No module named 'pandas.core.indexes.numeric'` when loaded under pandas 2.0+. Completely unused.
   - `src/data/ratings.csv` (2.4 MB, 100,836 ratings), `src/data/tags.csv` (118 KB), `src/data/movies.csv` (494 KB): Present in repository from MovieLens, but never imported or referenced by any Python service.
4. **PostgreSQL Cache (`movie_cache`)**: Dynamic cache storing full OMDb API JSON payloads keyed by `imdb_id`.

### 3.2 Dataset Schema (`movie_dict.pkl`)

```
Data columns (total 3 columns):
 #   Column    Non-Null Count  Dtype 
---  ------    --------------  ----- 
 0   movie_id  4806 non-null   int64  (TMDB ID)
 1   title     4806 non-null   str    (Film Title)
 2   tags      4806 non-null   str    (Merged stemmed metadata)
```

No structured metadata columns (such as separate `genres`, `cast`, `director`, `release_date`, `vote_average`) exist in `movie_dict.pkl`. They were merged into `tags` during offline generation prior to serialization.

### 3.3 TMDB ↔ IMDb Coverage Statistics

* **Total movies in ML model:** 4,806 (4,800 unique TMDB IDs)
* **Total TMDB IDs in `links.csv`:** 9,733 unique IDs
* **Intersection / Overlap:** **3,536 movies (73.7%)**
* **Unmapped movies in model:** **1,264 movies (26.3%)** can never be recommended via IMDb ID endpoints because they cannot be resolved back to an IMDb ID.

### 3.4 Three Representative Movie Records (`src/movie_dict.pkl`)

#### Record 0: Avatar (TMDB ID: 19995)
* **`movie_id`**: `19995`
* **`title`**: `Avatar`
* **`tags`**: `in the 22nd century, a parapleg marin is dispatch to the moon pandora on a uniqu mission, but becom torn between follow order and protect an alien civilization. action adventur fantasi sciencefict cultureclash futur spacewar spacecoloni societi spacetravel futurist romanc space alien tribe alienplan...`

#### Record 1: Pirates of the Caribbean: At World's End (TMDB ID: 285)
* **`movie_id`**: `285`
* **`title`**: `Pirates of the Caribbean: At World's End`
* **`tags`**: `captain barbossa, long believ to be dead, ha come back to life and is head to the edg of the earth with will turner and elizabeth swann. but noth is quit as it seems. adventur fantasi action ocean drugabus exoticisland eastindiatradingcompani loveofone'slif traitor shipwreck strongwoman ship allianc...`

#### Record 2: Spectre (TMDB ID: 206647)
* **`movie_id`**: `206647`
* **`title`**: `Spectre`
* **`tags`**: `a cryptic messag from bond’ past send him on a trail to uncov a sinist organization. while m battl polit forc to keep the secret servic alive, bond peel back the layer of deceit to reveal the terribl truth behind spectre. action adventur crime spi basedonnovel secretag sequel mi6 britishsecretservic...`

---

## 4. Audit of Existing TF-IDF Implementation

File inspected: `src/server/services/ml_service.py`

### 4.1 Vectorization Code & Parameters

```python
# Lines 36-42 of src/server/services/ml_service.py
movies_df = pd.DataFrame(self.movie_dict)
movies_df["movie_id"] = movies_df["movie_id"].astype(int)
movies_df["tags"] = movies_df["tags"].fillna("").astype(str)

vectorizer = TfidfVectorizer(stop_words="english")
self.tfidf_matrix = vectorizer.fit_transform(movies_df["tags"])
self.movies_df = movies_df
```

* **Fields used:** Exclusively `tags`.
* **Preprocessing:** Porter/Snowball stemming was applied offline prior to pickling (`parapleg marin is dispatch`). At runtime, scikit-learn applies default lowercase tokenization and strips standard English stop words (`stop_words="english"`).
* **Field Weighting:** **None.** Director, lead actors, plot keywords, and genres are concatenated into one flat string with equal term weight.
* **TF-IDF Configuration:**
  * `ngram_range`: `(1, 1)` (unigrams only; multi-word entities like "science fiction" or actor names "tom cruise" are split into unweighted independent tokens).
  * `max_features`: `None` (all **32,942 distinct tokens** are retained).
  * `min_df`: `1` (words appearing in only a single movie are retained in vocabulary).
  * `max_df`: `1.0`.
  * `norm`: `'l2'`.
* **Matrix Metrics:**
  * Shape: `(4806, 32942)`
  * Stored non-zero elements: `193,848` (sparsity: 99.88%)
  * Data buffer RAM: `1.48 MB`

### 4.2 Similarity & Ranking Implementation

```python
# Lines 85-100 of src/server/services/ml_service.py
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
```

* **Metric:** Cosine similarity via `sklearn.metrics.pairwise.cosine_similarity`.
* **Execution:** Dynamically computes a `(1, 4806)` dense dot product vector on every API call.
* **Ranking:** Full array sort via `scores.argsort()[::-1]`.
* **Pre-computation:** The full 4806 x 4806 similarity matrix is **not** precomputed or stored (which saves ~185 MB RAM at the cost of dynamic dot products).
* **Model Serialization:** The fitted `TfidfVectorizer` and `self.tfidf_matrix` are **not saved to disk**. Every container start executes `fit_transform` across all 4,806 rows.

---

## 5. User Interaction and Database Audit

Files inspected: `src/server/db/models.py`, `src/server/routers/history.py`, `src/server/routers/watchlist.py`.

### 5.1 Database Models Schema

```python
class WatchlistItem(Base):
    __tablename__ = "watchlist"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    imdb_id: Mapped[str] = mapped_column(String(20), index=True)
    movie_title: Mapped[str] = mapped_column(String(300))
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class HistoryItem(Base):
    __tablename__ = "history"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), index=True)
    imdb_id: Mapped[str] = mapped_column(String(20), index=True)
    movie_title: Mapped[str] = mapped_column(String(300))
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    last_watched: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
```

### 5.2 Feedback Signal Matrix

| Signal | Stored in Database? | Model Column | Used by ML Engine? | Usage Description |
|---|---|---|---|---|
| **Watchlist Add/Remove** | Yes | `watchlist` table | **No** | Completely ignored by the recommendation engine. |
| **Watched Movies** | Yes | `history.imdb_id` | **Yes (Partial)** | Only `recent[0].imdb_id` is queried; all other history rows are used solely for negative deduplication (`not in watched_ids`). |
| **Viewing Progress** | Yes | `history.progress` | **No** | Ignored by recommendations (a movie logged with 5% progress is treated identically to 100%). |
| **Interaction Timestamp** | Yes | `history.last_watched` | **Yes (Sorting only)** | Determines which single film is `recent[0]`. |
| **User Ratings (1–5 Stars)** | **No** | *None* | **No** | Frontend star widget updates local React state only; no rating table exists in the database. |
| **Likes / Dislikes** | **No** | *None* | **No** | No schema exists. |
| **Explicit Dismissals** | **No** | *None* | **No** | No schema exists. |

### 5.3 Personalization Assessment
The system **does not learn user preferences**. It implements a single-hop content similarity lookup from the user's latest watched movie. It possesses no concept of user profile representations, genre affinity weights, or historical interaction aggregations.

---

## 6. Recommendation API Audit

Files inspected: `src/server/routers/movies.py`.

### 6.1 Endpoints Specification

| Endpoint | Method | Input Params | Auth Required | Core Function Invoked | Output Description |
|---|---|---|---|---|---|
| `/api/recommendations/{imdb_id}` | `GET` | `imdb_id: str`<br>`limit: int = 10` | No | `ml_service.get_similar_movies_by_imdb()` + `_enrich_movie_ids()` | List of similar movie objects enriched from cache/OMDb. |
| `/api/recommendations/personalized/{user_id}` | `GET` | `user_id: str` | No | `db.scalars(HistoryItem)` + `ml_service.get_similar_movies_by_imdb()` | List of 10 recommendation objects based on user's last watched film. |
| `/api/trending` | `GET` | *None* | No | `_trending(db)` -> `TRENDING_IMDB_IDS[:10]` | 10 curated films with trailer resolution. |
| `/api/top-rated` | `GET` | *None* | No | `_top_rated(db)` -> `TRENDING_IMDB_IDS[10:]` | 10 curated films with trailer resolution. |

### 6.2 Representative API Response (`GET /api/recommendations/tt0111161`)

For seed movie *The Shawshank Redemption* (`tt0111161`):

```json
[
  {
    "Title": "Escape Plan",
    "Year": "2013",
    "Rated": "R",
    "Released": "18 Oct 2013",
    "Runtime": "115 min",
    "Genre": "Action, Thriller",
    "Director": "Mikael Håfström",
    "Writer": "Miles Chapman, Jason Keller",
    "Actors": "Sylvester Stallone, Arnold Schwarzenegger, 50 Cent",
    "Plot": "Ray Breslin is a man who has devoted his life to making prisons inescapable by going into a prison as an inmate and trying to see if he can break out...",
    "Poster": "https://m.media-amazon.com/images/M/MV5BMTk3OTcxMTEyNl5BMl5BanBnXkFtZTcwMDQ4MjQ2OQ@@._V1_QL75_UX380_CR0,0,380,562_.jpg",
    "Ratings": [
      { "Source": "Internet Movie Database", "Value": "6.7/10" },
      { "Source": "Rotten Tomatoes", "Value": "50%" },
      { "Source": "Metacritic", "Value": "49/100" }
    ],
    "Metascore": "49",
    "imdbRating": "6.7",
    "imdbVotes": "272,828",
    "imdbID": "tt1211956",
    "Type": "movie",
    "Response": "True"
  }
]
```

---

## 7. Dependencies and Deployment Constraints

### 7.1 ML Dependencies & Versions

* `scikit-learn`: `1.9.1` (installed), `requirements.txt`: `>=1.4`
* `pandas`: `3.1.1` (installed), `requirements.txt`: `>=2.0`
* `numpy`: `2.4.6` (installed), `requirements.txt`: `>=1.26`
* `scipy`: `1.17.1` (installed indirect dependency of scikit-learn)
* `httpx`: `0.28.1`
* **Embedding/NLP Libraries:** *None.* (No PyTorch, TensorFlow, HuggingFace, spaCy, or fastText).

### 7.2 Artifact Sizes & Memory Footprint

| Artifact / Operation | Size / Memory | Free-Tier Budget Status |
|---|---|---|
| `src/movie_dict.pkl` | 2.22 MB on disk | Negligible |
| `src/data/links.csv` | 198 KB on disk | Negligible |
| `self.movies_df` (DataFrame) | 2.83 MB RAM | Highly efficient |
| `self.tfidf_matrix` (Sparse Matrix) | 1.48 MB RAM data buffer | Highly efficient |
| Total Uvicorn + ML Process RSS | ~135 MB – 175 MB | **Well within 512 MB Render limit** |

### 7.3 Compute & Latency Profile

* **Per-Request Dot Product (`cosine_similarity`):** Takes **< 2.5 milliseconds** for a $(1 \times 32942)$ sparse vector multiplied by $(32942 \times 4806)$ matrix.
* **Startup-Time Bottleneck:** `vectorizer.fit_transform(movies_df["tags"])` runs single-threaded CPU tokenization, taking **10.5 to 12.0 seconds** during application lifespan initialization.
* **External Latency Risk:** `_enrich_movie_ids` calls `get_movie()` sequentially. If candidate movies are not already cached in PostgreSQL, it makes synchronous HTTP calls to OMDb API (`timeout=10`). 10 uncached candidate movies can trigger up to 10 sequential external HTTP requests, causing multi-second endpoint responses.

---

## 8. Current Limitations

### 8.1 What the Current System Does Well
1. **Extremely lightweight footprint:** Operates under 180 MB RAM, easily sustainable on Render's free tier without risk of Out-Of-Memory (OOM) crashes.
2. **Deterministic item-to-item thematic matching:** Generates coherent plot-keyword similarities for well-known movies within its corpus (e.g., prison dramas for *The Shawshank Redemption*, space travel for *Interstellar*).
3. **Database caching of metadata:** Caches OMDb and YouTube API calls in PostgreSQL, conserving daily API quotas.

### 8.2 Confirmed Bugs & Deficiencies (Direct Evidence from Code)

1. **Unmapped Seed Movie Breakdown**:
   In `ml_service.py` line 105:
   ```python
   model_id = self.imdb_to_model_id.get(imdb_id)
   if model_id is None:
       return []
   ```
   If a user's most recently watched film was released after 2017 or is one of the 1,264 unmapped TMDB titles, `model_id` resolves to `None`. The endpoint returns `[]`, causing the personalized feed to silently degrade to the static 10-movie `_trending` fallback.
2. **Single-Movie Window Myopia**:
   `get_personalized_recommendations` ignores 99% of the user's history. A user who has watched 40 sci-fi films and then one documentary will receive 100% documentary recommendations.
3. **Zero Rating or Watchlist Utilization**:
   A film added to the Watchlist has zero mathematical influence on recommendations. A film rated 1-star is treated with the same affinity as a film rated 5-stars.
4. **Unweighted, Stemmed Token Noise**:
   Because `tags` strings flatten cast, director, genres, and overview into one bag-of-words without term weighting or n-grams, common words in plot summaries can outweigh rare actor or director names.
5. **Startup Latency on Sleep Recovery**:
   Because Render free instances spin down after 15 minutes of inactivity, cold-start boots are delayed an additional ~11 seconds solely to re-fit the TF-IDF vocabulary from scratch.

---

## 9. Recommended ML Roadmap

### Stage 1 – Optimization of Current Content Model (Zero Infrastructure Change)

1. **Pre-fit and Serialize the TF-IDF Matrix**:
   * *Action:* Fit the `TfidfVectorizer` once offline and serialize `tfidf_matrix.npz` and `vectorizer.pkl` (or vocabulary JSON).
   * *Impact:* Eliminates 11 seconds of boot latency; Render containers wake in < 1 second.
2. **Multi-Item Seed History (Decayed User Vector)**:
   * *Action:* Instead of using only `recent[0]`, compute a composite user taste vector by taking the recency-weighted average of the user's last 5 watched movies:
     $$\mathbf{u} = \sum_{k=1}^{K} \alpha^k \mathbf{v}_k$$
     where $\mathbf{v}_k$ is the TF-IDF vector of the $k$-th watched movie and $\alpha = 0.8$.
   * *Impact:* Prevents recommendation whiplash from watching one atypical movie.
3. **Incorporate Watchlist into Seed Profile**:
   * *Action:* Include items from `WatchlistItem` into the composite taste vector with a moderate affinity weight (e.g., $w = 0.5$).
4. **Structured Field Weighting**:
   * *Action:* Rather than a single flattened `tags` string, weight tokens: $\text{overview} \times 1.0$, $\text{genres} \times 2.5$, $\text{keywords} \times 2.0$, $\text{director} \times 3.0$.

### Stage 2 – Real Personalization & Feedback Signals

1. **Implement `ratings` Table in PostgreSQL**:
   * *Schema:* `(user_id, imdb_id, rating: float, created_at)`.
   * *Mechanism:* Modulate movie vectors in the user taste profile:
     $$\mathbf{u} = \sum_{i \in \text{Rated}} (\text{rating}_i - 3.0) \cdot \mathbf{v}_i$$
     Movies rated $\ge 4$ stars push the vector toward those themes; movies rated $\le 2$ stars push the vector away.
2. **Explicit Negative Filtering (Dismiss / Skip)**:
   * *Action:* Allow users to dismiss a recommendation, storing dismissed IDs and excluding them from candidate ranking.
3. **Expand Mapping Coverage**:
   * *Action:* Replace static 2018 `links.csv` with a dynamic local resolution table or query the TMDB search API to retrieve missing TMDB IDs for uncached movies.

### Stage 3 – Advanced Lightweight Enhancements (Compatible with Free Tier)

1. **Pre-computed Dense Sentence Embeddings**:
   * *Evaluation:* Instead of TF-IDF, encode movie plot overviews using a lightweight sentence transformer (e.g. `all-MiniLM-L6-v2`, 384 dimensions).
   * *Storage & RAM:* 4,806 movies $\times$ 384 floats = **7.38 MB dense matrix** in float32.
   * *Inference:* Exact dot product takes < 1 ms in NumPy without PyTorch runtime needed in production.
2. **Hybrid Content + Popularity/Rating Damping**:
   * *Formula:* $\text{Score}(m) = \cos(\mathbf{u}, \mathbf{v}_m) \times \left( \frac{\text{IMDbRating}_m}{10} \right)^\gamma$ to ensure recommended films maintain high baseline quality.

---

## 10. Important Files to Inspect Next

1. `src/server/services/ml_service.py`
   * `MLRecommendationService.load_model()` (Line 29) – Vectorizer fitting.
   * `MLRecommendationService.get_similar_movies()` (Line 76) – Cosine similarity calculation.
   * `MLRecommendationService.get_similar_movies_by_imdb()` (Line 102) – TMDB/IMDb resolution and candidate over-fetching.
2. `src/server/routers/movies.py`
   * `get_personalized_recommendations()` (Line 120) – Single-seed history logic and fallback.
   * `_enrich_movie_ids()` (Line 105) – Candidate metadata resolution and OMDb API calls.
3. `src/server/db/models.py`
   * `HistoryItem` (Line 50) – Viewing history schema lacking rating columns.
   * `WatchlistItem` (Line 37) – Watchlist schema currently decoupled from ML.
4. `src/movie_dict.pkl`
   * Raw dataset containing pre-stemmed `tags`.
5. `src/data/links.csv`
   * Cross-reference table causing 26.3% missing ID mapping.

