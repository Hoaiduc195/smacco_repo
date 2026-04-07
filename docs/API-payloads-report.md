# API Payloads & Responses

Generated: 2026-04-07

Mục tiêu: tóm tắt input / output (JSON + headers) cho 4 Use Case chính trong dự án: Search, Recommendation, Chatbot (LLM → Recommendation), AI enrichment (vector DB).

---

## Use Case 1 — Search (frontend → Search Service, fallback external)

- Endpoint: `GET /api/v1/places/search`
- Headers: `Authorization: Bearer <idToken>` (nếu user đã login)
- Query params: `q`, `lat`, `lng`, `limit`

Example request (HTTP):

```
GET /api/v1/places/search?q=cafe&lat=10.770&lng=106.690&limit=20
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

## Use Case 2 — Recommendation (frontend → Recommendation System)

- Endpoint: `POST /api/v1/recommendations/recommend`
- Headers: `Authorization: Bearer <idToken>` (nếu cần)
- Body (JSON):

```json
{
  "location": "10.770,106.690",   // hoặc tên địa điểm/địa danh
  "type": "hotel",                // optional
  "budget": "midrange",           // optional: budget|midrange|premium
  "radius": 5                       // optional (km)
  // có thể config thêm các preferences khác
}
```

- Response (JSON):

```json
{
  "results": [
    {
      "location_id": "loc-1",
      "name": "Hotel X",
      "address": "...",
      "rating": 4.2,
      "imageUrl": "https://.../hotel-x.jpg",
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

## Use Case 3 — Chatbot LLM parses → calls Recommendation System (AI-driven automation)

Flow A — user → AI chat endpoint (one-shot / streaming)

- Endpoint: `POST /api/v1/ai/chat` (one-shot) hoặc `POST /api/v1/ai/chat/stream` (SSE)
- Request body:

```json
{ "text": "Tìm chỗ ở rẻ gần sân bay", "conversation_id": "opt-abc" }
```

- One-shot response (`ChatResponse`):

```json
{
  "answer": "Mấy lựa chọn phù hợp: ...",
  "conversation_id": "abc-123",
  "finish_reason": "stop",
  "usage_prompt_tokens": 120,
  "usage_completion_tokens": 45,
  "messages": [
    {"role":"system","content":"..."},
    {"role":"user","content":"..."},
    {"role":"assistant","content":"..."}
  ]
}
```

- Streaming (SSE) example (each event `data:` is JSON):

```
data: {"conversation_id":"abc-123","delta":"Xin chào "}

data: {"conversation_id":"abc-123","delta":"bạn cần gì hôm nay?"}

data: {"conversation_id":"abc-123","delta":"","finish_reason":"stop"}
```

Flow B — LLM detects recommendation intent and AI Service calls Recommendation System internally:

- Internal request from AI Service → Recommendation Service: same shape as Use Case 2.

Example parse-style structured response (from `/parse` endpoint or internal result):

```json
{
  "query": "Tìm quán ăn giá rẻ ở Đà Nẵng",
  "extracted_filters": {"location":"Đà Nẵng","type":"food","budget":"cheap"},
  "recommendations": [ { "location_id":"...","name":"...","score":0.9 } ]
}
```

Frontend automation:
- Frontend có thể gọi `/api/v1/parse` hoặc gọi AI chat, nhận `extracted_filters`, tự động gọi `/recommendations/recommend` và render kết quả.

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
  "conversation_id": "abc-123",
  "finish_reason": "stop",
  "messages": [{"role":"assistant","content":"..."}],
  "sources": [
    {"id":"doc-1","title":"Review by userX","excerpt":"Những điều tốt...","score":0.92,"url":"/uploads/doc-1"}
  ]
}
```

Notes:
- Current schema does not include `sources` by default; nếu cần traceability có thể mở rộng `ChatResponse` để thêm `sources` / `references`.
- Streaming chunks still use `delta` and final `finish_reason` frame.

---

## Common: Auth, Errors, Headers

- Auth: frontend đính token Firebase vào header `Authorization: Bearer <idToken>` trong `apiClient`.
- Error shape (FastAPI): HTTP status + body `{ "detail": "message" }`.
- Streaming error frame (SSE): `data: {"conversation_id":"...","finish_reason":"error","error":"..."}` so client can display error and close stream.

---

## References (code locations in repo)
- Frontend API client: `services/frontend/src/services/api.js`
- Frontend AI client: `services/frontend/src/services/aiService.js`
- Frontend place service (normalization): `services/frontend/src/services/placeService.js`
- Recommendation backend schema: `services/recommendation-service/app/schemas/recommendation.py`
- AI chat backend: `services/ai-service/app/api/v1/endpoints/chat.py` and `services/ai-service/app/schemas/chat.py`
- Parse backend: `services/ai-service/app/api/v1/endpoints/parse.py`

---

If you want JSON Schema / OpenAPI fragments for these endpoints, tell me and I will add them to this report.