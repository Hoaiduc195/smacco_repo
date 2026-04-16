# API Payloads & Responses

Generated: 2026-04-14

Mục tiêu: tóm tắt input / output (JSON + headers) cho 4 Use Case chính trong dự án: Search, Recommendation, Chatbot (LLM → Recommendation), AI enrichment (vector DB).

---

## Use Case 1 — Basic Search (frontend → Search Service, fallback external)

- Endpoint: `GET /api/v1/search`
- Headers: `Authorization: Bearer <idToken>` (nếu user đã login)
- Query params: `q`, `type`, `location`, `budget`, `lat`, `lng`, `limit`

Example request (HTTP):

```
GET /api/v1/search?q=cafe&location=Hanoi&limit=20
Authorization: Bearer <idToken>
```

Example response (array or `{ "results": [...] }`):
```json
[
  {
    "id": "123",
    "location_id": "loc-123",
    "name": "Quán cà phê ABC",
    "address": "123 Đường X",
    "lat": 10.77,
    "lng": 106.69,
    "type": "cafe",
    "rating": 4.5,
    "imageUrl": "https://.../img.jpg",
    "priceLevel": 2,
    "source": "backend"
  }
]
```

Notes:
- Nếu Search Service trả lỗi, frontend có fallback gọi Nominatim / external APIs.
- Frontend chuẩn hoá shape trong `placeService.searchPlaces` trước khi render.

---

- ## Use Case 2 — Recommendation (frontend → Recommendation System)

- Endpoint: `POST /api/v1/recommendations`
- Headers: `Authorization: Bearer <idToken>` (nếu cần)
- Body (JSON):

```json
{
  "location": "10.770,106.690",
  "type": "hotel",
  "budget": "midrange"
}
```

- Response (JSON):

```json
{
  "results": [
    {
      "locationId": "loc-1",
      "name": "Hotel X",
      "address": "...",
      "rating": 4.2,
      "score": 0.87,
      "type": "hotel",
      "lat": 10.77,
      "lng": 106.69
    }
  ]
}
```

Notes:
- Recommendation System trả về danh sách đã rank. Schema backend: `RecommendRequest` / `RecommendResponse`.
- Frontend `RecommendationPage` gọi `getRecommendations` và hiển thị/so sánh travel times.
- Recommendation items may include an image: backend returns `image_url` (snake_case) and frontend normalizes to `imageUrl` (camelCase) when rendering.

---

- ## Use Case 3 — AI Chat / Conversational Search (LLM)

Flow A — user → AI chat endpoint (one-shot / streaming)

- Endpoint: `POST /api/v1/ai/chat` (one-shot) hoặc `POST /api/v1/ai/chat/stream` (SSE)
- Request body:

```json
{ "text": "Tìm chỗ ở rẻ gần sân bay", "conversationId": "opt-abc" }
```

- One-shot response (`ChatResponse`):

```json
{
  "answer": "Mấy lựa chọn phù hợp: ...",
  "conversationId": "abc-123",
  "finishReason": "stop",
  "usagePromptTokens": 120,
  "usageCompletionTokens": 45,
  "messages": [
    {"role":"system","content":"..."},
    {"role":"user","content":"..."},
    {"role":"assistant","content":"..."}
  ]
}
```

- Streaming (SSE) example (each event `data:` is JSON):

```
data: {"conversationId":"abc-123","delta":"Xin chào "}

data: {"conversationId":"abc-123","delta":"bạn cần gì hôm nay?"}

data: {"conversationId":"abc-123","delta":"","finishReason":"stop"}
```


Flow B — LLM detects recommendation intent and AI Service calls Recommendation Service internally:

- Internal request from AI Service → Recommendation Service: same shape as Use Case 2.

Example parse-style structured response (from `/api/v1/ai/parse` endpoint or internal result):

```json
{
  "query": "Tìm quán ăn giá rẻ ở Đà Nẵng",
  "extractedFilters": {"location":"Đà Nẵng","type":"food","budget":"cheap"},
  "recommendations": [ { "locationId":"...","name":"...","score":0.9 } ]
}
```

Frontend automation:
- Frontend có thể gọi `/api/v1/ai/parse` để nhận `extractedFilters` và danh sách đề xuất.

---

## Use Case 4 — AI Service queries Vector DB to enrich answers (reviews, user uploads)

- Frontend → AI: `POST /api/v1/ai/chat` (hoặc stream) with `{"text": "Tóm tắt review cho Hotel X"}`.
- Internals: AI service sẽ
  1. map query → vector DB search (top-k) → returns documents / review snippets with scores
  2. optionally fetch full records (reviews, uploads) from DB/storage
  3. synthesize answer and may include `sources` field for traceability

Suggested enriched response (extension of `ChatResponse`):

```json
{
  "answer": "Tóm tắt: khách khen vị trí, chê dịch vụ...",
  "conversationId": "abc-123",
  "finishReason": "stop",
  "messages": [{"role":"assistant","content":"..."}],
  "sources": [
    {"id":"doc-1","title":"Review by userX","excerpt":"Những điều tốt...","score":0.92,"url":"/uploads/doc-1"}
  ]
}
```

Notes:
- Current schema does not include `sources` by default; nếu cần traceability có thể mở rộng `ChatResponse` để thêm `sources` / `references`.
- Streaming chunks still use `delta` and final `finishReason` frame.

---

## Common: Auth, Errors, Headers

- Auth: frontend đính token Firebase vào header `Authorization: Bearer <idToken>` trong `apiClient`.
- Error shape in NestJS: HTTP status + body such as `{ "statusCode": 500, "message": "...", "error": "Internal Server Error" }`.
- Streaming error frame (SSE): `data: {"conversationId":"...","finishReason":"error","error":"..."}` so client can display error and close stream.

---

## Use Case 5 — QA vs RAG for a Place, and Optional Onsite Presence/Chat

When a user inspects a specific place the app supports two flows:

- QA / RAG (server-side vector retrieval + synthesis):
  - Store chunk (app ingestion / worker): `POST /api/v1/ai/rag/chunks`
    - Body: `{ placeId, userId?, sourceType, sourceId, content, tokenCount?, metadata? }`
  - Retrieve relevant chunks for a place: `GET /api/v1/ai/rag/chunks/:placeId?query=...&limit=5`
    - Returns: `{ chunks: [...], context: "..." }` used by AI service to synthesize an answer.
  - Typical QA flow: frontend calls `POST /api/v1/ai/chat` (or stream) with `text` describing the question and `conversationId` optional; server performs vector search (RAG) via the rag service and includes context in the assistant response.

- Onsite presence and lightweight user-to-user interactions (optional):
  - Join a place (mark present): `POST /api/v1/presence/:placeId/join` (body: `{ userId }`)
  - Leave a place: `DELETE /api/v1/presence/:placeId/leave` (body: `{ userId }`)
  - Get active users at a place: `GET /api/v1/presence/:placeId`
  - Contribute files / uploads for a place: `POST /api/v1/contributions/files` (body includes `placeId`, `storageUrl`, `fileName`, ...)
  - List contributed files: `GET /api/v1/contributions/files/:placeId`

Notes:
- Use `ai/rag` endpoints to manage and retrieve textual chunks used for RAG QA.
- Presence endpoints are intended for optional realtime UX (showing who is at the place). For true realtime chat, integrate presence with a websocket/SSE layer plus `ai/chat` for LLM-mediated conversations or build a messages API if you need persistent user-to-user chat history.

## References (code locations in repo)
- Frontend API client: `frontend/src/services/api.js`
- Frontend AI client: `frontend/src/services/aiService.js`
- Frontend place service: `frontend/src/services/placeService.js`
- Frontend recommendation client: `frontend/src/services/recommendationService.js`
- Backend AI parse: `backend/src/modules/ai/ai.controller.ts`, `backend/src/modules/ai/dto/parse-request.dto.ts`, `backend/src/modules/ai/dto/parse-response.dto.ts`
- Backend chat: `backend/src/modules/chat/chat.controller.ts`, `backend/src/modules/chat/dto/chat-request.dto.ts`, `backend/src/modules/chat/dto/chat-response.dto.ts`
- Backend recommendations: `backend/src/modules/recommendations/recommendations.controller.ts`, `backend/src/modules/recommendations/recommendations.service.ts`

---

## JSON Schema / OpenAPI fragments

### `GET /api/v1/places/search`

Request query params:

```yaml
parameters:
  - name: q
    in: query
    required: false
    schema:
      type: string
  - name: lat
    in: query
    required: false
    schema:
      type: number
  - name: lng
    in: query
    required: false
    schema:
      type: number
  - name: limit
    in: query
    required: false
    schema:
      type: integer
      default: 20
```

Response body:

```yaml
type: array
items:
  type: object
  properties:
    id:
      type: string
    location_id:
      type: string
    name:
      type: string
    address:
      type: string
    lat:
      type: number
    lng:
      type: number
    type:
      type: string
    rating:
      type: number
    imageUrl:
      type: string
    priceLevel:
      type: integer
    source:
      type: string
```

### `POST /api/v1/recommendations`

Request body:

```yaml
required:
  - location
properties:
  location:
    type: string
  type:
    type: string
  budget:
    type: string
```

Response body:

```yaml
type: object
properties:
  results:
    type: array
    items:
      type: object
      properties:
        locationId:
          type: string
        name:
          type: string
        address:
          type: string
        rating:
          type: number
        score:
          type: number
        type:
          type: string
        lat:
          type: number
        lng:
          type: number
```

### `POST /api/v1/ai/parse`

Request body:

```yaml
required:
  - text
properties:
  text:
    type: string
  userId:
    type: string
```

Response body:

```yaml
type: object
properties:
  query:
    type: string
  extractedFilters:
    type: object
    properties:
      location:
        type: string
      type:
        type: string
      budget:
        type: string
  recommendations:
    type: array
    items:
      type: object
      properties:
        locationId:
          type: string
        name:
          type: string
        address:
          type: string
        rating:
          type: number
        score:
          type: number
        type:
          type: string
        lat:
          type: number
        lng:
          type: number
```

### `POST /api/v1/ai/chat`

Request body:

```yaml
required:
  - text
properties:
  text:
    type: string
  conversationId:
    type: string
  stream:
    type: boolean
```

Response body:

```yaml
type: object
properties:
  answer:
    type: string
  conversationId:
    type: string
  finishReason:
    type: string
  usagePromptTokens:
    type: integer
  usageCompletionTokens:
    type: integer
  messages:
    type: array
    items:
      type: object
      properties:
        role:
          type: string
        content:
          type: string
```

### `POST /api/v1/ai/chat/stream`

Response stream events:

```yaml
type: object
properties:
  conversationId:
    type: string
  delta:
    type: string
  finishReason:
    type: string
```

---

If you want additional OpenAPI components or full request/response examples, I can extend this further.
