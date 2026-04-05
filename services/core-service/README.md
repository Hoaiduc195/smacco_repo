# Module: core-service

## Purpose
NestJS backend gateway for users, places, reviews, search, and AI-integration APIs with PostgreSQL persistence and provider-based place search.

## TL;DR
- Primary API service exposing /api/v1 routes.
- Uses PostgreSQL (Prisma) for core entities.
- Verifies Firebase tokens for protected endpoints.
- Search pipeline supports multi-provider fallback and budget normalization.

## Key Files
- services/core-service/src/main.ts -> app bootstrap, global prefix/validation, Swagger, CORS
- services/core-service/src/app.module.ts -> module composition and config bootstrap
- services/core-service/src/modules/users/users.controller.ts -> users CRUD endpoints
- services/core-service/src/modules/places/places.controller.ts -> places CRUD endpoints
- services/core-service/src/modules/reviews/reviews.controller.ts -> review endpoints
- services/core-service/src/modules/search/search.controller.ts -> aggregated search endpoint
- services/core-service/src/modules/ai-integration/ai-integration.controller.ts -> AI parse/query proxy endpoint
- services/core-service/src/modules/health/health.controller.ts -> health endpoint
- services/core-service/src/common/guards -> auth guard(s)
- services/core-service/src/config -> app/db/firebase/google/osm settings

## API Endpoints (if any)
- POST /api/v1/users
- GET /api/v1/users
- GET /api/v1/users/:id
- PUT /api/v1/users/:id
- DELETE /api/v1/users/:id
- POST /api/v1/places
- GET /api/v1/places
- GET /api/v1/places/:id
- PUT /api/v1/places/:id
- DELETE /api/v1/places/:id
- POST /api/v1/reviews
- GET /api/v1/reviews
- GET /api/v1/reviews/:id
- DELETE /api/v1/reviews/:id
- GET /api/v1/search
- POST /api/v1/ai/query
- GET /api/v1/health

## Data Flow
Request -> global validation/auth/logging -> module controller -> service -> PostgreSQL/external provider call -> normalized response.
Search path attempts configured providers and applies query filters/budget mapping before returning result set.

## Dependencies
- NestJS, class-validator, Swagger
- Prisma + PostgreSQL
- Firebase Admin SDK (token verification)
- Axios/HTTP clients for downstream AI/recommendation/provider calls
- External providers: OSM/Google (search), AI service

## Important Logic
- Global DTO validation (whitelist/transform) enforces payload shape.
- Budget labels are normalized to internal bands before provider query.
- Search uses fallback chain across providers and can degrade to local data.
- Route protection relies on Firebase-auth guard usage per endpoint/module.

## Notes
- Exposes docs via Swagger path from bootstrap config.
- Health endpoint is public and used for orchestration checks.
- External service URLs are env-driven with localhost defaults.
