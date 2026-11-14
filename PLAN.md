# Movie Recommender — Build & Free-Hosting Plan

> Personal, single-user movie recommender + watchlist app (Letterboxd-style, Netflix-inspired UI).
> Everything below is designed to run at **$0/month** within free-tier limits.

---

## 1. Target architecture

```
┌─────────────────────┐        HTTPS        ┌──────────────────────────┐
│  Vercel (free)      │ ──────────────────► │  Render (free web svc)   │
│  React + Vite SPA   │                     │  Python: FastAPI + ML    │
│  static build       │                     │  512 MB / sleeps on idle │
└─────────────────────┘                     └────────────┬─────────────┘
                                                         │
                                          ┌──────────────┴──────────────┐
                                          │                             │
                                 ┌────────▼────────┐          ┌─────────▼─────────┐
                                 │ Neon Postgres   │          │ OMDB + YouTube    │
                                 │ (free tier)     │          │ (free API quotas) │
                                 └─────────────────┘          └───────────────────┘
```

### Why this split?

| Piece | Host | Why |
|---|---|---|
| Frontend | **Vercel** | Free, instant CDN, native Vite support, custom domain |
| Backend API + ML | **Render Free (Native Python)** | Native Python web service; 512 MB RAM comfortably fits pandas/scikit-learn; no serverless bundle limit; no card required |
| Database | **Neon Postgres** | Free serverless Postgres, works from both Vercel and Render, no card required |
| Auth | **Firebase Auth** (free Spark plan) | Already integrated; 50k MAU free |
| Movie metadata | **OMDB API** (free key) | Already integrated; 1,000 requests/day |
| Trailers | **YouTube Data API** (free key) | 10,000 quota units/day — **search costs 100 units**, so cache aggressively |

### Why not the backend on Vercel?

A FastAPI + pandas + scikit-learn backend on Vercel Functions would:
- exceed the 250 MB function bundle limit once pandas/scipy/scikit-learn are included,
- cold-start slowly (pandas import + TF-IDF build),
- redeploy the whole Python bundle on every push.

Render runs the app as a normal long-lived web service (not a per-request function),
so the bundled `movie_dict.pkl` and `links.csv` load once at boot and stay in memory.

### Why not HuggingFace Spaces?

HuggingFace changed its free tier: **Static Spaces are free, but Docker and Gradio
Spaces require a paid plan** (PRO for personal accounts). Free accounts can still host
up to 2 Gradio Spaces on ZeroGPU, which is not suitable for a REST API.

### Render caveats

- Free web services **sleep after 15 minutes without traffic** and take ~1 minute to wake.
  The React client uses a 60 s axios timeout and a non-blocking personalized-recommendation
  fetch, so a cold start shows skeletons rather than an error.
- The free instance has **512 MB RAM**. The TF-IDF model is sparse (~4,800 movies), so
  memory use stays in the low hundreds of MB.
- Free services get an **ephemeral disk**. `DATABASE_URL` must point at Neon; the SQLite
  fallback is for local development only.
- 750 free instance hours/month is more than enough for one user.

---

## 2. Free-tier budget

| Service | Free allowance | What we use | Risk |
|---|---|---|---|
| Vercel Hobby | 100 GB bandwidth, unlimited deploys | static React app | none for personal use |
| Render Free | 512 MB RAM, 750 instance hours/mo, sleeps after 15 min idle | FastAPI + ML container | first request after sleep is slow (~1 min) |
| Neon Free | 0.5 GB storage, ~190 compute hours/mo | watchlist/history/cache | tiny for one user |
| Firebase Auth | 50k MAU | 1 user | none |
| OMDB | 1,000 req/day | cached; ~20/day | cache makes it safe |
| YouTube Data | 10,000 units/day (search = 100) | cached trailers; ~10–20/day | cache + lazy trailers |

**Rule: every OMDB/YouTube response is cached in Postgres.** The `movie_cache` table means each movie is fetched exactly once.

Optional: a free uptime pinger (e.g. cron-job.org or UptimeRobot) can hit `/health`
every 15 minutes to keep the Render service warm. This is optional and within free limits.

---

## 3. Database: MongoDB → PostgreSQL

Replace `pymongo` with **SQLAlchemy 2.0 + psycopg2**.

### Tables

| Table | Purpose |
|---|---|
| `users` | Firebase UID, email, display name |
| `movie_cache` | OMDB payload JSON, trailer URL, `trailer_checked` flag, timestamp |
| `watchlist` | unique `(user_id, imdb_id)`, title, added_at |
| `history` | unique `(user_id, imdb_id)`, title, progress, last_watched |

### Config

```env
# Production (Neon)
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require

# Local fallback if unset → sqlite:///movieflix.db
```

`postgres://` and `postgresql://` URLs are normalized to `postgresql+psycopg2://`.

No Alembic yet — `Base.metadata.create_all()` is enough for a single-user app. Add migrations only if the schema starts changing often.

---

## 4. Local development

```powershell
# Backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.server.main:app --reload --port 8000

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

- Local DB defaults to SQLite (`movieflix.db`) so it runs with zero setup.
- To use Postgres locally: set `DATABASE_URL` in `.env` pointing to a local or Neon database.
- Backend runs on `http://localhost:8000`, frontend on `http://localhost:3000`.
- Swagger docs: `http://localhost:8000/docs`.

---

## 5. Deployment (all free)

### 5.0 Push the project to GitHub (one-time)

Vercel and Render both deploy from a Git repo:

```powershell
git init
git add .
git commit -m "Initial commit"
# create an empty GitHub repo, then:
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

`.gitignore` already excludes `venv/`, `node_modules/`, `.env`, and local DB files.

### 5.1 Neon Postgres
1. Create a free project at neon.tech.
2. Copy the connection string (it includes `?sslmode=require`).
3. Save it as `DATABASE_URL` — locally in `.env`, on Render as an environment variable.

> Render's free tier has an ephemeral disk, so always use Neon in production.

### 5.2 Backend on Render (free web service)
1. In Render, choose **New + → Blueprint** and select this repo. The root
   `render.yaml` defines the `movieflix-api` service (Python 3.11, free plan, `/health` check).
   (Alternatively: **New + → Web Service**, Runtime **Python 3**, Build Command `pip install -r requirements.txt`, Start Command `uvicorn src.server.main:app --host 0.0.0.0 --port $PORT`, Plan **Free**.)
2. Set the environment variables:
   - `DATABASE_URL` — Neon connection string
   - `OMDB_API_KEY`
   - `YOUTUBE_API_KEY`
   - `CORS_ORIGINS=https://your-app.vercel.app`
   - `ENABLE_TRAILERS=true`
3. Deploy. Render injects `PORT`; uvicorn binds to `0.0.0.0:$PORT`.
4. Your API is live at `https://movieflix-api.onrender.com` (or the name assigned).
   First boot loads the TF-IDF model, which takes a few seconds; the first request
   after 15 minutes idle takes ~1 minute.

Verify:
```powershell
curl https://movieflix-api.onrender.com/health
curl https://movieflix-api.onrender.com/api/recommendations/tt0111161
```

### 5.3 Frontend on Vercel
1. Import the repo, set **Root Directory** to `client`.
2. Build: `npm run build`, output: `dist`.
3. Environment variable:
   - `VITE_API_BASE_URL=https://movieflix-api.onrender.com`
4. Deploy. `client/vercel.json` handles SPA routing.
5. In **Firebase Console → Authentication → Settings → Authorized domains**, add your
   Vercel domain (and `localhost` for local dev). Otherwise login fails on the deployed site.

### 5.4 CORS
Set `CORS_ORIGINS` on Render to the exact Vercel URL (comma-separated for preview URLs).

### 5.5 Redeploys
`autoDeploy: true` in `render.yaml` means every push to the default branch rebuilds the
API; Vercel rebuilds the frontend from the same push.

---

## 6. Security notes (personal app)

- Single user, but endpoints are public. Before/after launch:
  - Verify Firebase ID tokens server-side and derive `user_id` from the token instead of trusting the request body.
  - Until then, don't share the API URL publicly.
- Rotate the OMDB and YouTube keys that were committed in the repo history.
- Never commit `.env`; use provider secrets.
- Keep `client/.env.local` out of version control.

---

## 7. Product roadmap after the migration

| Phase | Scope |
|---|---|
| **0 — Run** | Build fixes, Postgres, cached OMDB/YouTube, normalized movie DTOs, deployment configs |
| **1 — Solid** | Firebase token verification, user sync, search pagination, toasts, mobile nav |
| **2 — Real ML** | IMDb ↔ MovieLens mapping, content-based "More Like This", user ratings → collaborative filtering |
| **3 — Letterboxd layer** | Ratings/reviews, diary, watched vs. watchlist, custom lists, public profile, stats |
| **4 — Social** | Follows, activity feed, friends' ratings |
| **5 — Polish** | TMDB metadata, images/caching, CI, tests, backups |

---

## 8. Definition of done for this phase

- [x] MongoDB removed, SQLAlchemy/Postgres in place
- [x] Backend runs locally (SQLite fallback)
- [x] `npm run build` passes
- [x] Watchlist/history/movie DTOs consistent (`imdbID`, `Title`, …)
- [x] "More Like This" actually loads via IMDb ↔ MovieLens mapping
- [x] OMDB/YouTube cached in Postgres
- [x] `vercel.json`, `render.yaml`, `.env.example`
- [ ] Deployed and verified on Render + Vercel + Neon
