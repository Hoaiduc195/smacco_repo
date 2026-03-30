from fastapi import APIRouter, HTTPException
from app.schemas.parse_request import ParseRequest, ParseResponse
from app.services.nlp_service import NLPService
from app.services.recommendation_client import RecommendationClient

router = APIRouter()

nlp_service = NLPService()
recommendation_client = RecommendationClient()


@router.post("", response_model=ParseResponse)
async def parse_user_input(request: ParseRequest):
    """
    Parse user natural language input and extract:
    - location (e.g., 'Đà Nẵng', 'Củ Chi')
    - type (e.g., 'food', 'accommodation')
    - budget (e.g., 'cheap', 'medium', 'expensive')

    Then call Recommendation Service for ranked results.
    """
    try:
        # Step 1: Extract filters from natural language
        filters = nlp_service.extract_filters(request.text)

        # Step 2: Call recommendation service
        recommendations = await recommendation_client.get_recommendations(filters)

        return ParseResponse(
            query=request.text,
            extracted_filters=filters,
            recommendations=recommendations,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
