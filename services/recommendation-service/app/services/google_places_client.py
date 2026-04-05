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

    def _parse_location(self, location_text: Optional[str]) -> Optional[dict]:
        if not location_text:
            return None
        parts = [part.strip() for part in location_text.split(',')]
        if len(parts) != 2:
            return None
        try:
            lat = float(parts[0])
            lng = float(parts[1])
        except ValueError:
            return None
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return None
        return {"lat": lat, "lng": lng}

    def _primary_type(self, types: Optional[list], place_type: Optional[str]) -> Optional[str]:
        if place_type:
            return place_type
        if not types:
            return None
        ignored = {"lodging", "point_of_interest", "establishment"}
        for value in types:
            if value not in ignored:
                return value
        return types[0]

    async def search_lodging(
        self,
        location_text: Optional[str],
        place_type: Optional[str],
        budget: Optional[str],
        limit: int = 10,
    ) -> List[RecommendationItem]:
        if not self.client or not location_text:
            return []

        parsed_location = self._parse_location(location_text)
        # Run blocking googlemaps calls in a thread
        location = parsed_location
        if not location:
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
                    type=self._primary_type(r.get("types"), place_type),
                    lat=(r.get("geometry", {}).get("location", {}) or {}).get("lat"),
                    lng=(r.get("geometry", {}).get("location", {}) or {}).get("lng"),
                )
            )
        return items

    def _score(self, rating: Optional[float], reviews: int) -> float:
        rating_part = (rating or 0) / 5.0 * 0.7
        reviews_part = min(reviews / 100.0, 1.0) * 0.3
        return round(rating_part + reviews_part, 4)
