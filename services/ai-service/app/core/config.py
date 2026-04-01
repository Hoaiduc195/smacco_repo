from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Service"
    ENVIRONMENT: str = "development"
    PORT: int = 8000

    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017/accommodation_db"

    # External services
    RECOMMENDATION_SERVICE_URL: str = "http://localhost:8001"

    # Groq LLM
    GROQ_API_KEY: str = ""
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_MODEL: str = "llama3-70b-8192"
    GROQ_TIMEOUT: float = 20.0
    GROQ_STREAMING_ENABLED: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
