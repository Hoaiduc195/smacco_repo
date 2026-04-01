from typing import Optional, List

from app.core.database import get_database
from app.schemas.recommendation import RecommendationItem
from app.services.google_places_client import GooglePlacesClient
from app.core.config import settings


class RecommendationEngine:
    """
    Recommendation engine that queries MongoDB, ranks results,
    and returns the top recommendations.
    """

    def __init__(self) -> None:
        self.google_client = GooglePlacesClient()

    async def recommend(
        self,
        location: Optional[str] = None,
        place_type: Optional[str] = None,
        budget: Optional[str] = None,
        limit: int = 10,
    ) -> List[RecommendationItem]:
        # Try Google Places first if key and location are available
        if settings.GOOGLE_MAPS_API_KEY and location:
            google_results = await self.google_client.search_lodging(
                location_text=location,
                place_type=place_type,
                budget=budget,
                limit=limit,
            )
            if google_results:
                return google_results

        # Fallback to local DB
        db = await get_database()
        collection = db["places"]

        query = {}
        if location:
            query["addressCache"] = {"$regex": location, "$options": "i"}
        if place_type:
            query["type"] = place_type

        cursor = collection.find(query).limit(limit)
        places = await cursor.to_list(length=limit)

        results = []
        for place in places:
            score = self._calculate_score(place)
            results.append(
                RecommendationItem(
                    location_id=str(place.get("_id", "")),
                    name=place.get("nameCache", "Unknown"),
                    address=place.get("addressCache", ""),
                    rating=place.get("metrics", {}).get("averageRating", 0),
                    score=score,
                )
            )

        results.sort(key=lambda x: x.score, reverse=True)
        return results

    def _calculate_score(self, place: dict) -> float:
        """Calculate recommendation score based on metrics."""
        metrics = place.get("metrics", {})
        rating = metrics.get("averageRating", 0)
        promotes = metrics.get("totalPromotes", 0)
        reviews = metrics.get("totalReviews", 0)

        # Weighted scoring: rating (50%) + promotes (30%) + reviews (20%)
        score = (rating / 5.0) * 0.5
        score += min(promotes / 100.0, 1.0) * 0.3
        score += min(reviews / 50.0, 1.0) * 0.2

        return round(score, 4)
