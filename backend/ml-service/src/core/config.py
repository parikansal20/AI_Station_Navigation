from pydantic_settings import BaseSettings, SettingsConfigDict

class AppConfig(BaseSettings):
    # ── Project ───────────────────────────────────────────────
    PROJECT_NAME: str = "SARTHI Station AI"
    API_V1_STR: str = "/api/v1"

    # ── Redis ─────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    RATE_LIMIT_PER_MINUTE: int = 60
    CROWD_CACHE_TTL_SECONDS: int = 120

    # ── Sarvam AI (RAG Chatbot) ───────────────────────────────
    SARVAM_API_KEY: str = ""

    # ── Langfuse (Optional observability) ─────────────────────
    LANGFUSE_SECRET_KEY: str = ""
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

settings = AppConfig()
