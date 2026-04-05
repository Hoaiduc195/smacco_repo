from sqlalchemy import Column, DateTime, String, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class Place(Base):
    __tablename__ = "Place"

    id = Column(UUID(as_uuid=True), primary_key=True)
    locationId = Column(String, nullable=False, unique=True)
    nameCache = Column(String, nullable=False)
    addressCache = Column(String)
    type = Column(String)
    metrics = Column(JSON)
    imageUrl = Column(String)
    coordinates = Column(JSON)
    lastUpdated = Column(DateTime(timezone=True))
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
