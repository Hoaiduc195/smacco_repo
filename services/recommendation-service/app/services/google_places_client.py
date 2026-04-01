import asyncio
from typing import List, Optional

import googlemaps

from app.core.config import settings
from app.schemas.recommendation import RecommendationItem

PRICE_BY_BUDGET = {
    "low": {0, 1},
    "mid": {2, 3},
    "high": {4},
}


class GooglePlacesClient:
    def __init__(self) -> None:
        if not settings.GOOGLE_MAPS_API_KEY:
            self.client = None
        else:
            self.client = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)

    def _budget_matches(self, price_level: Optional[int], budget: Optional[str]) -> bool:
        if not budget:
            return True
        allowed = PRICE_BY_BUDGET.get(budget.lower())
        if not allowed:
            return True
        return price_level in allowed

    async def search_lodging(
        self,
        location_text: Optional[str],
        place_type: Optional[str],
        budget: Optional[str],
        limit: int = 10,
    ) -> List[RecommendationItem]:
        if not self.client or not location_text:
            return []

        # Run blocking googlemaps calls in a thread
        geocode = await asyncio.to_thread(
            self.client.geocode,
            location_text,
            language=settings.GOOGLE_MAPS_LANGUAGE,
            region=settings.GOOGLE_MAPS_REGION,
        )
        if not geocode:
            return []

        location = geocode[0]["geometry"]["location"]
        nearby = await asyncio.to_thread(
            self.client.places_nearby,
            location=location,
            radius=5000,
            type="lodging",
            keyword=place_type or None,
            language=settings.GOOGLE_MAPS_LANGUAGE,
        )

        items: List[RecommendationItem] = []
        for r in nearby.get("results", [])[:limit]:
            if not self._budget_matches(r.get("price_level"), budget):
                continue
            rating = r.get("rating")
            reviews = r.get("user_ratings_total") or 0
            score = self._score(rating, reviews)
            items.append(
                RecommendationItem(
                    location_id=r.get("place_id", ""),
                    name=r.get("name", "Unknown"),
                    address=r.get("vicinity") or r.get("formatted_address"),
                    rating=rating,
                    score=score,
                )
            )
        return items

    def _score(self, rating: Optional[float], reviews: int) -> float:
        rating_part = (rating or 0) / 5.0 * 0.7
        reviews_part = min(reviews / 100.0, 1.0) * 0.3
        return round(rating_part + reviews_part, 4)
