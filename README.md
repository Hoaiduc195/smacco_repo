# Smacco Mono

Smacco là một nền tảng khám phá chỗ ở và địa điểm ăn uống, kết hợp bản đồ, tìm kiếm hybrid, AI assistant theo workflow, cộng đồng hỏi đáp theo từng địa điểm, review, lưu địa điểm yêu thích, và trạng thái onsite/check-in theo vị trí thực tế.

Repository này là một monorepo nhỏ gồm:
- `frontend/`: React + Vite SPA
- `backend/`: NestJS modular monolith
- `backend/prisma/`: Prisma schema và migrations cho PostgreSQL + pgvector

README này được viết lại theo codebase hiện tại, không theo mô tả lịch sử cũ.

## Table Of Contents

- [What This Project Does](#what-this-project-does)
- [Architecture Diagram](#architecture-diagram)
- [Architecture At A Glance](#architecture-at-a-glance)
- [Core Product Flows](#core-product-flows)
- [Tech Stack](#tech-stack)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running With Docker](#running-with-docker)
- [Running Locally](#running-locally)
- [Frontend Development Notes](#frontend-development-notes)
- [Backend Development Notes](#backend-development-notes)
- [Database Model Overview](#database-model-overview)
- [API Overview](#api-overview)
- [AI Orchestration Overview](#ai-orchestration-overview)
- [Search And Place Ingestion](#search-and-place-ingestion)
- [Testing And Verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Current State And Known Gaps](#current-state-and-known-gaps)

## What This Project Does

Smacco không chỉ là một app tìm khách sạn. Hệ thống hiện tại phục vụ nhiều use case gắn với từng địa điểm cụ thể:

- Tìm chỗ ở bằng truy vấn tự nhiên hoặc bộ lọc cơ bản
- Hiển thị kết quả trên bản đồ và panel danh sách
- Xem chi tiết địa điểm, ảnh, review, tiện ích và chỉ đường
- Đồng bộ địa điểm từ provider bên ngoài vào database nội bộ khi user bắt đầu tương tác
- Check-in onsite bằng vị trí thật để xác nhận người dùng đang có mặt tại địa điểm
- Đặt câu hỏi theo từng địa điểm, nhận câu trả lời AI được ghim lên đầu thread, và nhận thêm phản hồi từ cộng đồng
- Viết và xóa review của chính mình
- Lưu địa điểm yêu thích và quản lý chúng từ profile hoặc workspace
- Chat với AI assistant để:
  - tìm chỗ ở
  - so sánh nhiều địa điểm đã tag
  - tạo insight chi tiết cho một địa điểm
  - mở các panel kết quả có cấu trúc trong frontend

## Architecture Diagram

```mermaid
flowchart LR
  User[User]

  subgraph FE[Frontend: React + Vite]
    App[App Router + Pages]
    Home[HomePage + Map Workspace]
    Detail[PlaceDetailPage]
    Chat[ChatWidget + Workflow Wizard]
    Ctx[Auth / TravelData / Conversation Contexts]
  end

  subgraph Auth[Firebase]
    FirebaseClient[Firebase Client Auth]
    FirebaseAdmin[Firebase Admin Validation]
  end

  subgraph BE[Backend: NestJS Modular Monolith]
    API[/REST + SSE API/]
    Search[Search Module]
    Places[Places Module]
    Reviews[Reviews Module]
    Presence[Presence Module]
    Questions[Questions Module]
    Saved[Saved Places Module]
    AI[Ai Module]
    Reco[Recommendations Module]
    Upload[Upload + Contributions]
  end

  subgraph Orchestration[AI Orchestration]
    Router[Task Router]
    Engine[Workflow Engine]
    Tools[Deterministic Tools]
    Composer[Response Composer]
  end

  subgraph Data[PostgreSQL + pgvector]
    Prisma[Prisma ORM]
    DB[(places, place_sources, users, reviews, questions, answers, presences, saved_places, conversations, chunks)]
  end

  subgraph External[External Services]
    SerpAPI[SerpAPI]
    Goong[Goong Geocoding]
    OSM[OSM Nominatim / Overpass]
    LLM[Groq / Cloudflare AI / OpenAI-compatible / Gemini]
    R2[Cloudflare R2]
  end

  User --> FE
  App --> Home
  App --> Detail
  App --> Chat
  Ctx --> FirebaseClient
  FE -->|Firebase ID token| FirebaseClient
  FE -->|HTTP / SSE| API

  API --> Search
  API --> Places
  API --> Reviews
  API --> Presence
  API --> Questions
  API --> Saved
  API --> AI
  API --> Reco
  API --> Upload

  API --> FirebaseAdmin

  Search --> SerpAPI
  Search --> Goong
  Places --> OSM
  Upload --> R2

  AI --> Router
  Router --> Engine
  Engine --> Tools
  Tools --> Search
  Tools --> Places
  Tools --> Reco
  Engine --> Composer
  Composer --> LLM

  Search --> Prisma
  Places --> Prisma
  Reviews --> Prisma
  Presence --> Prisma
  Questions --> Prisma
  Saved --> Prisma
  AI --> Prisma
  Reco --> Prisma
  Upload --> Prisma
  Prisma --> DB
```

Sơ đồ này mô tả đúng hệ thống hiện tại:
- frontend là SPA chứa map workspace, place detail và AI chat workflow
- backend là NestJS monolith chia module theo domain
- AI đi qua router, workflow engine, deterministic tools và response composer
- PostgreSQL là nơi lưu dữ liệu nghiệp vụ nội bộ, còn discovery/search được tăng cường bởi external providers

## Architecture At A Glance

```text
Browser
  -> React + Vite frontend (port 3000)
  -> Firebase Auth client
  -> Leaflet map UI
  -> AI workspace / search / detail flows

Frontend
  -> REST / SSE

NestJS backend (port 3001)
  -> /api/v1/*
  -> feature modules: ai, search, places, reviews, users, presence,
     questions, saved-places, recommendations, rag, contributions, upload, health
  -> Firebase Admin token validation
  -> Prisma ORM

PostgreSQL 16 + pgvector
  -> users, places, place_sources, reviews, questions, answers,
     conversations, messages, presences, saved_places, files, chunks

External services
  -> SerpAPI for accommodation discovery
  -> Goong for geocoding / anchor lookup
  -> OpenStreetMap Nominatim / Overpass for some map enrichment
  -> Groq / configurable LLM providers for AI workflows
  -> Cloudflare R2 for uploads
```

## Core Product Flows

### 1. Hybrid search

Search không phụ thuộc hoàn toàn vào local database.

- Hệ thống có thể tìm từ local DB, local fixtures, hoặc provider bên ngoài tùy runtime config.
- External results không nhất thiết được lưu ngay vào database.
- Khi user click vào một kết quả, đặt câu hỏi, review, save, hoặc check-in, backend/frontend sẽ đồng bộ địa điểm đó thành một `Place` nội bộ.

Điều này giúp:
- không phải sync toàn bộ thế giới vào DB
- chỉ lưu những địa điểm mà user thực sự quan tâm
- vẫn giữ được user-generated data gắn chặt với internal IDs

### 2. Place detail as the main engagement surface

`/places/:id` là màn hình giàu logic nhất hiện tại.

Tại đây user có thể:
- xem thông tin địa điểm
- xem review và ảnh
- viết review mới
- xóa review của chính mình
- save/unsave địa điểm
- check-in / check-out onsite
- xem và tham gia thread hỏi đáp
- nhận AI-pinned answer cho mỗi câu hỏi
- lấy chỉ đường quay lại màn hình bản đồ

### 3. Onsite presence

Presence là một khái niệm riêng trong sản phẩm:

- user check-in vào một place bằng `placeId + coordinates`
- backend xác minh khoảng cách với vị trí của place
- trong dev mode, một số validation tọa độ được nới lỏng để test local dễ hơn
- trạng thái onsite hiện tại được dùng để:
  - hiển thị user đang ở đâu trong profile
  - gắn badge onsite trong Q&A threads

### 4. AI assistant with workflows, not just free-form chat

AI của project này hoạt động theo kiến trúc workflow:

- Router dùng LLM để xác định ý định user
- Workflow engine chạy deterministic tools
- Tool layer gọi search, geocode, metadata, proximity, insight builders
- Composer tạo câu trả lời cuối cùng cho UI

Frontend còn có wizard/confirmation flow trước khi thực thi một số workflow quan trọng.

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 | SPA |
| Frontend build | Vite 7 | `npm run dev`, `npm run build` |
| Styling | Tailwind CSS 3 | utility-first styling |
| Routing | react-router-dom 6 | protected app routes |
| Maps | Leaflet, react-leaflet | map rendering |
| Icons | lucide-react | UI icons |
| Auth client | Firebase JS SDK | login and token retrieval |
| Backend | NestJS 10 | modular monolith |
| ORM | Prisma 7.6 | PostgreSQL access |
| Database | PostgreSQL 16 | local dev often via Docker |
| Vector storage | pgvector | for RAG chunks |
| AI providers | Groq, Cloudflare AI, OpenAI-compatible, Gemini | selected via runtime config |
| Search | SerpAPI | accommodation discovery |
| Geocoding | Goong | anchor/location lookup |
| Upload storage | Cloudflare R2 | image/file upload flows |

## Repository Layout

```text
mono/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
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
│   │   │   ├── upload/
│   │   │   └── users/
│   │   └── prisma/
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
├── docs/
├── .ppms/
├── docker-compose.yml
└── docker-compose.override.yml
```

## Getting Started

### Prerequisites

Trên một máy mới, bạn nên có sẵn:

- Node.js 20+
- npm 10+
- Docker Desktop hoặc một PostgreSQL instance cục bộ
- Firebase project credentials cho auth
- API keys phù hợp nếu muốn test search/AI thật

### Install dependencies

Chạy riêng cho từng app:

```bash
cd frontend
npm install
```

```bash
cd backend
npm install
```

## Environment Variables

Project này không có một tài liệu `.env` hoàn chỉnh trong root, nên phần dưới đây là checklist thực tế từ codebase. Bạn sẽ cần kiểm tra thêm các file trong `backend/src/config/` và `frontend/src/services/firebase.js` nếu đang cấu hình từ đầu.

### Backend

Backend đọc biến môi trường qua Nest `ConfigModule` và runtime config services.

Nhóm biến quan trọng:

| Variable | Purpose |
|---|---|
| `PORT` | cổng backend, mặc định `3001` |
| `DATABASE_URL` | kết nối PostgreSQL cho Prisma |
| `NODE_ENV` | môi trường runtime |
| `SERPAPI_API_KEY` | search provider chính cho accommodation |
| `FIREBASE_PROJECT_ID` | Firebase Admin validation |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin service account private key |
| `GOONG_API_KEY` hoặc biến tương đương | geocoding / anchor lookup |
| biến cho Groq / Cloudflare AI / OpenAI-compatible / Gemini | provider AI tương ứng |
| biến cho Cloudflare R2 | upload ảnh/file |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | base URL cho frontend gọi backend |
| Firebase web config variables | đăng nhập và lấy ID token |

### Example shape

Đây không phải file mẫu canonical, nhưng là khung tham khảo hợp lý:

```env
# backend
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/smacco_db?schema=public
NODE_ENV=development
SERPAPI_API_KEY=your_serpapi_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

```env
# frontend
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

## Running With Docker

`docker-compose.yml` hiện định nghĩa 3 service:

- `frontend` trên `3000`
- `backend` trên `3001`
- `postgres` trên host port `5433`

Chạy toàn bộ stack:

```bash
docker compose up --build
```

Development override hiện tại cho backend sẽ:
- mount source code vào container
- thử `prisma migrate deploy`, nếu fail thì `prisma db push`
- sau đó chạy `npm run start:dev`

## Running Locally

### 1. Start PostgreSQL

Nếu dùng Docker chỉ cho DB:

```bash
docker compose up postgres -d
```

### 2. Run Prisma migrations

Trong backend:

```bash
cd backend
npx prisma migrate deploy
```

Nếu đang ở môi trường dev và migrations chưa đồng bộ:

```bash
npx prisma db push
```

### 3. Start backend

```bash
cd backend
npm run start:dev
```

Backend sẽ chạy ở:

```text
http://localhost:3001
http://localhost:3001/api/docs
```

### 4. Start frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy ở:

```text
http://localhost:3000
```

## Frontend Development Notes

### Main app structure

Các route chính nằm trong `frontend/src/App.jsx`:

- `/` -> landing page
- `/login` -> login page
- `/app` -> main authenticated workspace
- `/places/:id` -> place detail
- `/profile` -> user profile

### Important contexts

| Context | Responsibility |
|---|---|
| `AuthContext` | Firebase auth state và login/logout APIs |
| `TravelDataContext` | dữ liệu owned/check-in kiểu legacy + upsert user profile |
| `ConversationContext` | lịch sử hội thoại, selected conversation, tagged places |

### Frontend files worth knowing first

| File | Why it matters |
|---|---|
| `src/pages/HomePage.jsx` | trung tâm của map/search/workspace logic |
| `src/pages/PlaceDetailPage.jsx` | màn hình chi tiết nhiều side effects nhất |
| `src/components/ChatWidget.jsx` | AI workspace entrypoint |
| `src/components/QASection.jsx` | place Q&A thread UI |
| `src/services/api.js` | axios client + auth interceptor + 401 redirect |
| `src/services/placeService.js` | search, place details, reviews, media, map enrichment |
| `src/services/aiService.js` | non-streaming + SSE chat integration |

### Important UI behavior

- Search state trên `HomePage` được rehydrate từ `sessionStorage`
- Chat widget phát nhiều custom events kiểu `app:*` để mở panel hoặc đẩy search results
- Place detail có logic sync external place IDs sang internal DB UUIDs
- Frontend tự đính kèm Firebase ID token cho các request có auth
- Response interceptor sẽ redirect về `/login` khi gặp `401` ở private routes

## Backend Development Notes

### App entrypoints

- `backend/src/main.ts`
- `backend/src/app.module.ts`

### Registered feature modules

| Module | Responsibility |
|---|---|
| `users` | mapping Firebase users sang local DB user |
| `places` | CRUD, lookup, external place resolution, place ingestion |
| `reviews` | review creation/list/delete |
| `search` | search orchestration và provider integration |
| `ai` | router, workflow engine, LLM composition, conversations |
| `recommendations` | ranking và scoring |
| `rag` | chunk storage và retrieval-related capabilities |
| `presence` | onsite check-in / check-out |
| `questions` | place Q&A threads + AI pinned answers |
| `saved-places` | bookmark/save place flows |
| `contributions` | file contribution metadata |
| `upload` | file/image upload to R2 |
| `health` | health endpoints |

### Runtime behavior

- Global API prefix: `/api/v1`
- Swagger docs: `/api/docs`
- Validation pipe bật global với `whitelist`, `forbidNonWhitelisted`, `transform`
- CORS đang bật toàn cục

### Authentication model

- frontend dùng Firebase client auth
- backend validate Firebase ID token qua `FirebaseAuthGuard`
- backend thường upsert local `User` record trước khi thao tác domain data

## Database Model Overview

Schema nguồn chuẩn nằm tại:

```text
backend/prisma/schema.prisma
```

### Main models

| Model | Purpose |
|---|---|
| `User` | user nội bộ, map với Firebase UID |
| `Place` | canonical place nội bộ |
| `PlaceSource` | mapping external provider IDs -> internal place |
| `Review` | user reviews |
| `Question` | place-level questions |
| `Answer` | answers cho questions, gồm cả AI answers |
| `AnswerVote` | vote trên answer |
| `Presence` | active/historical onsite presence |
| `SavedPlace` | user bookmarks |
| `Conversation` | AI conversation container |
| `Message` | messages trong conversation |
| `PlaceComparisonResult` | comparison payload được persist |
| `File` | uploaded/contributed file metadata |
| `Chunk` | RAG chunk + vector embedding |

### Why `PlaceSource` matters

Đây là model rất quan trọng của project.

External IDs thường có dạng:

```text
serpapi-<provider_specific_id>
local-<fixture_id>
```

`PlaceSource` cho phép backend:
- resolve external IDs sang internal UUID
- tránh duplicate place imports
- giữ user-generated data gắn với một canonical place record

## API Overview

Đây là các route quan trọng nhất cần biết khi làm việc trên hệ thống. Danh sách không nhất thiết exhaustive tuyệt đối, nhưng phản ánh core surface hiện tại.

### Search and places

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/search` | search places | optional |
| `GET` | `/api/v1/places/:id` | get place detail | no |
| `POST` | `/api/v1/places` | create/sync place into DB | usually yes in app flow |
| `GET` | `/api/v1/places/:id/reviews` | get place reviews | no |
| `GET` | `/api/v1/places/:id/media` | get reviews + photos payload | no |

### Reviews

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/reviews` | create review | yes |
| `DELETE` | `/api/v1/reviews/:id` | delete own review | yes |

### Questions and answers

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/questions/place/:placeId` | list place threads | public API |
| `POST` | `/api/v1/questions` | create question | yes |
| `POST` | `/api/v1/questions/:questionId/answers` | create answer | yes |
| `DELETE` | `/api/v1/questions/:id` | delete own question | yes |

### Presence

| Method | Path | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/presence/me` | current onsite status | yes |
| `POST` | `/api/v1/presence/check-in` | check in at place | yes |
| `DELETE` | `/api/v1/presence/me` | leave current place | yes |
| `GET` | `/api/v1/presence/:placeId` | list active users at place | yes |

### Saved places

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/saved-places/:placeId` | save place | yes |
| `DELETE` | `/api/v1/saved-places/:placeId` | unsave place | yes |
| `GET` | `/api/v1/saved-places/check/:placeId` | saved status | yes |
| `GET` | `/api/v1/saved-places` | list saved places | yes |

### AI

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/ai/chat` | non-streaming AI chat | yes |
| `POST` | `/api/v1/ai/chat/stream` | SSE AI chat | yes |
| `GET` | `/api/v1/ai/conversations` | list recent conversations | yes |
| `POST` | `/api/v1/ai/conversations` | create conversation | yes |
| `GET` | `/api/v1/ai/conversations/:id/messages` | list messages | yes |
| `DELETE` | `/api/v1/ai/conversations/:id` | delete conversation | yes |
| `GET` | `/api/v1/ai/comparisons/:id` | load stored comparison result | yes |

### Support endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/health` | health check |
| `POST` | `/api/v1/upload/avatar` | upload avatar |
| `POST` | `/api/v1/upload/place` | upload place image |
| `POST` | `/api/v1/upload/post` | upload post image |
| `POST` | `/api/v1/contributions/files` | create contribution file record |

## AI Orchestration Overview

### High-level flow

AI module hiện không phải một chatbot đơn khối. Nó được tổ chức theo 4 lớp:

1. Task router
2. Workflow engine
3. Deterministic tools
4. Response composer

### Implemented workflows

Hiện tại `workflow-registry.ts` định nghĩa ít nhất các workflow sau:

- `SEARCH_PLACES`
- `GENERAL_CHAT`
- `COMPARE_PLACES`
- `ANALYZE_PLACE`

### Why this matters in practice

Khi sửa phần AI, thường bạn không chỉ sửa một file text prompt. Bạn có thể phải kiểm tra đồng thời:

- `backend/src/modules/ai/orchestration/router/llm-task-router.service.ts`
- `backend/src/modules/ai/orchestration/engine/workflow-registry.ts`
- `backend/src/modules/ai/orchestration/ai-orchestrator.service.ts`
- `backend/src/common/tools/*`
- frontend chat widget và panel events

### Streaming behavior

Chat streaming dùng SSE:

- backend trả về `text/event-stream`
- frontend parse các `data:` events
- một chunk có thể chứa:
  - text delta
  - workflow metadata
  - searchAction payload
  - comparison/insight metadata

## Search And Place Ingestion

### The key idea

Search discovery và data ownership là hai giai đoạn khác nhau.

- Discovery: lấy breadth từ provider bên ngoài
- Ingestion: chỉ nhập vào DB khi user tương tác thật

### Benefits

- DB gọn hơn
- không cần đồng bộ toàn bộ dữ liệu thế giới
- toàn bộ review/Q&A/presence/saved state vẫn nằm trong mô hình dữ liệu nội bộ có quan hệ rõ ràng

### Important implementation detail

Khi làm việc với `placeId`, luôn xác minh xem nó là:

- internal UUID
- hay external composite ID như `serpapi-xxx`

Nhiều service đã có logic resolve tự động, nhưng đây vẫn là nguồn gây bug phổ biến nếu bỏ qua.

## Testing And Verification

### Frontend

```bash
cd frontend
npm run test
```

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
npm run test
```

```bash
cd backend
npm run build
```

### Additional backend checks

```bash
cd backend
npm run test:cloudflare
```

```bash
cd backend
npm run test:openai-compatible
```

### Useful manual checks

Sau khi sửa các luồng chính, nên test tay ít nhất:

1. login/logout flow
2. search -> open place detail
3. external place sync vào DB
4. save/unsave place
5. review create/delete
6. question create/answer/delete
7. onsite check-in/check-out
8. AI search workflow
9. AI compare workflow nếu có tagged places

## Troubleshooting

### Backend starts but authenticated routes return 401

Kiểm tra:
- frontend có lấy được Firebase ID token không
- backend có đủ Firebase Admin env vars không
- `FirebaseAuthGuard` có đang đọc đúng project config không

### Search works poorly or returns empty results

Kiểm tra:
- `SERPAPI_API_KEY`
- runtime config có đang bật external providers không
- project có đang ở fixture-only mode không

### External place detail causes ID or UUID errors

Đây thường là dấu hiệu của việc quên resolve external composite ID sang internal UUID. Kiểm tra các flow trong:

- `PlacesService.findOne`
- `PlacesService.create`
- `PresenceService`
- `QuestionsService`

### Onsite check-in fails in local development

Kiểm tra:
- place có tọa độ không
- browser có cho geolocation không
- request có gửi đúng `latitude` và `longitude` không
- `NODE_ENV=development` có thực sự được set không nếu bạn kỳ vọng bypass validation

### Frontend randomly sends user to `/login`

`frontend/src/services/api.js` có response interceptor redirect tất cả `401` ở private routes. Nếu một request mount-time bị bảo vệ sai chỗ, frontend có thể bị đá về `/login`.

### Overpass or Nominatim parsing errors

Project đã có hardening cho việc parse non-JSON responses, nhưng các external services này vẫn có thể rate-limit hoặc timeout. Nếu thấy lỗi lặp lại, hãy kiểm tra network response thật thay vì chỉ xem stack trace.

## Current State And Known Gaps

Đây là những điểm nên biết trước khi tiếp tục phát triển:

- `README` cũ từng mô tả kiến trúc đơn giản hơn thực tế; bản này đã cập nhật gần hơn với code hiện tại.
- Một số docs trong `docs/` vẫn phản ánh provider/search behavior cũ hơn code.
- `HomePage.jsx` và `PlaceDetailPage.jsx` khá lớn, chứa nhiều state và side effects.
- `TravelDataContext` vẫn còn dấu vết flow kiểu Firestore legacy song song với backend Postgres-first.
- API read cho Q&A là public, nhưng UI `QASection` hiện vẫn ẩn hoàn toàn nếu chưa đăng nhập.
- Search hiện còn nhiều heuristic và runtime toggles; khi debug hãy xem cả runtime config lẫn module search.

Nếu bạn định tiếp tục phát triển project này, nơi nên đọc đầu tiên là:

1. `frontend/src/pages/HomePage.jsx`
2. `frontend/src/pages/PlaceDetailPage.jsx`
3. `frontend/src/components/ChatWidget.jsx`
4. `backend/src/modules/search/search.service.ts`
5. `backend/src/modules/places/places.service.ts`
6. `backend/src/modules/ai/orchestration/*`
7. `backend/prisma/schema.prisma`
