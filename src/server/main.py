from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db.postgres import close_db, init_db
from .routers import history, movies, watchlist


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting FastAPI server...")
    init_db()
    print("Database ready")
    yield
    print("Shutting down...")
    close_db()


app = FastAPI(
    title="MovieFlix API",
    description="Personal movie recommender and watchlist API",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(movies.router)
app.include_router(watchlist.router)
app.include_router(history.router)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "MovieFlix API is running", "version": "1.1.0"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
