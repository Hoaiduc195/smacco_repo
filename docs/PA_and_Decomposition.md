# **Báo Cáo Lần Hai** 

# **Giới thiệu**

## **Đặt vấn đề**

Khách du lịch thường gặp khó khăn khi tìm chỗ lưu trú phù hợp: thông tin phân mảnh giữa nhiều nền tảng, mô tả không đồng nhất và khó so sánh giá‑chất lượng‑vị trí.

Do đó cần một công cụ gợi ý thông minh, có khả năng hiểu ngôn ngữ tự nhiên, chuẩn hoá sở thích và trả về đề xuất phù hợp, nhanh chóng và minh bạch.


## **Mô tả bài toán**

Chương trình gợi ý địa điểm lưu trú.

Trên góc độ người dùng, có thể đánh giá yêu cầu của người dùng như sau: "Một ứng dụng cho phép tôi có thể tìm kiếm các địa điểm lưu trú phù hợp với kỳ vọng của tôi một cách dễ dàng"

# **Problem Analysis**

## **Input**

Người dùng có thể cung cấp yêu cầu tìm kiếm theo nhiều dạng, ví dụ:
- Prompt ngôn ngữ tự nhiên gửi tới AI, mô tả mong muốn (vị trí, ngân sách, tiện nghi,...).
- Payload JSON chuẩn hoá từ frontend để xử lý tự động.

Các preference tiêu biểu (ví dụ) bao gồm:
- Ngân sách / chi phí
- Loại hình lưu trú (nhà nghỉ, khách sạn, resort), có thể phân loại theo thời gian lưu trú
- Bán kính tìm kiếm (km)
- ...

## **Output**

Hệ thống trả về danh sách đề xuất sắp xếp theo độ phù hợp, mỗi mục thường gồm:
- Tên, địa chỉ, tọa độ (lat/lng)
- Ảnh minh hoạ, mô tả ngắn
- Điểm đánh giá (rating) và điểm xếp hạng (`score`)
- Thông tin giá và mức độ phù hợp với preference

Kết quả được sắp xếp theo điểm (relevance/score) và có thể kèm metadata (nguồn dữ liệu, thời điểm cập nhật).

## **Operators**

Quy trình giải quyết vấn đề sẽ được dựa theo các **Use Case**, bao gồm

- **Use Case 1:** Người dùng tìm kiếm địa điểm bằng thanh tìm kiếm
- **Use Case 2:** Người dùng sử dụng tính năng tìm kiếm nâng cao (sử dụng reccommender system), các preferences được chuẩn hoá rõ qua giao diện
- **Use Case 3:** Người dùng chat với chatbot, yêu cầu tìm kiếm
- **Use Case 4:** Người dùng cảm thấy tò mò về một địa điểm và muốn tìm hiểu thêm nên nhấn vào nút 'Hỏi chatbot'

_Lưu ý: những định dạng request và response dưới đây chỉ là ví dụ, có thể sẽ có thay đổi khi phát triển dự án_

#### **Đối với Use Case 1**

Frontend dùng tìm kiếm của người dùng gọi tới Search Service của Backend, nếu Search Service không phản hồi thì gọi tới các API bên ngoài (OSM, SerpAPI, ...). Dữ liệu nhận về bao gồm toạ độ, tên, ảnh minh hoạ, chi tiết,... của các địa điểm kết quả



**Định dạng response:**
```
GET /api/v1/places/search?q=cafe&lat=10.770&lng=106.690&limit=20
Authorization: Bearer <idToken>
```


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

#### **Đối với Use Case 2:**

Frontend đóng gói các preferences của người dùng thành một gói tin có định dạng cụ thể, gửi tới module Reccommendation System, Reccommendation System xử lý dựa trên dữ liệu từ cơ sở dữ liệu (có thể sử dụng mô hình học máy hoặc sử dụng các rules tự định nghĩa) và chắt lọc những địa điểm phù hợp nhất.

Recommendation System sẽ thực hiện bước re-rank/sắp xếp kết quả bằng các chỉ số đánh giá, bao gồm việc sử dụng "Bayesian average" để ổn định xếp hạng khi số lượng review giữa các địa điểm chênh lệch lớn. Công thức tham khảo:

$$score = \frac{v}{v+m}R + \frac{m}{v+m}C$$

trong đó $R$ là trung bình sao của item, $v$ là số review (hoặc tổng trọng số), $C$ là trung bình toàn hệ thống, và $m$ là prior weight (số pseudo‑reviews). Ghi chú thực tiễn:


- Nếu $v=0$ (không có review), trả về $C$ làm điểm mặc định.
- Bayesian rating nên được dùng như bước re-rank cuối cùng sau khi áp các bộ lọc rule‑based hoặc thứ tự trả về từ mô hình ML, nhằm cân bằng giữa độ tin cậy của vote và tính interpretability cho UX.

**Định dạng request**

- Endpoint: `POST /api/v1/recommendations/recommend`
- Headers: `Authorization: Bearer <idToken>` (nếu cần)

```json
{
  "location": "10.770,106.690",   // hoặc tên địa điểm/địa danh
  "type": "hotel",                // optional
  "budget": "midrange",           // optional: budget|midrange|premium
  "radius": 5                       // optional (km)
  // có thể config thêm các preferences khác
}
```

**Định dạng response:**

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


#### **Đối với Use Case 3:** 

Chatbot LLM sử dụng API bên thứ ba, khi nhận thấy yêu cầu tìm kiếm nơi lưu trú, Chatbot sẽ parse yêu cầu của người dùng thành cấu trúc được chuẩn hoá và gọi tới Reccommendation System để lấy kết quả. Ngoài ra, AI Service có thể giao tiếp với UI, tự động hoá việc tìm kiếm và hiển thị địa điểm mà không cần người dùng nhập thủ công.

**Định dạng request:**  

_AI-Service có hỗ trợ one-shot và SSE_

- Endpoint: `POST /api/v1/ai/chat` (one-shot) hoặc `POST /api/v1/ai/chat/stream` (SSE)

```json
{ "text": "Tìm chỗ ở rẻ gần sân bay", "conversation_id": "opt-abc" }
```

**Định dạng response:**

_One-shot response (`ChatResponse`):_

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

_Streaming (SSE) example (each event `data:` is JSON):_

```json
data: {"conversation_id":"abc-123","delta":"Xin chào "}
data: {"conversation_id":"abc-123","delta":"bạn cần gì hôm nay?"}
data: {"conversation_id":"abc-123","delta":"","finish_reason":"stop"}
```

#### **Đối với Use Case 4:** 

Frontend gọi tới AI Service, AI Service truy vấn trên vector database, tìm kiếm các thông tin liên quan (reviews, cái tài liệu được người dùng khác đăng tải lên hệ thống,...) để tổng hợp thông tin, trả lời lại cho User


**Định dạng request:**

- Enpoint: `POST /api/v1/ai/chat`

- AI service sẽ:

  - ánh xạ truy vấn → tìm kiếm trong vector DB (top-k) → trả về các tài liệu / đoạn review kèm theo điểm số
  - (optional) lấy đầy đủ dữ liệu (reviews, file upload) từ database / storage
  - tổng hợp câu trả lời và có thể bao gồm trường sources để truy vết nguồn dữ liệu

**Định dạng response:**

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

## **Evaluation Function**

Dựa theo các tiêu chí sau để đánh giá khả năng giải quyết vấn đề của chương trình:

**Tiêu chí về người dùng:** 
Đánh giá dựa trên phản hồi trực tiếp của người dùng, lượng người dùng thường xuyên của ứng dụng, mức độ tương tác của người dùng. Ngoài ra, tiến hành các cuộc khảo sát nhằm tối ưu hoá quá trình tự đánh giá và cải thiện sản phẩm. 

Các metrics có thể sử dụng:
1. **Rating Score**
$$RatingScore = \frac{\sum{rating}}{n}$$

2. **Sentiment Score** từ reviews của người dùng về ứng dụng, hoặc qua survey
$$Sentiment Score = \frac{positive - negative}{total}$$


**Tiêu chí về Ứng dụng:** 
Đánh giá dựa trên tính chính xác và khả năng đưa ra kết quả dựa theo tập dữ liệu đã có. Hơn nữa, các tiêu chí kĩ thuật khác như thời gian phản hổi của hệ thống, khả năng mở rộng và bảo trì, giao diện thân thiện với các người dùng

Các thông số cụ thể mà chương trình cần phải đạt được:
- Về độ chính xác: $Precision@k \ge 0.5$ sẽ được xem là tạm ổn, kỳ vọng cuối cùng sẽ là từ $0.7$ trở lên
- Về thời gian phản hồi của hệ thống: trung bình độ trễ của các module phải đạt là $Latency \le 700 - 800$ $(ms)$ 
- Về khả năng mở rộng: dùng metrics của hệ thống để kiểm tra khả năng chịu tải hiện thời của hệ thống.

**Tiêu chí về tính có ích:** 
Ứng dụng phải giải quyết được ít nhất một vấn đề của xã hội, phải đảm bảo người dùng có thể sử dụng ứng dụng để nâng cao chất lượng cuộc sống

## **Constraint**

**Về cấu trúc hệ thống**: Sử dụng kiến trúc Microservices để xây dựng hệ thống

**Về phạm vi**: Chương trình trước tiên sẽ tập trung vào phục vụ các người dùng tại Việt Nam, tập dữ liệu cần tìm kiếm sẽ tập trung vào những địa điểm lưu trú ở Việt Nam

**Giao tiếp giữa các Service**: Sử dụng API Gateway đóng vai trò làm trung gian, kiểm soát giao tiếp

**Về phần cứng**: Chương trình không quá nặng, yêu cầu chạy mượt ở máy cấu hình trung bình:

- 16+ GB RAM
- CPU có xung nhịp 3.8 GHz 
- Dung lượng chương trình khoảng từ 3 - 5 GB (dành cho nhà phát triển)
- Có thể chạy tốt trên máy không có VGA


## **Technically executable**

**Tổng quan: khả thi**

**Hệ thống chia thành 4 module chính:**

- **Core Service:** quản lý dữ liệu, API tìm kiếm và giao tiếp với cơ sở dữ liệu.
- **AI Service:** nhận prompt, chuẩn hoá preferences, tạo/quản lý embeddings và gọi LLM.
- **Recommendation System:** engine gợi ý (rule-based cho MVP, nâng cấp thành hybrid sau), trả về ranking.
- **Frontend:** giao diện tìm kiếm, bộ lọc nâng cao và chat UI, tương tác với Core Service và AI Service.

**Cấu trúc MVP đề xuất:** triển khai `Core Service` + `Recommendation System` (rule-based) + `Frontend` + `AI Service` (chatbot cơ bản, chưa tích hợp RAG) và triển khai trên mô hình kiến trúc monolith.

**Xử lý edge cases**:

Dưới đây liệt kê các edge cases chính có thể gặp trong hệ thống và fallback hợp lý để đảm bảo độ ổn định và trải nghiệm người dùng:

- **Kết quả rỗng (no results):**
  - Fallback: Sử dụng preferences mặc định

- **Input mơ hồ / ngôn ngữ tự nhiên không rõ ràng:**
  - Fallback: Nếu confidence parsing thấp → hỏi làm rõ; nếu không có tương tác, parse keyword/ngắn gọn và show options.

- **API bên ngoài lỗi / timeout / rate-limit:**
  - Fallback: dùng cache gần nhất hoặc nguồn thay thế, log lại vào server Backend.

- **Dữ liệu thiếu (ảnh/giá/coords):**
  - Fallback: Hiển thị placeholder, đánh dấu trường thiếu, cho phép report/submit thông tin.

- **Yêu cầu không thể thỏa mãn:**
  - Fallback: Phát hiện impossible set, đề xuất relax constraints hoặc trả "best-effort" kèm cảnh báo.

- **Bán kính quá lớn / vượt vùng:**
  - Fallback: Giới hạn radius tối đa, cảnh báo và gợi ý chọn vùng cụ thể.


# **Decomposition**

## Vấn đề chính

Hệ thống nhằm giải quyết bài toán: tổng hợp dữ liệu địa điểm phân mảnh, hiểu yêu cầu người dùng, và trả về danh sách gợi ý địa điểm lưu trú sắp xếp theo độ phù hợp (có ảnh, điểm, thông tin chi tiết, ...) cho UI và cho chatbot.

## Tổng quan kiến trúc

- Kiến trúc: Microservices — Frontend (React) → API Gateway (Nginx) → Core Service (NestJS), AI Service (FastAPI), Recommendation Service (FastAPI).
- Lưu trữ chính: PostgreSQL (pgvector extension) + Prisma; client-side: Firebase Auth/Firestore; object storage cho ảnh; TTL/in-memory store cho conversation (AI Service) hoặc Redis khi có.
- Luồng điển hình: Frontend → Gateway → (Core | AI) → (AI gọi Recommendation) → Recommendation truy vấn Google/DB → trả về → AI/Core trả cho frontend.

## Các module chức năng chính

### 1. API Gateway
- Trách nhiệm chính:
  - Reverse-proxy tất cả request từ frontend; phân tuyến tới services tương ứng.
  - Xử lý TLS/host, limit cơ bản, static assets nếu cần.
  - Tập trung các cấu hình CORS / rate-limits cho môi trường production.

### 2. Auth
- Trách nhiệm chính:
  - Xác thực token từ Firebase trên server (mappings `firebaseUid` → local `User`).
  - Cung cấp guard/metadata cho endpoints (role checks, 401/403 handling).
  - Quản lý lifecycle token, refresh logic (client), và bàn giao sang Firestore cho data session.

### 3. Core Service (NestJS)
- Tổng quan: API chính cho `users`, `places`, `reviews`, `search` và tích hợp AI.
- Sub-modules & nhiệm vụ cụ thể:
  - Users
    - CRUD người dùng nội bộ, ánh xạ `firebaseUid`, lưu metadata, liên kết review/conversations.
  - Places
    - Lưu trữ và chuẩn hoá metadata địa điểm (name/address/coords/categories), API CRUD.
    - Index theo `lat,lng` để tìm kiếm nhanh; cập nhật/merge dữ liệu từ providers.
  - Reviews
    - Lưu, đọc review; tính toán các chỉ số cơ bản (avg rating, counts) phục vụ scoring.
  - Search
    - Adapter cho nhiều provider (OSM, Google, internal DB); normalise kết quả về shape chung.
    - Logic fallback provider → DB; budget normalization; query composition.
  - AI Integration
    - Proxy gọi `/api/v1/parse` của AI Service; orchestration khi cần tự động gọi Recommendation.
  - Persistence/DB Layer
    - Prisma client, migrations, seed script; đảm bảo index và extension `vector` cho embeddings.

### 4. Recommendation Service
- Tổng quan: pipeline lấy candidate → tính feature → score → re-rank → trả về kết quả.
- Nhiệm vụ chi tiết:
  - Candidate retrieval: Google Places (khi có key) hoặc PostgreSQL (geospatial filtering, bounding box, haversine).
  - Scoring: kết hợp proximity, price match, rating, review volume, business-boosts; áp dụng Bayesian average như bước ổn định.
  - Post-processing: dedupe, availability checks, attach `image_url` (catalog lookup hoặc placeholder), compute distance/time.
  - API: `POST /api/v1/recommend` nhận filters (location/type/budget/radius) và trả `results` với `score`.
  - Metrics & eval: tính Precision@k cho offline evaluation, expose latencies.

### 5. AI Service (FastAPI)
- Tổng quan ti: Xử lý chat (one-shot + SSE) và parse text, 

- Nhiệm vụ chi tiết:
  - NLP / Parse endpoint: tách filters theo rules được định nghĩa trước(location, budget, type, radius).
  - Chat orchestration: build prompt, maintain short-lived conversation store (TTL), gọi LLM (Groq) và stream chunks.
  - RAG / embeddings: lưu/tra cứu `chunks` (nếu bật); gọi vector DB / pgvector qua Prisma nếu cần.
  - Recommendation client: gọi `recommendation-service` và gộp kết quả vào trả lời chat.
  - Error-handling: graceful structured SSE error chunks, timeouts, retry/backoff.

### 6. Frontend (React + Vite)

**Tổng quan:** SPA map-first với chat widget, search, recommendation list và trip management

_Lưu ý: UI có thể được mở rộng theo các module về sau khi các module dần hoàn thiện_

**Chức năng chính:**
- Map UI: dùng OSM API để fetch dữ liệu bản đồ thời gian thực.
- Search UI: hỗ trợ tìm kiếm, gọi đến Search API của Backend.
- Recommendation / Search Result UI: hiển thị `PlaceCard` (hình ảnh, đánh giá, thời gian di chuyển đến, ...), filters, pagination/limit.
- Chat UI: gồm Box Chat, hiển thị lịch sử chat, có hiển thị địa điểm đầu vào trong chatbot RAG
- Auth & client state: Sử dụng Firebase hỗ trợ đăng nhập người dùng, `TravelDataContext` dùng Firestore để lưu trip/saved places.
- Trip UI: đóng gói các địa điểm lưu trú người dùng đã trải nghiệm thành một `trip`

### 7. Data & Storage

- PostgreSQL (pgvector): lưu places, reviews, chunks (embeddings), conversations, messages,...
- Redis: caching cho search, TTL conversation store, cache,...


## Tích hợp bên ngoài (External Integrations)

Sử dụng các API bên ngoài
- Google Places / Maps: phục vụ cho Search Service
- OpenStreetMap / Nominatim: 
- OSRM: routing / travel time.
- Groq (LLM provider): chat completions + streaming.
- Firebase Auth + Firestore: authentication and client-managed data.

## Triển khai & Hạ tầng

- Sử dụng Docker Compose đóng gói và tự động hoá kết nối các service + Postgres (pgvector).
- Core Service chạy Prisma migrations / db push on-start để khởi tạo cấu trúc của database.

