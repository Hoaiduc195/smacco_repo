# Project Architecture: Smacco — Smart Travel & Accommodation Platform

> Last updated: 2026-05-27 20:13
> Branch: feat/UI

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
- **AI Orchestration**: `ai/orchestration` contains router, workflow engine, response composer, and shared tools under `src/common/tools/`.
- **Database & Persistence**: Prisma client is provided via `prisma/prisma.module.ts` and `prisma/prisma.service.ts`. Schema is located at `backend/prisma/schema.prisma`.

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
