from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# src/server/config.py -> project root
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    # External APIs
    OMDB_API_KEY: str = ""
    YOUTUBE_API_KEY: str = ""
    TMDB_API_KEY: str = ""
    ENABLE_TRAILERS: bool = True

    # Single-User Owner Authentication (Firebase)
    CINECUE_OWNER_UID: str = ""
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ""
    CINECUE_TEST_MODE: bool = False

    # Database. Postgres in production (Neon, Supabase, Railway, ...).
    # SQLite is used as a zero-setup local fallback when DATABASE_URL is unset.
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'movieflix.db').as_posix()}"

    # Comma-separated list of allowed frontend origins
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
