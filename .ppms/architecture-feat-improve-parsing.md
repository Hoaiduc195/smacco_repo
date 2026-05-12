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
- **Services** (12):
  - `api.js` — Axios base instance
  - `aiService.js` — AI chat & parse endpoints
  - `placeService.js` — Place CRUD & search
  - `checkInService.js` — Presence check-in/out
  - `ownedPlaceService.js` — User-owned place management
  - `recommendationService.js` — Recommendation API calls
  - `routingService.js` — Directions / routing
  - `serpService.js` — Search engine results
  - `userProfileService.js` — User profile operations
  - `firebase.js` — Firebase client init
  - `firestoreError.js` — Firestore error handler (+ test)
- **Hooks** (3): `useDebounce`, `useStreamingChat` (+ test)
- **Layouts** (1): `MainLayout`

### Backend
- **Framework**: NestJS 10 (TypeScript)
- **Module structure** (10 feature modules):
  1. `UsersModule` — User management (Firebase Auth sync)
  2. `PlacesModule` — Place CRUD operations
  3. `ReviewsModule` — User review management
  4. `SearchModule` — Multi-provider search (Google Maps + OSM)
  5. `AiModule` — AI chat (streaming + non-streaming), NLP intent parsing
  6. `RecommendationsModule` — Place ranking engine
  7. `RagModule` — Retrieval-Augmented Generation (chunk management)
  8. `PresenceModule` — User presence tracking at places
  9. `ContributionsModule` — User-contributed file management
  10. `HealthModule` — Health check endpoint
- **Infrastructure modules**: `PrismaModule` (database), `ConfigModule` (global config)
- **Config files**: `app`, `database`, `firebase`, `osm`, `groq`
- **Authentication**: Firebase Admin SDK (JWT verification)
- **Middleware**: CORS enabled via NestJS

### Frontend ↔ Backend Interaction
- REST API over HTTP (Axios client → NestJS controllers)
- SSE (Server-Sent Events) for AI chat streaming (`/api/v1/ai/chat/stream`)
- Frontend runs on port 3000, backend on port 3001
- Firebase for client-side auth; backend verifies Firebase JWT tokens

## API Endpoints

| Method | Path                            | Description                     | Auth |
|--------|---------------------------------|---------------------------------|------|
| GET    | `/api/v1/health`                | Health check                    | No   |
| GET    | `/api/v1/users`                 | List users                      | Yes  |
| POST   | `/api/v1/users`                 | Create/sync user                | Yes  |
| GET    | `/api/v1/places`                | List/search places              | Yes  |
| POST   | `/api/v1/places`                | Create place                    | Yes  |
| GET    | `/api/v1/reviews`               | List reviews                    | Yes  |
| POST   | `/api/v1/reviews`               | Create review                   | Yes  |
| GET    | `/api/v1/search`                | Multi-provider search           | Yes  |
| POST   | `/api/v1/ai/chat`               | AI chat (non-streaming)         | Yes  |
| POST   | `/api/v1/ai/chat/stream`        | AI chat (SSE streaming)         | Yes  |
| POST   | `/api/v1/ai/parse`              | NLP parse + recommendations     | Yes  |
| POST   | `/api/v1/ai/rag/chunks`         | Upload RAG chunks               | Yes  |
| GET    | `/api/v1/ai/rag/chunks`         | List RAG chunks                 | Yes  |
| POST   | `/api/v1/recommendations`       | Get recommendations             | Yes  |
| GET    | `/api/v1/presence/:placeId`     | Get presence at place           | Yes  |
| POST   | `/api/v1/presence/:placeId`     | Check in at place               | Yes  |
| DELETE | `/api/v1/presence/:placeId`     | Check out from place            | Yes  |
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
