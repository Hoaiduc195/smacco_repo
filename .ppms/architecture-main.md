# Project Architecture: Smacco — Smart Travel & Accommodation Platform

> Last updated: 2026-05-29 09:08
> Branch: main

## Overview
A modular monolith web application for discovering accommodations, dining spots, and smart itinerary planning under the brand name **Smacco**. Features AI-powered chat, multi-provider search, interactive maps, Firebase authentication, saved places, check-ins, Q&A, and user-contributed content management. Built with a React (Vite) frontend and a NestJS backend backed by PostgreSQL with pgvector.

## Tech Stack

| Component   | Technology                          | Version   |
|-------------|-------------------------------------|-----------|
| Frontend    | React (Vite + Tailwind CSS)         | 18.2      |
| Backend     | NestJS (TypeScript)                 | 10.x      |
| Database    | PostgreSQL + pgvector               | 16        |
| ORM         | Prisma                              | 7.6.0     |
| AI/LLM      | OpenRouter / Groq integrations      | —         |
| Auth        | Firebase Admin SDK + Firebase Client| 12.x / 10.7 |
| Maps        | Mapbox GL + OSM/CARTO fallback      | 3.24 |
| Search      | Goong + OSM + SerpAPI integrations  | —         |
| Container   | Docker Compose                      | —         |

## System Architecture

### Frontend
- **Framework**: React 18 + Vite 7 + Tailwind CSS 3.4.
- **Routing**: `react-router-dom` v6 with public intro/auth routes and protected application routes.
- **State Management**: React Context API (`AuthContext`, `TravelDataContext`, `ConversationContext`).
- **Pages**:
  - `LandingPage` — Public SaaS-style overview page at `/` in natural Vietnamese focused on AI-assisted accommodation discovery, social proof, feature benefits, alternating product sections, Before/During/After/In-between workflow, interactive prompt demo, trust/security, testimonials, FAQ, final CTA, and embedded Firebase login.
  - `HomePage` — Protected map-based discovery app at `/app`.
  - `PlaceDetailPage` — Protected place info, reviews, Q&A, and place-specific chat.
  - `LoginPage` — Legacy Firebase login route at `/login`, redirects to `/app` after success.
  - `ProfilePage` — Protected user profile and owned places.
- **Components**:
  - `ChatWidget` — AI chat with SSE streaming.
  - `MapComponent` — Mapbox GL map with markers, clustering, route display, POI support, and OSM/CARTO raster fallback when no Mapbox token is configured.
  - `Navbar` — Authenticated app navigation, search filters, user menu, logout, and Smacco branding.
  - `PlaceCard` — Place summary card.
  - `PlaceChatPanel` — Place-scoped AI chat panel.
  - `QASection` — Questions & Answers section.
  - `SidebarOverlay` — Mobile-friendly sidebar overlay.
  - `TagPlaceModal` / `TaggedPlacesBar` — Place tagging UI.
  - `ProtectedRoute` — Auth guard wrapper; protected routes show a themed loading state while Firebase auth initializes and unauthenticated users are redirected to `/`.
  - `ErrorBoundary` — Error boundary component.

### Backend
- **Framework**: NestJS with module-based organization.
- **Module structure**: `ai`, `search`, `places`, `recommendations`, `reviews`, `users`, `presence`, `rag`, `contributions`, `health`, `saved-places`, `questions`.
- **AI Orchestration**: `ai/orchestration` contains router, workflow engine, response composer, and shared tools under `src/common/tools/`. The Groq task router and response composer both receive bounded recent conversation history; history is compacted before LLM calls so follow-up questions retain context without sending unbounded chat logs.
- **Search Answer Synthesis**: Search workflows now pass raw results through `SearchResultContextBuilder` before response composition, giving the LLM a concise objective summary with result count, rating/review/price/amenity coverage, limitations, and top candidates.
- **Place AI Context**: Place-detail AI chat can use cached Google reviews as hidden context. The backend refreshes at most 10 Google reviews from the first SerpAPI review response only when missing or older than 90 days, while visible review endpoints continue to exclude Google-sourced reviews.
- **Groq Prompt Efficiency**: For `SEARCH_PLACES`, the composer now sends the compact search summary instead of the full raw tool result dump when summary context is available.
- **Database & Persistence**: Prisma client is provided via `prisma/prisma.module.ts` and `prisma/prisma.service.ts`. Schema is located at `backend/prisma/schema.prisma`. AI chat validates conversation IDs as UUIDs, creates a fresh conversation for invalid IDs, and stores the user's turn at the start of request handling so interrupted streams do not lose the prompt.

### Frontend ↔ Backend Interaction
- Primary communication: REST JSON APIs through frontend service modules.
- Streaming: Server-Sent Events used for chat/AI streaming responses.
- Authentication: Firebase client auth in the frontend and Firebase-backed guards on protected backend resources.

## API Endpoints

| Method | Path                          | Description                                | Auth |
|--------|-------------------------------|--------------------------------------------|------|
| GET    | `/health`                     | Health check                               | No   |
| POST   | `/ai/chat`                    | Start AI chat / orchestration workflow     | Yes  |
| GET    | `/search`                     | Search with ranking / recommendation       | Config |
| GET    | `/places/:id`                 | Place detail                               | No   |
| POST   | `/api/v1/contributions/files` | Upload contributed file                    | Yes  |

### Frontend ↔ Backend Interaction
- Primary communication: REST JSON APIs through frontend service modules.
- Streaming: Server-Sent Events used for chat/AI streaming responses.
- Authentication: Firebase client auth in the frontend and Firebase-backed guards on protected backend resources.

## API Endpoints

| Method | Path                          | Description                                | Auth |
|--------|-------------------------------|--------------------------------------------|------|
| GET    | `/health`                     | Health check                               | No   |
| POST   | `/ai/chat`                    | Start AI chat / orchestration workflow     | Yes  |
| GET    | `/search`                     | Search with ranking / recommendation       | Config |
| GET    | `/places/:id`                 | Place detail                               | No   |
| POST   | `/api/v1/contributions/files` | Upload contributed file                    | Yes  |
| GET    | `/api/v1/contributions/files` | List contributed files                     | Yes  |
| GET    | `/api/docs`                   | Swagger UI                                 | No   |

## Database Schema
PostgreSQL stores users, places, reviews, questions, answers, answer votes, files, chunks, conversations, messages, conversation-place references, presences, saved places, and related travel data. Vector search uses pgvector embeddings for RAG chunks.

## Completed Features
- [x] Resolved database concurrency race conditions in PlacesService.findOne by implementing optimistic concurrency catch-recovery block to handle concurrent stub creations without unique constraint errors.
- [x] Added premium interactive fullscreen photo gallery/lightbox viewer on PlaceDetailPage.jsx with keyboard navigation, floating next/prev buttons, original link opening, and horizontal thumbnail navigation track.
- [x] Fixed SerpAPI property details enrichment by passing mandatory 'q' parameter and computing check-in/check-out dates in the future, resolving 400 Bad Request error from SerpAPI.
- [x] Search result cards now display richer metadata such as review counts, source badges, prices, amenities, and approximate distance, and they no longer force missing types to appear as hotel.
- [x] Search result cards now render backend-fetched thumbnails when available instead of only showing the category icon fallback.
- [x] Home map result list now hydrates images only, while place reviews are fetched lazily when a place is selected and the detail page uses the combined backend media endpoint.
- [x] SerpAPI is now backend-only: the frontend no longer reads `VITE_SERP_API_KEY` and fetches place images through the backend `/places/:id/photos` endpoint instead of calling SerpAPI directly.
- [x] SerpAPI Google hotel reviews can be fetched with `property_token`, cached in the backend, and used as hidden AI context without rendering them in place detail review lists.
- [x] Autoworkflow search now canonicalizes multi-type intent, repairs incomplete router output deterministically, and skips external SerpAPI provider calls when the local DB already has enough usable results.
- [x] AI search answers now receive a structured summary context so the LLM can explain result quality, notable candidates, and missing data more objectively.
- [x] Groq composer prompt size is reduced for search workflows by omitting duplicated raw tool dumps when compact search summaries are available.
- [x] Landing page now has cohesive hover interactions on hero actions, navigation chips, feature cards, workflow cards, FAQ, prompt demo, and auth panel blocks.
- [x] Clicking the current-location button now always snaps Mapbox to a fixed zoom level and resets follow-state so the map does not preserve an old zoom from previous interactions.
- [x] Advanced filter popover on the map navbar closes with smoother opacity/transform animation, and Mapbox repaint invalidation no longer forces a resize when the sidebar closes.
- [x] Public landing page before the protected map experience.
- [x] Reusable Tailwind theme system with warm base colors, primary/accent tokens, radius scale, shared shadows, card styles, button variants, input styles, badge styles, and section utilities.
- [x] Premium SaaS-style accommodation landing page with hero mockup, social proof, feature cards, workflow, prompt demo, trust/security, testimonials, FAQ, and CTA footer.
- [x] Landing page copy aligned to the product goal of helping users find suitable accommodations through chatbot-guided discovery and interactive place data.
- [x] Unified warm neutral / primary green / accent orange UI theme across public landing, login, profile, map workspace controls, panels, result cards, Q&A, modals, map popups, and chat widget.
- [x] Map workspace uses solid theme surfaces without glassmorphism/backdrop blur effects.
- [x] Public routes render immediately while protected routes continue to wait for Firebase authentication state.
- [x] Map workspace logo returns users to the public landing page and chatbot opens by default.
- [x] Embedded login on the overview page.
- [x] Smacco branding with custom non-neon favicon and logo usage.
- [x] Firebase authentication for login/signup/profile flows.
- [x] Mapbox GL map renderer with clustered markers, route layer, user location layer, and Mapbox-token fallback behavior.
- [x] Search filters for location, place type, and budget.
- [x] AI chat with streaming support.
- [x] Place detail pages with reviews, Q&A, and place chat.
- [x] Saved places and check-in flows.
- [x] User profile page.

## In-Progress Features
- [ ] Continue polishing responsive UI and bundle code splitting for large frontend chunks.

## Directory Structure

```
mono/
├── backend/
│   ├── prisma/
│   └── src/
│       ├── common/
│       ├── config/
│       ├── modules/
│       └── prisma/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── App.jsx
│       ├── components/
│       ├── contexts/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       │   ├── LandingPage.jsx
│       │   ├── HomePage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── PlaceDetailPage.jsx
│       │   └── ProfilePage.jsx
│       └── services/
├── docs/
├── docker-compose.yml
└── .ppms/
```
## 2026-05-27 21:35 - Preserve map workflow across detail navigation

- HomePage now restores persisted state before writing back to `sessionStorage`, which prevents the default empty initial render from erasing the active search workflow.
- The persisted snapshot includes the query, filters, visible places, selection, sidebar state, route state, and map focus target, so returning from detail recreates the same search context.
- PlaceDetailPage now returns to `/app` with a captured `returnToMapState` snapshot, giving the user an explicit way back to the main map without losing the active workflow.

## 2026-05-27 21:40 - Reset workflow on landing page entry

- The public landing page now clears `home_search_state` on mount, so `/` becomes the reset boundary for the map workflow.
- Returning from detail to `/app` still restores the preserved search context, but navigating to landing discards it and starts a clean session for the next visit.

## 2026-05-27 21:46 - Add direct back-to-map affordance in profile

- The profile page now exposes a dedicated `Quay lại bản đồ` button at the top of the page, reducing friction when users move from personal views back to the active map workflow.
- The place detail page already returns to `/app` with preserved state, so both detail and profile now offer clear return paths into the main map experience.

## 2026-05-27 21:52 - Make navbar the primary map hub

- The navbar logo now routes to `/app` so the main application entry stays inside the map workflow instead of resetting to landing.
- A dedicated `Bản đồ` action is visible in the desktop header, and the avatar dropdown now includes `Quay lại bản đồ` for quick recovery from any authenticated page.
- Together with the detail and profile back buttons, the app now has multiple redundant paths back to the map to reduce user friction.

## 2026-05-27 21:58 - Reduce unnecessary visual noise in navigation and cards

- The standalone navbar map button was removed to reduce header clutter, while the more contextual return paths in profile, detail, and avatar menu remain available.
- Search result cards no longer display the SerpAPI/internal source badge, leaving only higher-signal fields such as rating, price, amenities, and distance.

## 2026-05-27 22:01 - Hide place type chip in search results

- Search result cards no longer render the place type chip, so generic fallback values like `hotel` do not pollute the visual layout.
- The `type` field still exists in data for theme and logic, but the UI now prioritizes more useful information such as image, price, rating, and distance.

