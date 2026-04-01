from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Recommendation Service"
    ENVIRONMENT: str = "development"
    PORT: int = 8001
    MONGO_URI: str = "mongodb://localhost:27017/accommodation_db"
    GOOGLE_MAPS_API_KEY: str = ""
    GOOGLE_MAPS_LANGUAGE: str = "vi"
    GOOGLE_MAPS_REGION: str = "vn"

    class Config:
        env_file = ".env"


settings = Settings()
