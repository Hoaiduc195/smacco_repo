from typing import Optional, List
import math

from sqlalchemy import select
from app.core.database import get_session
from app.models.place import Place
from app.schemas.recommendation import RecommendationItem
from app.services.google_places_client import GooglePlacesClient
from app.core.config import settings


class RecommendationEngine:
    """
    Recommendation engine that queries PostgreSQL, ranks results,
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
        query = select(Place)
        if location:
            query = query.where(Place.addressCache.ilike(f"%{location}%"))
        if place_type:
            query = query.where(Place.type == place_type)
        query = query.limit(limit)

        async for session in get_session():
            result = await session.execute(query)
            places = result.scalars().all()
            break

        requested_location = self._parse_location(location)

        results = []
        for place in places:
            score = self._calculate_score(place)
            lat, lng = self._extract_coordinates(place)
            results.append(
                RecommendationItem(
                    location_id=str(place.id),
                    name=place.nameCache or "Unknown",
                    address=place.addressCache or "",
                    rating=(place.metrics or {}).get("averageRating", 0),
                    score=score,
                    type=place.type,
                    lat=lat,
                    lng=lng,
                )
            )

        results.sort(
            key=lambda item: (
                -item.score,
                self._distance_km(
                    requested_location["lat"],
                    requested_location["lng"],
                    item.lat,
                    item.lng,
                )
                if requested_location and item.lat is not None and item.lng is not None
                else float("inf"),
            )
        )
        return results

    def _parse_location(self, location: Optional[str]) -> Optional[dict]:
        if not location:
            return None
        parts = [part.strip() for part in location.split(",")]
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

    def _extract_coordinates(self, place: Place) -> tuple:
        coords = place.coordinates or {}
        return coords.get("lat"), coords.get("lng")

    def _distance_km(self, lat1: float, lng1: float, lat2: Optional[float], lng2: Optional[float]) -> float:
        if lat2 is None or lng2 is None:
            return float("inf")
        radius_km = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lng = math.radians(lng2 - lng1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return radius_km * c

    def _calculate_score(self, place: Place) -> float:
        """Calculate recommendation score based on metrics."""
        metrics = place.metrics or {}
        rating = metrics.get("averageRating", 0)
        promotes = metrics.get("totalPromotes", 0)
        reviews = metrics.get("totalReviews", 0)

        # Weighted scoring: rating (50%) + promotes (30%) + reviews (20%)
        score = (rating / 5.0) * 0.5
        score += min(promotes / 100.0, 1.0) * 0.3
        score += min(reviews / 50.0, 1.0) * 0.2

        return round(score, 4)
