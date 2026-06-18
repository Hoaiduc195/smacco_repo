# Cấu trúc Cơ sở dữ liệu (Database Architecture)

Tài liệu này đặc tả cấu trúc cơ sở dữ liệu PostgreSQL được sử dụng bởi ứng dụng `mono`, bao gồm ánh xạ ORM thông qua Prisma, chức năng của các bảng, mối quan hệ và chiến lược index.

---

## 1. Công nghệ và Runtime

- **Database**: PostgreSQL 16
- **Vector extension**: `pgvector` (được dùng để lưu trữ embedding cho hệ thống RAG)
- **ORM**: Prisma (phiên bản cấu hình trong `backend/prisma/schema.prisma`)
- **Môi trường**: Chạy qua Docker container với image `pgvector/pgvector:pg16`
- **Kết nối**: `DATABASE_URL` trong file `.env` (Ví dụ: `postgresql://postgres:postgres@localhost:5432/accommodation_db?schema=public`)

---

## 2. Lệnh Migration & Khởi tạo

Để deploy schema hoặc đồng bộ database local:
```bash
cd mono/backend
npx prisma migrate deploy
# hoặc nếu làm việc tại local dev environment
npx prisma db push
```

---

## 3. Tổng quan các Bảng (Logical Schema)

Hệ thống được chia thành các nhóm dữ liệu chính:

### 3.1. Dữ liệu Người dùng & Địa điểm
1. **`app_users` (`User`)**
   - Lưu trữ người dùng đã xác thực qua Firebase.
   - Trường `firebase_uid` dùng để tra cứu nhanh từ token Firebase.
2. **`places` (`Place`)**
   - Lưu trữ địa điểm (khách sạn, nhà hàng, v.v.).
   - Chứa tọa độ (`lat`, `lng`), danh mục (`categories`), metadata (`review_count`, `average_rating`).
3. **`place_sources` (`PlaceSource`)**
   - Bảng ánh xạ 1-N cho `places` để theo dõi nguồn dữ liệu gốc (OSM, Google) nhằm tránh trùng lặp khi fetch từ nhiều provider.
4. **`saved_places` (`SavedPlace`)**
   - Lưu trữ danh sách địa điểm yêu thích/đã lưu của người dùng (Bookmark feature).

### 3.2. Dữ liệu Tương tác Xã hội & On-site
5. **`reviews` (`Review`)**
   - Điểm số (rating) và nhận xét văn bản cho mỗi địa điểm.
6. **`presences` (`Presence`)**
   - Ghi nhận trạng thái người dùng đang có mặt tại địa điểm (On-site tracking). Có thời gian `joined_at` và `left_at`.
7. **`questions` (`Question`) & `answers` (`Answer`) & `answer_votes` (`AnswerVote`)**
   - Hệ thống Q&A cộng đồng tại mỗi địa điểm, tương tự Reddit.
   - User có thể upvote/downvote câu trả lời.
8. **`files` (`File`)**
   - Quản lý metadata file (ảnh, tài liệu, menu) do người dùng tải lên, kèm trạng thái xử lý AI (`file_status`).

### 3.3. Dữ liệu RAG & AI Chat
9. **`chunks` (`Chunk`)**
   - Trái tim của hệ thống RAG (Retrieval-Augmented Generation).
   - Chứa nội dung văn bản (`content`), thông tin nguồn (`source_id`, `source_type`) và vector toán học (`embedding` - dùng `pgvector`).
10. **`conversations` (`Conversation`)**
    - Lưu phiên hội thoại AI của người dùng.
11. **`conversation_place_references` (`ConversationPlaceReference`)**
    - Ánh xạ N-N giữa hội thoại và nhiều địa điểm được nhắc đến trong bối cảnh chat.
12. **`messages` (`Message`)**
    - Nội dung chat (của `user` hoặc `assistant`), số lượng token sử dụng, latency và mảng ID các `chunks` được dùng làm context (`retrieved_chunk_ids`).
13. **`place_comparison_results` (`PlaceComparisonResult`)**
    - Kết quả sinh ra bởi AI khi so sánh các địa điểm, bao gồm JSON payload cấu trúc và tên địa điểm được đề xuất cuối cùng.

---

## 4. Mối quan hệ (Table Relationships)

- **Cascade Deletion**: Xóa `User` hoặc `Place` sẽ tự động xóa (CASCADE) các bản ghi phụ thuộc như `Review`, `Chunk`, `Question`, `SavedPlace`, `Presence`...
- Cột `user_id` trong `Review`, `Chunk`, `Question` được cấu hình `SetNull` khi user bị xoá để duy trì nội dung đóng góp cho cộng đồng nếu cần. Tuy nhiên với `AnswerVote` hoặc `SavedPlace`, nó sẽ tự động bị xóa (Cascade).
- **Quan hệ 1-N**: Một `Conversation` có nhiều `Message`, một `Question` có nhiều `Answer`, một `Answer` có nhiều `AnswerVote`.
- **Quan hệ N-N**: Bảng `conversations` và `places` liên kết với nhau qua bảng trung gian `conversation_place_references`.

---

## 5. Chiến lược Index

Để đảm bảo hiệu năng truy vấn cao, schema định nghĩa các index chủ đạo:
- **Index Không Gian (Geo)**: `idx_places_location` trên `(lat, lng)` để quét bán kính nhanh chóng.
- **Index Khóa Ngoại (Foreign Key)**: Index được gán cho hầu hết FK như `place_id`, `user_id`, `conversation_id`, `question_id` để tăng tốc độ truy vấn liên bảng.
- **Index Vector (RAG)**: Cột `embedding` trong bảng `chunks` là cột đặc biệt của `pgvector`, tối ưu truy vấn Nearest Neighbor (Semantic Search).
- **Index Unique Constraints**: Đảm bảo tính toàn vẹn dữ liệu thông qua các Unique Constraint trên `(firebase_uid)`, `(source, source_place_id)`, `(conversation_id, place_id)`, và `(userId, placeId)` của bảng `saved_places`.