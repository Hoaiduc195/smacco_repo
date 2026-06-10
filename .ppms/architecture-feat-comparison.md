# Project Architecture: Accommodation Discovery Mono

> Last updated: 2026-06-10 17:21
> Branch: feat/comparison

## Overview
The project is a smart accommodation discovery platform. It combines a React map/search/chat frontend with a modular NestJS backend for places, reviews, AI chat, recommendations, RAG, presence, and user-contributed content.

## Tech Stack

| Component | Technology | Version |
|---|---|---|
| Frontend | React / Vite | React 18.2, Vite 7.3 |
| Backend | NestJS / TypeScript | NestJS 10, TypeScript 5.1 |
| Database | PostgreSQL with pgvector | External/local Docker |
| ORM | Prisma | 7.6 |
| Auth | Firebase | Firebase client 10.7, Admin 12 |
| AI/LLM | Groq / Cloudflare AI / FreeModel-compatible LLMs | Provider selected at runtime |
| Maps/Search | Google/SerpAPI, OpenStreetMap/Nominatim | External APIs |

## System Architecture

### Frontend
- **Framework**: React SPA built with Vite.
- **Module structure**: `src/pages` contains route pages such as `HomePage`, `PlaceDetailPage`, `ProfilePage`, and auth pages. `src/components` contains map/search panels, chat UI, workspace panels, comparison panels, itinerary/budget/food panels, and place cards. `src/services` wraps backend API calls and Firebase setup. `src/contexts` stores auth, travel data, and conversation/tagged-place state.
- **State management**: React hooks and Context API. Conversation state tracks tagged places, selected conversation, and chat history. `useStreamingChat` manages SSE chat state.
- **Routing**: React Router.
- **Chat UI**: `ChatWidget` is a floating map overlay with an icon-only launcher sized like the current-location control. The launcher is hidden while the chatbox is open; closing is handled from the chat header. The chatbox no longer renders suggested prompt chips.
- **AI comparison rendering**: For new `COMPARE_PLACES` responses, the backend parses the LLM `place_comparison` JSON, stores the criteria table payload in `place_comparison_results`, and stores only the human-readable overall assessment in `messages`. Chat messages with a stored comparison include `comparisonResultId` and render a `Xem chi tiết` button. Clicking it fetches `GET /api/v1/ai/comparisons/:id`, opens the narrow left rail comparison panel, and renders a light themed `PlaceComparisonTable` headed `Đánh giá chi tiết`. Test mode keeps `chat.persistHistory=false`, so comparison persistence and fetches do not touch the database.
- **AI place insight workflow**: `ANALYZE_PLACE`/Insight requires exactly one tagged place. The Insight rail shows a CTA that triggers the chat workflow. The wizard collects optional start location, priority criteria, and trip purposes; the frontend sends current user location as `userContext` by default. The normal map UI does not auto-fetch/render nearby POIs; nearby POI data is tool-only context for backend workflows.

### Backend
- **Framework**: NestJS modular monolith under `backend/src`.
- **Module structure**: `UsersModule`, `PlacesModule`, `ReviewsModule`, `SearchModule`, `AiModule`, `RecommendationsModule`, `RagModule`, `PresenceModule`, `ContributionsModule`, `HealthModule`.
- **AI orchestration**: `AiOrchestratorService` routes intent, optionally executes workflow tools, builds context, and composes final responses. `LlmResponseComposerService` enriches tagged place context with database reviews and frontend metadata.
- **Comparison workflow**: `COMPARE_PLACES` uses tagged place context and forces LLM JSON output via `response_format: { type: 'json_object' }`. The JSON schema includes `places`, `comparisonRows`, `overallAssessment`, `dataNotes`, and `followUpQuestion`.
- **Insight workflow**: `ANALYZE_PLACE` runs a multi-tool context pipeline: `place_metadata_context` normalizes the single tagged place, `geocode_anchor` optionally resolves a custom start point, `resolve_start_location_context` chooses custom/current start coordinates, `travel_estimate_context` computes deterministic distance/time estimates, `nearby_poi_context` fetches nearby POI/landmark context via Overpass when the tool runs, and final `place_insight_context` aggregates those smaller outputs into one stable composer context. LLM composition uses that aggregate plus tagged-place reviews and metadata to produce detailed Markdown sections for travel time, strengths/weaknesses, trip purposes, nearby landmarks, best time of day, and review analysis.
- **Authentication**: Firebase token validation integrated with backend auth/user modules.
- **Persistence**: Prisma maps PostgreSQL tables for users, places, reviews, files, chunks, conversations, messages, Q&A, presence, and saved places.

### Frontend ↔ Backend Interaction
- The frontend calls the backend through REST endpoints under `/api/v1` using Axios/fetch.
- Chat streaming uses `POST /api/v1/ai/chat/stream` with server-sent-event style chunks from `streamChat`.
- Search and workflow actions are sent as structured chunks; regular assistant text is streamed as `delta` strings.
- Comparison responses are parsed/persisted by the backend and streamed to the frontend as normal analysis text plus metadata. Insight responses stream as normal Markdown after workflow confirmation and tool context extraction.

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/health` | Health check | No |
| GET/POST | `/api/v1/users` | User management | Yes for user-specific operations |
| GET/POST | `/api/v1/places` | Place CRUD and details | Mixed |
| GET/POST | `/api/v1/reviews` | Place reviews | Mixed |
| GET | `/api/v1/search` | Multi-provider accommodation search | No |
| POST | `/api/v1/ai/chat` | Non-streaming AI chat/orchestration | Optional user context |
| POST | `/api/v1/ai/chat/stream` | Streaming AI chat/orchestration | Optional user context |
| GET | `/api/v1/ai/comparisons/:id` | Fetch a stored AI place comparison payload for the authenticated conversation owner | Yes |
| POST | `/api/v1/ai/parse` | NLP parsing/recommendation support | Optional |
| POST/GET | `/api/v1/ai/rag/chunks` | RAG chunk management | Mixed |
| POST | `/api/v1/recommendations` | Direct recommendations | Optional |
| GET/POST/DELETE | `/api/v1/presence/:placeId` | Presence tracking | Yes for writes |
| POST/GET | `/api/v1/contributions/files` | File contributions | Yes for writes |
| GET | `/api/docs` | Swagger UI | No |

## Database Schema
- `User` / `app_users`: application user profile mapped to Firebase UID.
- `Place` / `places`: accommodation metadata, source IDs, coordinates, categories, rating, review count, and raw provider details.
- `PlaceSource` / `place_sources`: external source mappings for places.
- `Review` / `reviews`: user or imported reviews for places.
- `Question`, `Answer`, `AnswerVote`: place Q&A and voting.
- `File` / `files`: uploaded or contributed place files.
- `Chunk` / `chunks`: RAG text chunks with pgvector embeddings.
- `Conversation`, `Message`, `ConversationPlaceReference`: chat history and referenced places.
- `PlaceComparisonResult`: structured AI comparison table payloads linked to a conversation and optionally the assistant message that presented the analysis.
- `Presence`: live user presence by place.
- `SavedPlace`: user saved places.

## Completed Features
- [x] Modular NestJS API with place, review, search, recommendation, AI, RAG, presence, and contribution modules.
- [x] React map/search experience with workspace panels and place tagging.
- [x] Streaming AI chat with workflow confirmation cards.
- [x] AI place comparison persisted as separate structured comparison result records, with chat messages showing analysis plus a `Xem chi tiết` button that loads the table on demand.
- [x] Tool-backed single-place insight workflow split into small context tools for metadata, start location, travel estimates, nearby POIs, and final aggregate context before review-informed LLM synthesis.

## In-Progress Features
- [ ] Bundle size/code splitting improvements for frontend build warnings.
- [ ] Broader automated coverage for structured comparison UI rendering.

## Directory Structure

```text
mono/
 ├── backend/
 │   ├── prisma/                 # Prisma schema and migrations
 │   └── src/
 │       ├── modules/ai/         # AI orchestration, router, composer, LLM providers
 │       ├── common/tools/       # Workflow tool registry and deterministic AI context tools
 │       ├── modules/places/     # Place APIs and services
 │       ├── modules/search/     # Search providers and orchestration
 │       └── app.module.ts       # Nest root module
 ├── frontend/
 │   └── src/
 │       ├── components/         # Map, chat, panels, cards
 │       ├── components/chat/    # Workflow cards and structured chat renderers
 │       ├── contexts/           # Auth/conversation/travel contexts
 │       ├── hooks/              # Streaming chat and workflow wizard hooks
 │       ├── pages/              # Route pages
 │       └── services/           # API and Firebase clients
 ├── tmp/                        # Temporary docs and working notes such as tool explanations
 ├── docs/                       # Architecture and feature docs
 └── docker-compose.yml          # Local services
```
