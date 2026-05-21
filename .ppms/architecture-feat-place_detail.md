# Project Architecture: Accommodation Discovery Platform

> Last updated: 2026-05-21 17:53
> Branch: feat/place_detail

## Overview
A modular monolith web application for discovering accommodations and dining spots. The app now includes a Reddit-like place discussion system where AI answers are pinned at the top of each thread, while onsite and offsite users can freely ask and comment. Onsite status is verified by coordinates and can be toggled off for privacy. Users can also save/bookmark places of interest (hotels, homestays, restaurants, cafes) to their profile, managing their saved list directly from place details or their personal profile page. Additionally, users have full control over their contributions with the ability to delete their own reviews and community questions (which cascadedly deletes associated user and AI answers).

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
  - Search-related services use SerpAPI for result generation while Goong remains available for geocoding / location anchoring only. External API integration utilities (Nominatim & Overpass) are robustly hardened against rate limits and gateway timeouts by strictly verifying HTTP status and JSON content-type before parsing.
  - `PlaceDetailPage` fetches and synchronizes user presence `onsiteStatus` on mount and whenever the place ID changes via `getMyOnsiteStatus()`, preventing early 401 login redirect issues while maintaining state across page reloads and transitions.
  - `PlaceDetailPage` features a dynamic check-in / check-out button that supports toggle behavior, updates UI stylings based on presence, and includes a smart Geolocation fallback (using the place's coordinates if browser geolocation fails or is blocked).
  - `PlaceDetailPage` dynamically checks if the place ID is external (non-UUID) and triggers an automatic synchronization call `createPlace` on mount to synchronize the place in the database and retrieve its UUID. It maps presence and check-in status smoothly using a derived state variable that compares `onsiteStatus.placeId` with both the external provider ID and the internal database UUID.
  - Place Q&A reads are public, while question/answer writes still require Firebase auth.

### Backend
- **Framework**: NestJS module-based architecture.
- **Module structure**:
  - `ai` — Groq chat, conversation storage, orchestration, and prompt-based responses.
  - `search` — SerpAPI-backed place search and ranking, with Goong retained only for geocoding.
  - `places` — Place CRUD and detail lookup.
  - `reviews` — Authenticated place review creation and retrieval with Firebase auth guard, user identity resolution, and external place ID support.
  - `users` — Firebase user upsert and profile management.
  - `presence` — DB-backed onsite check-in/out and current status retrieval.
  - `questions` — Place question threads, user answers, and AI-pinned answers.
  - `saved-places` — DB-backed bookmarking/saving of places including save status checking and personal saved place list retrieval.
  - `rag`, `recommendations`, `contributions`, `health` — existing support modules.
- **Authentication**: Firebase ID token validation via `FirebaseAuthGuard`. Firebase Admin SDK is dynamically initialized inside `canActivate` using `admin.apps.length === 0` check to guarantee environment variables loaded by `@nestjs/config` are available, preventing auth validation failures.
- **Dynamic ID Resolution**: External place IDs follow the format `<provider_name>-<provider_specific_id>` (e.g. `serpapi-xxx`). Methods like `findOne` and `findReviews` in `PlacesService`, `checkIn` in `PresenceService`, and place resolution in `QuestionsService` dynamically resolve provider composite IDs to standard UUIDs before querying Postgres.
- **Q&A flow**:
  - A user creates a place question.
  - The backend persists the question, generates an AI answer using Groq, and stores it as a pinned AI reply.
  - User answers are stored as normal answers and are annotated with onsite status when the author is actively checked in.
- **Q&A access**:
  - `GET /questions/place/:placeId` is public so place detail can render threads without an auth token on mount.
  - `POST /questions` and `POST /questions/:questionId/answers` remain guarded by Firebase auth.
- **Search provider scope**:
  - SerpAPI is the only accommodation search provider in the provider list.
  - Goong is no longer part of the search provider fan-out; it is kept for geocoding / anchor lookup only.
- **Onsite verification**:
  - `presence` verifies the user’s coordinates against the place location.
  - In development mode (`process.env.NODE_ENV === 'development'`), coordinates range check and missing coordinates validation are automatically bypassed with a warning, facilitating cross-region local testing without coordinate errors.

### Frontend ↔ Backend Interaction
- Primary communication is REST JSON.
- Firebase auth token is attached by the shared `apiClient` interceptor.
- Place detail pages fetch Q&A threads and current onsite status from backend endpoints.
- Profile pages fetch the current onsite status to display `Đang ở tại _____`.

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
- `Presence` records active onsite status and historical check-ins via `joinedAt` / `leftAt`
- `SavedPlace` join table mapping `User` to `Place` bookmarks (cascade deleted on user/place deletion)

## Completed Features
- [x] AI-assisted place search and ranking
- [x] Place detail pages with AI chat, reviews, and map preview
- [x] Firebase authentication and backend user syncing
- [x] DB-backed onsite check-in/out
- [x] Reddit-like place Q&A with AI-pinned answers
- [x] Onsite badges in thread UI and profile status display
- [x] SerpAPI-only search provider list with Goong geocoding retained separately
- [x] SerpAPI result normalization now preserves `types` and address fallbacks for downstream UI/search filtering
- [x] Place cards now display SerpAPI descriptions when available
- [x] Place detail page only loads onsite presence when authenticated, preventing login redirects on mount
- [x] DB-backed saved places (bookmarking/saving places) with place detail check-status, rose-themed button UI, and interactive Profile page tab list with reactive unsaving
- [x] Authenticated review writing with premium star-rating picker, textarea form, and real-time review list update in Place Detail page
- [x] Personal review and question deletion with confirmation dialogs, secure backend Firebase UID ownership checks, and cascaded Prisma deletes for dependent answer entries

## In-Progress Features
- [ ] Search result filtering and place-type refinement
- [ ] Place tagging workflow
- [ ] Directions/routing UX polish
- [ ] Richer moderation and vote/ranking system for Q&A

## Directory Structure

```
mono/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
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
│   │   │   ├── search/
│   │   │   └── users/
│   │   └── prisma/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   └── services/
│   │       ├── savedPlacesService.js
│   │       └── ...
│   └── package.json
├── docs/
├── docker-compose.yml
└── .ppms/
```