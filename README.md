# Accommodation Discovery — Modular Monolith

A single NestJS application with modular structure for discovering accommodations and dining spots.

## Architecture

```
Single NestJS App (port 3001)
  └── modules/
      ├── users         — User management (Firebase Auth)
      ├── places        — Place CRUD
      ├── reviews       — User reviews
      ├── search        — Multi-provider search (Google Maps + OSM)
      ├── chat          — AI chat via Groq LLM (streaming + non-streaming)
      ├── ai            — NLP parsing + recommendation orchestration
      ├── recommendations — Place ranking engine
      ├── rag           — Retrieval-Augmented Generation
      ├── presence      — User presence tracking
      ├── contributions — User-contributed content management
      └── health        — Health check endpoint
  └── PostgreSQL (pgvector)
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up env
cp .env.example .env
# Edit .env with your GROQ_API_KEY

# 3. Start with Docker
docker compose up --build

# Or run locally (requires PostgreSQL running)
npx prisma migrate deploy
npm run start:dev
```

## Key Endpoints

| Route | Method | Description |
|---|---|---|
| `/api/v1/health` | GET | Health check |
| `/api/v1/users` | GET/POST | User management |
| `/api/v1/places` | GET/POST | Place CRUD |
| `/api/v1/reviews` | GET/POST | Reviews |
| `/api/v1/search` | GET | Multi-provider search |
| `/api/v1/ai/chat` | POST | AI chat (non-streaming) |
| `/api/v1/ai/chat/stream` | POST | AI chat (SSE streaming) |
| `/api/v1/ai/parse` | POST | NLP parse + recommendations |
| `/api/v1/ai/rag/chunks` | POST/GET | RAG chunk management |
| `/api/v1/recommendations` | POST | Direct recommendations |
| `/api/v1/presence/:placeId` | GET/POST/DELETE | Presence tracking |
| `/api/v1/contributions/files` | POST/GET | File contributions |
| `/api/docs` | GET | Swagger UI |

## Tech Stack

- **Runtime**: Node.js + NestJS (TypeScript)
- **Database**: PostgreSQL with pgvector
- **ORM**: Prisma
- **AI/LLM**: Groq API
- **Auth**: Firebase Admin SDK
- **Search**: Google Maps + OpenStreetMap Nominatim

## Coming from Microservices?

This replaces the previous 4-service architecture:
- `core-service` (NestJS) → modules: users, places, reviews, search
- `ai-service` (FastAPI) → modules: chat, ai
- `recommendation-service` (FastAPI) → module: recommendations
- `gateway` (Nginx) → not needed, NestJS handles routing

All inter-service HTTP calls are now **direct method calls** via NestJS dependency injection.
