# Movie Recommender + Watchlist

Personal, single-user movie discovery app: Netflix-inspired UI with a
Letterboxd-style watchlist, powered by a content-based recommender.

## Stack

- **Frontend:** React 18, Vite, TypeScript, Redux Toolkit, Tailwind, Firebase Auth
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL (SQLite fallback for local dev)
- **ML:** TF-IDF content-based similarity over 4,800 movies + TMDB ↔ IMDb mapping
- **APIs:** OMDB (metadata), YouTube Data (trailers), cached in Postgres
- **Hosting:** Vercel (frontend) + Render free web service (backend) + Neon Postgres — all free

See [`PLAN.md`](./PLAN.md) for the full architecture and free-hosting plan.

## Local development

### Backend

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.server.main:app --reload --port 8000
```

Copy `.env.example` to `.env` and add your OMDB/YouTube keys.
With no `DATABASE_URL`, the backend uses a local SQLite file (`movieflix.db`).

To run on PostgreSQL locally:
set `DATABASE_URL` in `.env` to your PostgreSQL database URL (e.g. Neon connection string).

API docs: http://localhost:8000/docs

### Frontend

```powershell
cd client
npm install
npm run dev
```

Frontend: http://localhost:3000

## Deployment

All free, no credit card:

- **Database → Neon:** create a free Postgres project and use its connection string
  as `DATABASE_URL`.
- **Backend → Render (free web service):** create a Blueprint from the repo; root
  [`render.yaml`](./render.yaml) deploys as a free Python 3.11 web service
  with a `/health` check. Set `DATABASE_URL`, `OMDB_API_KEY`, `YOUTUBE_API_KEY`,
  `CORS_ORIGINS=https://<your-app>.vercel.app`, `ENABLE_TRAILERS=true` in the dashboard.
  Free services sleep after 15 minutes idle and wake in ~1 minute.
- **Frontend → Vercel:** root directory `client`, build `npm run build`, output `dist`,
  env `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`.

Then add the Vercel domain under **Firebase Console → Authentication → Settings →
Authorized domains**.

> HuggingFace Docker Spaces are no longer free — Docker and Gradio Spaces now require a
> paid plan. Static Spaces remain free but cannot run this API.

Full steps: [`PLAN.md`](./PLAN.md).
