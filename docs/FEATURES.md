# Nền tảng Đề xuất Lưu trú với AI Chatbot (Accommodation Platform Features)

## Tổng quan
Hệ thống là một nền tảng tìm kiếm và đề xuất nơi lưu trú tiên tiến. Nền tảng không chỉ sử dụng các bộ lọc truyền thống mà còn tích hợp Workflow AI, hệ thống RAG Chatbot, tương tác thời gian thực giữa các người dùng (On-site) và tính năng so sánh địa điểm. 

Mục tiêu của hệ thống là giúp người dùng đưa ra quyết định tốt hơn thông qua AI, thông tin từ cộng đồng, và đề xuất cá nhân hoá.

---

## Các tính năng cốt lõi (Core Features)

### 1. Tìm kiếm và Đề xuất Thông minh (Auto-Workflow AI Search)
- Người dùng có thể tìm kiếm bằng bộ lọc (location, budget, type) hoặc **ngôn ngữ tự nhiên** (ví dụ: "tìm khách sạn có hồ bơi gần trung tâm Hà Nội giá dưới 1 triệu").
- Hệ thống sử dụng Agentic Orchestration để phân tích ý định, tự động thực thi các công cụ tìm kiếm, tính toán điểm số phù hợp (scoring) và trả về danh sách được xếp hạng chuẩn xác.

### 2. So sánh Địa điểm (Smart Comparison)
- Người dùng có thể yêu cầu AI so sánh nhiều địa điểm cùng lúc.
- AI sẽ xuất ra bảng so sánh chi tiết, cấu trúc hóa (ưu/nhược điểm, đánh giá giá cả, dịch vụ) và đưa ra gợi ý tốt nhất (Recommended Place) dựa trên yêu cầu cụ thể của người dùng.

### 3. AI Chatbot theo ngữ cảnh (RAG-based Chat)
- Người dùng có thể chat trực tiếp với AI để hỏi về một địa điểm cụ thể.
- Chatbot sử dụng công nghệ RAG (Retrieval-Augmented Generation) lấy dữ liệu từ đánh giá, menu, hình ảnh và tài liệu do người dùng khác tải lên để trả lời một cách có cơ sở và chính xác.
- Luồng chat hoạt động theo thời gian thực (real-time) qua Server-Sent Events (SSE).

### 4. Hệ thống Q&A và Tương tác Cộng đồng (Reddit-style)
- Mỗi địa điểm có một diễn đàn Q&A nội bộ.
- Người dùng có thể đặt câu hỏi về địa điểm.
- Các người dùng khác (đặc biệt là những người đang có mặt ở đó) hoặc AI Chatbot có thể vào trả lời.
- Hệ thống hỗ trợ **Upvote / Downvote** các câu trả lời để những phản hồi hữu ích được đẩy lên trên cùng.
- Người dùng có toàn quyền kiểm soát nội dung (Xoá câu hỏi/trả lời/nhận xét của mình).

### 5. Tương tác Hiện trường (Real-Time Presence & On-site Tracking)
- Hệ thống ghi nhận số lượng người dùng đang thực sự có mặt (On-site) tại địa điểm thông qua xác minh tọa độ.
- Chế độ hiển thị lượng khách thực tế giúp người dùng khác biết mức độ nhộn nhịp.
- Người dùng on-site có thể trò chuyện trực tiếp với những người cũng đang có mặt tại đó.
- Người dùng on-site có thể đóng góp thông tin nóng hổi (upload hình ảnh, menu) ngay lập tức vào Vector DB để AI sử dụng giải đáp cho người dùng khác. 
- Người dùng có quyền tắt tính năng hiển thị On-site vì lý do riêng tư.

### 6. Lưu trữ và Quản lý Yêu thích (Saved Places / Bookmarks)
- Cho phép người dùng lưu (bookmark) các địa điểm yêu thích (khách sạn, quán cafe, nhà hàng...).
- Dễ dàng quản lý danh sách đã lưu ngay trong trang thông tin cá nhân.
- Tạo thuận tiện cho việc lập kế hoạch du lịch cá nhân.