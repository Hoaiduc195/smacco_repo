# Module: recommendation-service

## Purpose
FastAPI recommendation engine that ranks places from Google Places and/or MongoDB by quality and relevance.

## TL;DR
- Accepts location/type/budget filters.
- Uses Google Places when configured, with DB fallback.
- Scores and sorts candidates, then returns top recommendations.
- Designed as downstream dependency for ai-service/core flows.

## Key Files
- services/recommendation-service/app/main.py -> app bootstrap, CORS, health, router mount
- services/recommendation-service/app/api/v1/router.py -> route composition
- services/recommendation-service/app/api/v1/endpoints/recommend.py -> recommend endpoint
- services/recommendation-service/app/services/recommendation_service.py -> ranking pipeline, scoring, distance logic
- services/recommendation-service/app/services/google_places_client.py -> Google Places integration
- services/recommendation-service/app/core/database.py -> MongoDB connection
- services/recommendation-service/app/schemas/recommendation.py -> request/response schema
- services/recommendation-service/app/core/config.py -> env configuration

## API Endpoints (if any)
- POST /api/v1/recommend -> ranked recommendations from filters
- GET /health -> service health

## Data Flow
Request -> validate filter payload -> fetch candidates (Google Places, fallback/augment with MongoDB) -> compute score per candidate -> sort by score (+ distance when available) -> return top N.

## Dependencies
- FastAPI, Pydantic, Uvicorn
- Motor/PyMongo (MongoDB)
- googlemaps client library
- External: Google Maps Places API

## Important Logic
- Budget mapping translates low/mid/high into provider-specific price-level ranges.
- Scoring combines rating, review volume, and promotion/boost factors with weighted formula.
- Distance computed via haversine when coordinates are available.
- Blocking external API calls are isolated to avoid stalling async request path.

## Notes
- Works without Google key via MongoDB-only fallback, with reduced freshness/coverage.
- Location parsing supports coordinate strings; invalid coordinates are rejected/ignored by validation rules.
- CORS is open by default and should be restricted in production.
