from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Service"
    ENVIRONMENT: str = "development"
    PORT: int = 8000

    # PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/accommodation_db"

    # External services
    RECOMMENDATION_SERVICE_URL: str = "http://localhost:8001"

    # Groq LLM
    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    # llama3-70b-8192 has been decommissioned; default to supported model
    GROQ_MODEL: str = "llama-3.1-70b-versatile"
    GROQ_TIMEOUT: float = 20.0
    GROQ_STREAMING_ENABLED: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
