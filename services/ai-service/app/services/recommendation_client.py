from typing import List

import httpx

from app.core.config import settings
from app.schemas.parse_request import ExtractedFilters, RecommendationItem


class RecommendationClient:
    """HTTP client for calling the Recommendation Service."""

    def __init__(self):
        self.base_url = settings.RECOMMENDATION_SERVICE_URL

    async def get_recommendations(
        self, filters: ExtractedFilters
    ) -> List[RecommendationItem]:
        """Send extracted filters to the Recommendation Service and get ranked results."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/recommend",
                json=filters.model_dump(),
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
            return [RecommendationItem(**item) for item in data.get("results", [])]
