# Accommodation Discovery Platform

A microservices-based web app for discovering accommodations and dining spots with map search, AI chat, and recommendations.

## Big Picture

- React SPA for users to search places, plan trips, and chat with AI.
- Nginx gateway routes /api/v1 traffic to backend services.
- Core service provides the main REST API for users, places, reviews, and search.
- AI service handles chat and NLP parsing, and calls the recommendation service.
- Recommendation service ranks results using Google Maps (optional) or PostgreSQL fallback.
- PostgreSQL stores core entities; Firestore stores client-managed trips and saved items.

## Architecture

```
Frontend (React/Vite)
  -> API Gateway (Nginx)
     -> Core Service (NestJS)
     -> AI Service (FastAPI)
        -> Recommendation Service (FastAPI)
   -> PostgreSQL
  -> Firebase Auth + Firestore (client-side)
  -> External APIs (OSRM, Nominatim, optional Google Maps)
```

## Services and Roles

- frontend: UI, auth, map interaction, trip management, streaming chat
- core-service: users, places, reviews, search, AI proxy
- ai-service: chat and NLP parsing
- recommendation-service: ranking and recommendations
- gateway: single entry point and reverse proxy
- postgres: persistence for core entities

## Request Flow

- Frontend -> Gateway -> Core Service for places, reviews, search.
- Frontend -> Gateway -> AI Service for chat and parsing.
- AI Service -> Recommendation Service for ranked results.
- Core Service + Recommendation Service -> PostgreSQL.
- Frontend -> Firebase Auth/Firestore for user session and trip data.

## Key Endpoints (via Gateway)

- /api/v1/users, /places, /reviews, /search, /health -> core-service
- /api/v1/ai/* -> ai-service
- /api/v1/recommendations/* -> recommendation-service

## Tech Stack

- Frontend: React, Vite, TailwindCSS, Leaflet
- Backend: NestJS, FastAPI
- Database: PostgreSQL
- Auth: Firebase Auth (client) + Firebase Admin (server)
- Gateway: Nginx
- Infra: Docker, Docker Compose

## Quick Start

```bash
cp .env.example .env
cp services/core-service/.env.example services/core-service/.env
cp services/ai-service/.env.example services/ai-service/.env
cp services/recommendation-service/.env.example services/recommendation-service/.env
cp services/frontend/.env.example services/frontend/.env

make dev
```

## Environment Notes

- GROQ_API_KEY is required for ai-service.
- GOOGLE_MAPS_API_KEY is optional for recommendation-service.
- PostgreSQL credentials come from root .env.

## Testing

```bash
make test
```

## Known Limitations

- AI conversation history is in-memory and resets on restart.
- Recommendation quality degrades without Google Maps.
- CORS is permissive in dev and should be tightened for production.
