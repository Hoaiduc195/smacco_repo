# ARCHITECTURE — Kiến trúc tổng quan

Tài liệu này chứa sơ đồ Mermaid tóm tắt các thành phần chính và luồng dữ liệu trong hệ thống.

## Sơ đồ kiến trúc (Mermaid)

```mermaid
flowchart TB
  %% Clients & UI
  subgraph Client
    FE["Frontend\nReact + Vite\n(Map, Chat, Auth)"]
  end

  %% Gateway
  subgraph Gateway["API Gateway\nNginx"]
    GW(Nginx)
  end

  %% Backend services
  subgraph Backend
    Core["Core Service\nNestJS\n(users, places, reviews, search)"]
    AI["AI Service\nFastAPI\n(chat, parse, conv-store)"]
    Recc["Recommendation Service\nFastAPI\n(retrieval, scoring)"]
  end

  %% Datastores and infra
  Postgres["PostgreSQL + pgvector"]
  Redis["Redis / Cache (optional)"]
  ObjectStorage["Object Storage / S3"]
  Firebase["Firebase Auth & Firestore"]
  Groq["Groq LLM"]
  Google["Google Places API (optional)"]
  Nominatim["Nominatim / OSM"]
  OSRM["OSRM Router"]

  %% Client -> Gateway -> Backend
  FE -->|HTTP / SSE| GW
  GW -->|/api/v1/*| Core
  GW -->|/api/v1/ai/*| AI
  GW -->|/api/v1/recommendations| Recc

  %% Backend interactions
  Core -->|read/write| Postgres
  Recc -->|read| Postgres
  AI -->|call| Recc
  Core -->|proxy / call| AI

  %% External integrations
  FE -->|Auth / Firestore| Firebase
  AI -->|LLM requests / stream| Groq
  Recc -->|Places lookup| Google
  FE -->|routing| OSRM
  FE -->|fallback search| Nominatim

  %% Storage
  Postgres -->|store files metadata| ObjectStorage
  Core -->|store/retrieve images| ObjectStorage
  Recc -->|attach image_url| ObjectStorage

  %% Optional cache
  Redis -.-> Core
  Redis -.-> AI
  Redis -.-> Recc

  classDef infra fill:#f8f9fa,stroke:#333,stroke-width:1px;
  class Gateway,Postgres,Redis,ObjectStorage,Google,Groq,Nominatim,OSRM infra;
```

## Chú giải ngắn

- Frontend: SPA (React/Vite) chịu trách nhiệm UI, map, chat widget và tương tác trực tiếp với Firebase cho auth/trip data.
- Gateway: Nginx làm reverse-proxy, phân tuyến tới các service backend.
- Core Service: NestJS cung cấp API cho users, places, reviews, search; lưu trữ chính trên Postgres (Prisma).
- AI Service: FastAPI xử lý chat (one-shot + SSE), parse text → filters, giữ conversation ngắn hạn (in-memory hoặc Redis).
- Recommendation Service: FastAPI thực hiện retrieval + scoring (Google Places hoặc DB fallback) rồi trả về results có `score` và `image_url`.
- Postgres: chứa bảng places, reviews, chunks (embedding), conversations, messages; pgvector cho embedding.
- Object Storage: lưu ảnh, file upload; services trả về `image_url`.
- External: Groq (LLM), Google Places (optional), Nominatim/OSM, OSRM.

---

Nếu muốn mình chỉnh layout sơ đồ (ngang/dọc), thêm annotations (module internals), hoặc xuất thành PNG/SVG, báo mình chọn dạng bạn muốn.