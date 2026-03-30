from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

_client = None


async def get_database():
    """Get MongoDB database connection."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGO_URI)
    return _client.get_default_database()
