# Project Architecture: Smacco — Smart Travel & Accommodation Platform

> Last updated: 2026-06-02 11:45
> Branch: feat/cloudflare_int

## Overview
A modular monolith web application for discovering accommodations, dining spots, and smart itinerary planning under the brand name **Smacco**. Features AI-powered chat, multi-provider search, interactive maps, Firebase authentication, saved places, check-ins, Q&A, and user-contributed content management. Built with a React (Vite) frontend and a NestJS backend backed by PostgreSQL with pgvector.

## Tech Stack

| Component   | Technology                          | Version   |
|-------------|-------------------------------------|-----------|
| Frontend    | React (Vite + Tailwind CSS)         | 18.2      |
| Backend     | NestJS (TypeScript)                 | 10.x      |
| Database    | PostgreSQL + pgvector               | 16        |
| ORM         | Prisma                              | 7.6.0     |
| AI/LLM      | OpenRouter / Groq / Cloudflare AI   | —         |
| Storage     | Cloudflare R2 (S3 API Client)       | @aws-sdk/client-s3 |
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
  - `LandingPage` — Public SaaS-style overview page focused on AI-assisted accommodation discovery.
  - `HomePage` — Protected map-based discovery app at `/app`.
  - `PlaceDetailPage` — Protected place info, reviews, Q&A, and place-specific chat.
  - `LoginPage` — Legacy Firebase login route at `/login`.
  - `ProfilePage` — Protected user profile and owned places.

### Backend
- **Framework**: NestJS with module-based organization.
- **Module structure**: `ai`, `search`, `places`, `recommendations`, `reviews`, `users`, `presence`, `rag`, `contributions`, `health`, `saved-places`, `questions`, `upload`.
- **Upload Module (New)**: Coordinates file uploads to S3-compatible **Cloudflare R2** buckets, exposing secure and optimized REST endpoints for user avatars, place photographs, and post assets.
- **AI Orchestration**: `ai/orchestration` contains router, workflow engine, response composer, and shared tools. Integrates both `GroqClientService` and `CloudflareAiClientService` (OpenAI-compatible) under a unified router switcher controlled via `AI_PROVIDER` environment variable or the dynamic `features.json` configuration file.

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
| POST   | `/upload/avatar`              | Upload user profile picture to Cloudflare R2 | Yes  |
| POST   | `/upload/place`               | Upload place cover/details to Cloudflare R2  | Yes  |
| POST   | `/upload/post`                | Upload post/contribution picture to R2     | Yes  |
| POST   | `/api/v1/contributions/files` | Record contributed file                    | Yes  |
| GET    | `/api/v1/contributions/files` | List contributed files                     | Yes  |
| GET    | `/places/test-data/images/:filename` | Get local test data image                 | No   |
| GET    | `/api/docs`                   | Swagger UI                                 | No   |

## Database Schema
PostgreSQL stores users, places, reviews, questions, answers, answer votes, files, chunks, conversations, messages, conversation-place references, presences, saved places, and related travel data. Vector search uses pgvector embeddings for RAG chunks.

## Completed Features
- [x] Configured Cloudflare R2 storage for robust, S3-compatible image uploads.
- [x] Implemented Cloudflare Workers AI LLM client supporting both normal and streaming chat responses.
- [x] Unified warm neutral / primary green / accent orange UI theme across map workspace controls, panels, result cards, and chat widget.
- [x] Firebase authentication for login/signup/profile flows.
- [x] Mapbox GL map renderer with clustered markers, user location layer, and Mapbox-token fallback behavior.
- [x] Saved places and check-in flows.

## Directory Structure

```
mono/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── common/
│   │   ├── config/
│   │   │   ├── r2.config.ts (New)
│   │   │   ├── cloudflare-ai.config.ts (New)
│   │   │   └── ...
│   │   ├── modules/
│   │   │   ├── ai/
│   │   │   │   ├── cloudflare-ai-client.service.ts (New)
│   │   │   │   └── ...
│   │   │   ├── upload/ (New Module)
│   │   │   │   ├── upload.module.ts
│   │   │   │   ├── upload.service.ts
│   │   │   │   └── upload.controller.ts
│   │   │   └── ...
│   │   └── prisma/
│   └── test/ (New Reorganization)
│       ├── fixtures/ (data.json & images/)
│       └── test-cloudflare.ts
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── test/ (New Reorganization)
│       └── connection-check.js
└── .ppms/
```
