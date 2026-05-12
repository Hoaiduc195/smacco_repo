# Accommodation Discovery — Quick Architecture Reference

> Updated: 2026-05-12 09:57

## Stack
- **FE**: React 18 (Vite 7 + Tailwind CSS 3.4) | **BE**: NestJS 10 (TypeScript) | **DB**: PostgreSQL 16 + pgvector | **ORM**: Prisma 7.6.0
- **AI**: OpenRouter (free-tier) | **Auth**: Firebase | **Maps**: Leaflet + react-leaflet | **Search**: Google Maps + OSM

## Backend Modules (10)
- `users` — Firebase Auth sync
- `places` — Place CRUD
- `reviews` — User reviews
- `search` — Multi-provider (Google Maps + OSM)
- `ai` — Chat (SSE streaming) + NLP intent parsing
- `recommendations` — Place ranking engine
- `rag` — Retrieval-Augmented Generation (pgvector)
- `presence` — Check-in/out tracking
- `contributions` — User file management
- `health` — Health check

## Frontend (React 18 + Vite)
- **Pages (4)**: HomePage, PlaceDetailPage, LoginPage, ProfilePage
- **Components (11)**: ChatWidget, MapComponent, Navbar, PlaceCard, PlaceChatPanel, QASection, SidebarOverlay, TagPlaceModal, TaggedPlacesBar, ProtectedRoute, ErrorBoundary
- **Services (12)**: api, aiService, placeService, checkInService, ownedPlaceService, recommendationService, routingService, serpService, userProfileService, firebase, firestoreError
- **Contexts**: AuthContext, TravelDataContext, ConversationContext
- **Hooks**: useDebounce, useStreamingChat

## Key Endpoints
- `GET /api/v1/health` → Health check
- `GET/POST /api/v1/users` → User management
- `GET/POST /api/v1/places` → Place CRUD
- `GET/POST /api/v1/reviews` → Reviews
- `GET /api/v1/search` → Multi-provider search
- `POST /api/v1/ai/chat/stream` → AI chat (SSE)
- `POST /api/v1/ai/parse` → NLP intent → search filters
- `POST/GET /api/v1/ai/rag/chunks` → RAG chunks
- `POST /api/v1/recommendations` → Recommendations
- `GET/POST/DELETE /api/v1/presence/:placeId` → Presence
- `POST/GET /api/v1/contributions/files` → File contributions

## DB Tables (12)
`app_users`, `places`, `reviews`, `questions`, `answers`, `answer_votes`, `files`, `chunks`, `conversations`, `conversation_place_references`, `messages`, `presences`

## Completed
Firebase auth, place CRUD, multi-provider search, Leaflet map + clustering, reviews, AI chat (SSE streaming), NLP intent parsing, RAG chunks, recommendations, presence, file contributions, Q&A, long-term AI memory, mobile sidebar, Swagger docs

## In Progress
Place tagging, routing/directions, SERP integration
