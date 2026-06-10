# Project Architecture: Accommodation Discovery Mono

> Last updated: 2026-06-10 21:35
> Branch: feat/insight_wf

## Overview
The project is a smart accommodation discovery platform. It combines a React map/search/chat frontend with a modular NestJS backend for places, reviews, AI chat, recommendations, RAG, presence, saved places, and user-contributed content.

## Tech Stack

| Component | Technology | Version |
|---|---|---|
| Frontend | React / Vite | React 18.2, Vite 7.3 |
| Backend | NestJS / TypeScript | NestJS 10, TypeScript 5.1 |
| Database | PostgreSQL with pgvector | External/local Docker |
| ORM | Prisma | 7.6 |
| Auth | Firebase | Firebase client 10.7, Admin 12 |
| AI/LLM | Groq / Cloudflare AI / FreeModel-compatible LLMs | Provider selected at runtime |
| Maps/Search | SerpAPI, OpenStreetMap/Nominatim, Goong where configured | External APIs |

## System Architecture

### Frontend
- **Framework**: React SPA built with Vite.
- **Module structure**: `src/pages` contains route pages such as `HomePage`, `PlaceDetailPage`, `ProfilePage`, and auth/landing pages. `src/components` contains map/search panels, top search navbar, chat UI, workspace rail, comparison/insight/saved-place panels, itinerary/budget/food panels, and place cards. `src/services` wraps backend API calls and Firebase setup. `src/contexts` stores auth, travel data, and conversation/tagged-place state.
- **State management**: React hooks and Context API. Conversation state tracks tagged places, selected conversation, and chat history. `useStreamingChat` manages SSE chat state and exposes assistant message metadata to callers.
- **Routing**: React Router with protected app/detail/profile routes.
- **Chat UI**: `ChatWidget` is a floating map overlay that drives AI workflow confirmation cards. Workflow execution sends structured `workflowExecution` and `wizardPreferences` payloads to the backend.
- **AI comparison rendering**: For `COMPARE_PLACES`, the backend parses `place_comparison` JSON and stores the table payload in `place_comparison_results`, while chat messages store a human-readable assessment and `comparisonResultId`. `useStreamingChat` applies streamed `messageMeta` to the assistant message and notifies `ChatWidget`; `ChatWidget` automatically dispatches `app:open-place-comparison` once per result ID so `HomePage` fetches `GET /api/v1/ai/comparisons/:id`, opens the compare rail panel, and renders `PlaceComparisonTable` immediately after the workflow completes. The chat message still exposes a manual `Xem chi tiết` button for history/manual reopen.
- **Workspace rail and panels**: `HomePage` owns active panel state for search results, comparison, insight, and saved places. `LeftContextPanel` renders panel-specific titles/eyebrows instead of using a saved-place label for all panels. `WorkspaceRail` supports primary and secondary item groups and uses the active item label for close-button accessibility text.
- **Saved places**: The saved panel uses backend saved-place APIs and a lower secondary rail shortcut. Search result save actions sync external places through `/places` before calling saved-place APIs when needed.
- **Workflow search/insight UI**: Search workflow events update only the result list/panel/map, while the navbar search/filter state remains controlled by direct user input and restored session state. Insight workflows use tagged-place context plus optional wizard preferences/user location.

### Backend
- **Framework**: NestJS modular monolith under `backend/src`.
- **Module structure**: Root `AppModule` imports `UsersModule`, `PlacesModule`, `ReviewsModule`, `SearchModule`, `AiModule`, `RecommendationsModule`, `RagModule`, `PresenceModule`, `ContributionsModule`, `QuestionsModule`, `SavedPlacesModule`, `UploadModule`, and `HealthModule`.
- **AI orchestration**: `AiOrchestratorService` routes intent, optionally executes workflow tools after confirmation, builds search/tagged-place context, streams composer deltas, and persists assistant answers. `LlmResponseComposerService` creates workflow-specific responses.
- **Comparison workflow**: `COMPARE_PLACES` uses tagged place context and structured JSON output. The orchestrator suppresses raw JSON streaming, persists the structured payload through `PlaceComparisonResultsService`, streams readable analysis text, and includes `messageMeta.comparisonResultId` for frontend table loading.
- **Insight workflow**: `ANALYZE_PLACE` runs a context-tool pipeline for place metadata, optional geocoded start point, current/custom start location resolution, travel estimates, nearby POI context, and final place insight context before LLM synthesis.
- **Authentication**: Firebase token validation integrated with backend auth/user modules.
- **Persistence**: Prisma maps PostgreSQL tables for users, places, sources, reviews, files, chunks, conversations, messages, Q&A, comparison results, presence, and saved places.

### Frontend <-> Backend Interaction
- The frontend calls REST endpoints under `/api/v1` using Axios/fetch.
- Chat streaming uses `POST /api/v1/ai/chat/stream` with SSE-style JSON chunks from `streamChat`.
- Search/workflow actions are structured chunks; assistant text streams through `delta`; comparison metadata streams through `messageMeta`.
- Stored comparison tables are fetched through `GET /api/v1/ai/comparisons/:id` for the authenticated conversation owner.

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/health` | Health check | No |
| GET/POST | `/api/v1/users` | User management | Yes for user-specific operations |
| GET/POST | `/api/v1/places` | Place CRUD and details | Mixed |
| GET/POST | `/api/v1/reviews` | Place reviews | Mixed |
| GET | `/api/v1/search` | Multi-provider accommodation search | No |
| POST | `/api/v1/ai/chat` | Non-streaming AI chat/orchestration | Yes |
| POST | `/api/v1/ai/chat/stream` | Streaming AI chat/orchestration | Yes |
| GET | `/api/v1/ai/comparisons/:id` | Fetch a stored AI place comparison payload | Yes |
| POST | `/api/v1/ai/parse` | NLP parsing/recommendation support | Optional |
| GET/POST/DELETE | `/api/v1/saved-places` | User saved-place management | Yes |
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
- [x] Modular NestJS API with place, review, search, recommendation, AI, RAG, presence, saved-place, and contribution modules.
- [x] React map/search experience with workspace rail panels and place tagging.
- [x] Streaming AI chat with workflow confirmation cards.
- [x] AI place comparison persisted as structured comparison result records and auto-opened in the compare panel after workflow completion.
- [x] Tool-backed single-place insight workflow with place metadata, start location, travel estimate, nearby POI, and aggregate context tools.
- [x] Saved-place rail panel backed by backend saved-place APIs.

## In-Progress Features
- [ ] Bundle size/code splitting improvements for frontend build warnings.
- [ ] Broader automated coverage for full comparison panel rendering in the browser.
- [ ] Frontend lint configuration cleanup; current `npm run lint` fails before linting because ESLint config is missing/undiscovered.

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
 │       ├── components/         # Map, chat, panels, rail, cards
 │       ├── components/chat/    # Workflow cards and structured chat renderers
 │       ├── contexts/           # Auth/conversation/travel contexts
 │       ├── hooks/              # Streaming chat and workflow wizard hooks
 │       ├── pages/              # Route pages
 │       └── services/           # API and Firebase clients
 ├── .ppms/                      # Branch-scoped project memory
 ├── docs/                       # Architecture and feature docs
 └── docker-compose.yml          # Local services
```
