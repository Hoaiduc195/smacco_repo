from fastapi import APIRouter
from app.schemas.recommendation import RecommendRequest, RecommendResponse
from app.services.recommendation_service import RecommendationEngine

router = APIRouter()

engine = RecommendationEngine()


@router.post("", response_model=RecommendResponse)
async def get_recommendations(request: RecommendRequest):
    """
    Receive filters (location, type, budget) from AI Service.
    Query database, rank results, and return top recommendations.
    """
    results = await engine.recommend(
        location=request.location,
        place_type=request.type,
        budget=request.budget,
    )
    return RecommendResponse(results=results)
