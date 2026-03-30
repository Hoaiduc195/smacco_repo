from pydantic import BaseModel
from typing import Optional, List


class ParseRequest(BaseModel):
    text: str  # e.g. "Tìm quán ăn ngon ở Đà Nẵng, giá rẻ"
    user_id: Optional[str] = None


class ExtractedFilters(BaseModel):
    location: Optional[str] = None  # e.g. "Đà Nẵng"
    type: Optional[str] = None  # e.g. "food" | "accommodation"
    budget: Optional[str] = None  # e.g. "cheap" | "medium" | "expensive"


class RecommendationItem(BaseModel):
    location_id: str
    name: str
    address: Optional[str] = None
    rating: Optional[float] = None
    score: Optional[float] = None  # Recommendation score


class ParseResponse(BaseModel):
    query: str
    extracted_filters: ExtractedFilters
    recommendations: List[RecommendationItem] = []
