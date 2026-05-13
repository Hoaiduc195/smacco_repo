# Project Architecture: Accommodation Discovery Platform

> Last updated: 2026-05-12 09:57

## Overview
A modular monolith web application for discovering accommodations and dining spots. Features AI-powered chat (streaming SSE), multi-provider search (Google Maps + OpenStreetMap), RAG-based knowledge retrieval, Q&A, user presence tracking, and user-contributed content management. Built with a React (Vite) frontend and a NestJS backend backed by PostgreSQL with pgvector.

## Tech Stack

| Component   | Technology                          | Version   |
|-------------|-------------------------------------|-----------|
| Frontend    | React (Vite + Tailwind CSS)         | 18.2      |
| Backend     | NestJS (TypeScript)                 | 10.x      |
| Database    | PostgreSQL + pgvector               | 16        |
| ORM         | Prisma                              | 7.6.0     |
| AI/LLM      | OpenRouter (free-tier models)       | —         |
| Auth        | Firebase Admin SDK + Firebase Client| 12.x / 10.7 |
| Maps        | Leaflet + react-leaflet             | 1.9 / 4.2 |
| Search      | Google Maps API + OSM Nominatim     | —         |
| Container   | Docker Compose                      | —         |

## System Architecture

### Frontend
- **Framework**: React 18 + Vite 7 + Tailwind CSS 3.4
- **Routing**: react-router-dom v6 — nested routes with protected wrappers
- **State Management**: React Context API (AuthContext, TravelDataContext, ConversationContext)
- **Pages** (4):
  - `HomePage` — Map-based discovery, search filters, place cards
  - `PlaceDetailPage` — Place info, reviews, Q&A, place-specific chat, files
  - `LoginPage` — Firebase authentication
  - `ProfilePage` — User profile & owned places
- **Components** (11):
  - `ChatWidget` — AI chat with SSE streaming
  - `MapComponent` — Leaflet map with marker clustering
  - `Navbar` — Top navigation bar
  - `PlaceCard` — Place summary card
  - `PlaceChatPanel` — Place-scoped AI chat panel
  - `QASection` — Questions & Answers section
  - `SidebarOverlay` — Mobile-friendly sidebar overlay
  - `TagPlaceModal` / `TaggedPlacesBar` — Place tagging UI
  - `ProtectedRoute` — Auth guard wrapper
  - `ErrorBoundary` — Error boundary component
# Project Architecture: AI Travel Assistant (mono repo)

> Last updated: 2026-05-13 15:10
> Branch: feat/improve_parsing

## Overview

This repository implements an AI-assisted travel/places search and recommendation system. It provides a web frontend (React + Vite) and a NestJS backend that orchestrates AI workflows (intent routing, tool execution, response composition), hybrid search (SQL + vector), and recommendation scoring.

## Tech Stack

| Component   | Technology                 | Version / Notes |
|-------------|---------------------------:|-----------------:|
| Frontend    | React, Vite, TailwindCSS   | —                |
| Backend     | NestJS (TypeScript)        | —                |
| Database    | PostgreSQL                 | —                |
| Vector DB  | pgvector (extension)       | stored in Postgres |
| ORM         | Prisma                     | migrations in `prisma/` |
| LLM / AI    | Groq (external LLM) / LLM prompts in `ai/` | — |
| Dev / Infra | Docker Compose             | `docker-compose*.yml` |

## System Architecture

### Frontend
- **Framework**: React + Vite
- **UI**: Components under `frontend/src/components` (ChatWidget, MapComponent, PlaceCard, Navbar, etc.)
- **State & Context**: `AuthContext`, `ConversationContext`, `TravelDataContext`
- **Routing / Pages**: `frontend/src/pages` — Home, Login, PlaceDetail, Profile

### Backend
- **Framework**: NestJS (module-based)
- **Module structure** (in `backend/src/modules`): `ai`, `search`, `places`, `recommendations`, `reviews`, `users`, `presence`, `rag`, `contributions`, `health`
- **AI Orchestration**: `ai/orchestration` contains `GroqTaskRouterService`, `WorkflowEngineService`, `GroqResponseComposerService`, and tools (moved to `src/common/tools/`).
- **Database & Persistence**: Prisma client is provided via `prisma/prisma.module.ts` and `prisma/prisma.service.ts`. Schema located at `prisma/schema.prisma` with migrations in `prisma/migrations/`.

### Frontend ↔ Backend Interaction
- Primary communication: REST JSON APIs (NestJS controllers)
- Streaming: Server-Sent Events (SSE) used for chat/AI streaming responses
- Authentication: token-based (see `Auth` implementations in `users` module)

## API Endpoints (representative)

| Method | Path                   | Description                               | Auth |
|--------|------------------------|-------------------------------------------|------|
| GET    | /health                | Health check                              | no   |
| POST   | /ai/chat               | Start AI chat / orchestration workflow    | yes  |
| GET    | /search                | Basic search (optionally runs recommendations) | no/yes configurable |
| GET    | /places/:id            | Place detail                              | no   |

Full list of controllers can be found under `backend/src/modules/*`.

## Database Schema

- Prisma schema: `prisma/schema.prisma` — contains `Place` model, user/identity models, and embedding/vector fields used for semantic search.
- Migrations are stored in `prisma/migrations/`.

## Completed Features
- [x] AI Orchestration (Router -> Engine -> Composer)
- [x] Hybrid search (database + external providers)
- [x] Unified tools interface (`IUnifiedTool`) under `src/common/tools`

## In-Progress / Recent Work
- [ ] Improve intent parsing for detailed place types (current branch)
- [ ] UX improvements: multi-select place-type filter, PlaceCard icon updates

## Directory Structure (top-level)

```
backend/
frontend/
prisma/
docs/
.ppms/
src/  (backend source under backend/src/)
skills/
```

## Notes
- This architecture snapshot is a documentation artifact generated by an automated PPMS sync. For code-level details, inspect `backend/src/modules` and `frontend/src`.

| POST   | `/api/v1/contributions/files`   | Upload contributed file         | Yes  |
| GET    | `/api/v1/contributions/files`   | List contributed files           | Yes  |
| GET    | `/api/docs`                     | Swagger UI                      | No   |

## Database Schema

12 tables in PostgreSQL + pgvector:

| Table                           | Key Columns                                                  | Relations                       |
|---------------------------------|--------------------------------------------------------------|---------------------------------|
| `app_users`                     | id, firebase_uid, email, display_name                        | → reviews, files, chunks, conversations, questions, answers, presences |
| `places`                        | id, source, place_name, lat, lng, price_level, average_rating| → reviews, files, chunks, conversations, questions, presences |
| `reviews`                       | id, place_id, user_id, rating, review_text, source           | → place, user                   |
| `questions`                     | id, place_id, user_id, title, question_text, status          | → place, user, answers          |
| `answers`                       | id, question_id, user_id, answer_text, upvotes, downvotes    | → question, user, votes         |
| `answer_votes`                  | id, answer_id, user_id, vote                                 | → answer, user (unique per pair)|
| `files`                         | id, user_id, place_id, file_name, mime_type, storage_url     | → place, user                   |
| `chunks`                        | id, place_id, user_id, content, embedding (vector), metadata | → place, user                   |
| `conversations`                 | id, user_id                                                  | → user, messages, place_refs    |
| `conversation_place_references` | id, conversation_id, place_id                                | → conversation, place           |
| `messages`                      | id, conversation_id, sender_role, message_text               | → conversation                  |
| `presences`                     | id, user_id, place_id, joined_at, left_at                    | → user, place                   |

## Completed Features
- [x] Firebase authentication (login/signup/profile)
- [x] Place CRUD with multi-provider search (Google Maps + OSM)
- [x] Interactive Leaflet map with marker clustering
- [x] User reviews system
- [x] AI chat with SSE streaming (OpenRouter free-tier)
- [x] NLP intent parsing → automatic search filter population
- [x] RAG chunk management (pgvector embeddings)
- [x] Recommendation engine
- [x] User presence tracking (check-in/out)
- [x] User-contributed file management
- [x] Q&A section on place detail pages
- [x] Long-term AI user memory (profile extraction via ___PROFILE___ JSON injection → Firestore)
- [x] Mobile-responsive sidebar overlay
- [x] Swagger API documentation

## In-Progress Features
- [ ] Place tagging system (TagPlaceModal + TaggedPlacesBar UI exists)
- [ ] Routing/directions integration (routingService.js exists)
- [ ] SERP integration (serpService.js exists)

## Directory Structure

```
mono/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/
│   │   │   ├── tools/      (tool.interface.ts, tool-registry.service.ts, search/geocode/recommend tools, amenities/proximity tools)
│   │   │   └── utils/      (geo.util.ts, vietnam-filter.ts)
│   │   ├── config/         (app, database, firebase, osm, groq)
│   │   ├── prisma/         (PrismaModule + PrismaService)
│   │   └── modules/
│   │       ├── ai/
│   │       ├── contributions/
│   │       ├── health/
│   │       ├── places/
│   │       ├── presence/
│   │       ├── rag/
│   │       ├── recommendations/
│   │       ├── reviews/
│   │       ├── search/
│   │       └── users/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── components/     (11 components)
│   │   ├── contexts/       (Auth, TravelData, Conversation)
│   │   ├── hooks/          (useDebounce, useStreamingChat)
│   │   ├── layouts/        (MainLayout)
│   │   ├── pages/          (Home, PlaceDetail, Login, Profile)
│   │   └── services/       (12 service files)
│   ├── Dockerfile
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── docs/                   (11 documentation files)
├── docker-compose.yml
├── docker-compose.override.yml
├── .ppms/                  (this directory)
└── README.md
```
