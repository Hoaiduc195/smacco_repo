from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Recommendation Service"
    ENVIRONMENT: str = "development"
    PORT: int = 8001
    MONGO_URI: str = "mongodb://localhost:27017/accommodation_db"

    class Config:
        env_file = ".env"


settings = Settings()
