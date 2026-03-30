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

    class Config:
        env_file = ".env"


settings = Settings()
