# Project Architecture: Accommodation Discovery Platform

> Last updated: 2026-05-21 21:30
> Branch: feat/search_wf

## Overview
A modular monolith web application for discovering accommodations and dining spots. The app includes a Reddit-like place discussion system with AI-pinned answers, user presence tracking (onsite verification), user-contributed content (reviews and Q&A), saving/bookmarking places, and an AI-driven Chat Assistant utilizing natural language to perform place searches on the map. The assistant includes a high-fidelity interactive place-tagging system where users can drag place cards or inline tags into the chat, copy saved places to trigger instant background clipboard-sensing suggesting tags, and query reviews contextually (RAG) using up to 15 real customer reviews loaded dynamically from PostgreSQL.

## Tech Stack

| Component | Technology | Version / Notes |
|---|---|---:|
| Frontend | React + Vite + Tailwind CSS | 18.2 / 7.x / 3.4 |
| Backend | NestJS (TypeScript) | 10.x |
| Database | PostgreSQL | 16 |
| ORM | Prisma | 7.6.0 |
| AI/LLM | Groq-based chat completions | — |
| Auth | Firebase Admin SDK + Firebase Client SDK | 12.x / 10.7 |
| Maps | Leaflet + react-leaflet | 1.9 / 4.2 |
| Search | SerpAPI + Goong geocoding | — |
| Container | Docker Compose | — |

## System Architecture

### Frontend
- **Framework**: React 18 + Vite + Tailwind CSS 3.4
- **Routing**: `react-router-dom` v6 with protected routes.
- **State management**: React Context API (`AuthContext`, `TravelDataContext`, `ConversationContext`).
- **Pages**:
  - `HomePage` — Map-based discovery, search filters, and place cards.
  - `PlaceDetailPage` — Place detail page with onsite toggle, AI-pinned Q&A threads, and reviews.
  - `LoginPage` — Firebase authentication.
  - `ProfilePage` — User profile with current onsite status and historical review/check-in context.
- **Key components**:
  - `QASection` — Live threaded Q&A UI with AI section and user replies.
  - `PlaceChatPanel` — Place-scoped AI chat panel.
  - `PlaceCard`, `MapComponent`, `Navbar`, `SidebarOverlay`, `ProtectedRoute`, `ErrorBoundary`.
- **Service layer**:
  - `questionService.js` for question/answer thread API calls.
  - `presenceService.js` for onsite status APIs (check-in, check-out / leave, status sync).
  - `userProfileService.js` now syncs Firebase users into the backend as well as Firestore.
  - `savedPlacesService.js` manages save/unsave/list operations for bookmarked places.
  - Comma-separated place types in `Navbar` are split and trimmed robustly (`.map(t => t.trim())`) to prevent spacing discrepancies when multiple checkboxes/ticks are selected.
  - `HomePage.jsx` intercepts AI search actions, extracts the query, and cleans/trims types to synchronize the filter state flawlessly.
  - `ChatWidget.jsx` and `PlaceChatPanel.jsx` intercept and parse multiple place link formats (`place:<id>` protocol, `/places/<id>` relative paths, or full host URLs like `http://localhost:3000/places/<id>`) to render custom inline MapPin badges and perform smooth programmatic routing via React Router `navigate` (preventing broken localhost:3000 links or SPA reloading).

### Backend
- **Framework**: NestJS module-based architecture.
- **Module structure**:
  - `ai` — Groq chat, conversation storage, orchestration, and prompt-based responses.
  - `search` — SerpAPI-backed place search and ranking, with Goong retained only for geocoding.
  - `places` — Place CRUD and detail lookup.
  - `reviews` — Authenticated place review creation and retrieval.
  - `users` — Firebase user upsert and profile management.
  - `presence` — DB-backed onsite check-in/out and current status retrieval.
  - `questions` — Place question threads, user answers, and AI-pinned answers.
  - `saved-places` — DB-backed bookmarking/saving of places.
  - `rag`, `recommendations`, `contributions`, `health` — existing support modules.
- **Task Routing and Parameter Extraction**:
  - `GroqTaskRouterService` classifies queries and parses search parameters. The LLM prompt is optimized to preserve the user's specific context inside `query` (e.g. `"nhà nghỉ gần đà nẵng"`) rather than simplifying it.
  - Canonical type values are strictly aligned with frontend keys: `hotel`, `hostel`, `homestay`, `apartment`, `resort`, `villa`, `guesthouse`, `motel`, `camping`.
  - Specific translation rules are enforced (e.g. `"nhà nghỉ"` maps to `"hostel"`, `"nhà khách"` to `"guesthouse"`).
- **Streaming Chat Integration**:
  - `AiOrchestratorService`'s `streamQuery` SSE workflow returns `types` alongside `type` in the `searchAction` payload, matching the non-streaming REST chat endpoint.

### Frontend ↔ Backend Interaction
- Primary communication is REST JSON.
- SSE is used for streaming chat assistant answers.
- `app:ai-search` custom event dispatches structured search parameters from the chat widget to the home page filter states.

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| GET | /api/v1/search | Search places | yes/no |
| GET | /api/v1/places/:id | Get place detail | no |
| GET | /api/v1/places/:id/reviews | Get reviews for a place | no |
| GET | /api/v1/questions/place/:placeId | Get Q&A threads for a place | yes |
| POST | /api/v1/questions | Create a question for a place | yes |
| POST | /api/v1/questions/:questionId/answers | Post a user answer | yes |
| GET | /api/v1/presence/me | Get current onsite status | yes |
| POST | /api/v1/presence/check-in | Verify coordinates and mark onsite | yes |
| DELETE | /api/v1/presence/me | Clear current onsite status | yes |
| GET | /api/v1/presence/:placeId | List active onsite users at a place | yes |
| POST | /api/v1/users/upsert | Upsert Firebase-backed user profile | no |
| POST | /api/v1/saved-places/:placeId | Lưu địa điểm vào danh sách yêu thích | yes |
| DELETE | /api/v1/saved-places/:placeId | Xóa địa điểm khỏi danh sách yêu thích | yes |
| GET | /api/v1/saved-places/check/:placeId | Kiểm tra trạng thái lưu của địa điểm | yes |
| GET | /api/v1/saved-places | Lấy danh sách tất cả địa điểm đã lưu | yes |
| DELETE | /api/v1/reviews/:id | Xóa đánh giá của bản thân | yes |
| DELETE | /api/v1/questions/:id | Xóa câu hỏi của bản thân (và các câu trả lời) | yes |

## Database Schema

The app uses PostgreSQL with Prisma models for places, users, reviews, AI conversations, presence, questions, answers, and saved places.

Key relationships:
- `User` → `Question[]`, `Answer[]`, `Presence[]`, `Review[]`, `Conversation[]`, `SavedPlace[]`
- `Place` → `Question[]`, `Presence[]`, `Review[]`, `ConversationPlaceReference[]`, `SavedPlace[]`
- `Question` → `Answer[]`
- `Answer` → optional `User` reference; AI answers are stored with `userId = null`
- `Presence` records active onsite status and historical check-ins
- `SavedPlace` join table mapping `User` to `Place` bookmarks

## Completed Features
- [x] AI-assisted place search and ranking
- [x] Place detail pages with AI chat, reviews, and map preview
- [x] Firebase authentication and backend user syncing
- [x] DB-backed onsite check-in/out
- [x] Reddit-like place Q&A with AI-pinned answers
- [x] Onsite badges in thread UI and profile status display
- [x] SerpAPI-only search provider list with Goong geocoding retained separately
- [x] Place detail page only loads onsite presence when authenticated, preventing login redirects on mount
- [x] DB-backed saved places (bookmarking/saving places) with place detail check-status, rose-themed button UI, and interactive Profile page tab list with reactive unsaving
- [x] Authenticated review writing with premium star-rating picker, textarea form, and real-time review list update in Place Detail page
- [x] Personal review and question deletion with confirmation dialogs, secure backend Firebase UID ownership checks, and cascaded Prisma deletes
- [x] Refined AI Search workflow with specific user query retention (Navbar search bar sync) and correct, robust multi-type category filtering/checkbox-ticking
- [x] Interactive Place-Tagging & Reviews RAG Context (custom format `[Place Name](place:place_id)` inline MapPin badges, drag-and-drop support, background clipboard suggestion sensing, 3-dots saved place menu, and 15-reviews NestJS+Prisma database RAG)
- [x] Safe Non-UUID Place Metadata Fallback for reviews RAG (full place details telemetry, custom PlaceChatPanel integration, and strict database query type checks to prevent PostgreSQL UUID format exceptions)
- [x] Pricing & Amenities discovery enhancements (bouncing price tags, featured amenities pills in search PlaceCards, and dynamic full featured amenities grids in PlaceDetailPage)
- [x] Optimized SerpAPI Reviews Caching & Dynamic CLI Config (lazy reviews caching in PostgreSQL under source 'google', fallback zero-cost photos, config toggle command, and decoded RAG prompts)

## In-Progress Features
- [ ] Directions/routing UX polish
- [ ] Richer moderation and vote/ranking system for Q&A

## Directory Structure

```
mono/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── scripts/
│   │   └── config-serpapi.js
│   ├── serpapi-features.json
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── common/
│   │   ├── config/
│   │   ├── modules/
│   │   │   ├── ai/
│   │   │   ├── contributions/
│   │   │   ├── health/
│   │   │   ├── places/
│   │   │   ├── presence/
│   │   │   ├── questions/
│   │   │   ├── rag/
│   │   │   ├── recommendations/
│   │   │   ├── reviews/
│   │   │   ├── saved-places/
│   │   │   └── search/
│   │   └── prisma/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── docs/
├── docker-compose.yml
└── .ppms/
```
