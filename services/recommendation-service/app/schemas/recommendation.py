from pydantic import BaseModel
from typing import Optional, List


class RecommendRequest(BaseModel):
    location: Optional[str] = None
    type: Optional[str] = None
    budget: Optional[str] = None


class RecommendationItem(BaseModel):
    location_id: str
    name: str
    address: Optional[str] = None
    rating: Optional[float] = None
    score: float = 0.0
    type: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class RecommendResponse(BaseModel):
    results: List[RecommendationItem] = []
