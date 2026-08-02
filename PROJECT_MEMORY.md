# PROJECT MEMORY - Master Architecture & Single Source of Truth

## 1. Project Overview
Dự án Xây dựng Hệ thống thông minh: Music Recommendation System (Web chạy local).
Hệ thống không chỉ là một phần mềm tĩnh (if-else) mà là một nền tảng có khả năng học hỏi và tự tiến hóa dựa trên phản hồi của người dùng.
- **Task 1:** Khởi tạo nền tảng Web App (Login, Play, Skip, Like/Dislike) + Thu thập dữ liệu luồng tương tác.
- **Task 2:** Xây dựng Recommender System sử dụng thuật toán kNN kết hợp chiến lược Explore & Exploit để tránh bias (không chỉ gợi ý nhạc buồn nếu hôm trước nghe nhạc buồn). Hệ thống có vòng lặp phản hồi (Feedback Loop) tự động cập nhật trọng số.
- **Task 3:** Báo cáo & Đánh giá: Chứng minh sự tiến hóa của hệ thống (Chương 1) và đánh giá kỹ thuật (Chương 3) bằng Confusion Matrix, Accuracy, và quản trị rủi ro.

## 2. Current Progress
- [x] Đọc và phân tích toàn bộ tài liệu (Slide Chương 1-4, Task.txt, Tiêu Chí Đánh Giá.txt, KT GK.pdf).
- [x] Phân tích 3 Task chính của đồ án.
- [x] Thiết kế Kiến trúc tổng thể.
- [x] Thiết kế Database Schema. (Đã giải quyết triệt để xung đột kiến trúc Database)
- [x] Thiết kế API. (FE đã cập nhật luồng gọi API mới)
- [x] Thiết kế Folder Structure.
- [x] Thiết kế Data Flow.
- [x] Khởi tạo `PROJECT_MEMORY.md`.
- [x] ML đã có script test thuật toán.
- [x] BE đang hoàn thiện các Controller cuối cùng.

## 3. Architecture Design
Hệ thống áp dụng kiến trúc Hybrid (Microservices-lite chạy local):
- **Frontend (Client):** ReactJS (Giao diện Music Player & Dashboard Analytics).
- **Backend (Server):** NodeJS + ExpressJS (Quản lý User, Music Catalog, và Telemetry Logs).
- **Recommender Engine (AI):** Python (FastAPI hoặc CLI) sử dụng Scikit-learn, Pandas để xử lý kNN, tính toán Explore/Exploit và Confusion Matrix.
- **Database:** SQLite (Lưu trữ tập trung, dễ dàng chia sẻ giữa NodeJS và Python).

## 4. Database Schema (SQLite)
Cấu trúc cơ sở dữ liệu cốt lõi để theo dõi vòng lặp tương tác:

- **Users**: 
  - `id` (PK), `username`, `created_at`
- **Songs**: 
  - `id` (PK), `title`, `artist`, `genre`, `duration_seconds`, `file_path`
- **Interaction_Streams** (Dữ liệu hành vi gốc & Phản hồi): 
  - `id` (PK), `user_id` (FK), `song_id` (FK), `session_id`, `event_type` (`start`, `pause`, `skip`, `complete`, `like`, `dislike`), `playback_position`, `source` (`search`, `recommendation`, `playlist`), `recommendation_id` (FK, nullable), `timestamp`
- **Recommendations** (Lịch sử các lần gợi ý):
  - `id` (PK), `user_id` (FK), `song_ids` (JSON), `algorithm` (`knn_user`, `knn_item`, `explore`), `created_at`
- **Run_Metrics** (Đánh giá kỹ thuật):
  - `id` (PK), `recommendation_id` (FK), `tp`, `fp`, `tn`, `fn`, `accuracy`, `precision`, `recall`, `confusion_matrix` (JSON), `timestamp`

## 5. API List

### Backend (NodeJS) - Cung cấp cho Frontend
- `POST /api/auth/login`: Định danh người dùng.
- `GET /api/songs`: Lấy danh sách bài hát tĩnh.
- `POST /api/telemetry/log`: Ghi log hành vi người dùng (Play, Pause, Skip, v.v.). API này kiêm luôn việc ghi nhận phản hồi nếu truyền kèm `source="recommendation"` và `recommendation_id`.
- `GET /api/recommendations`: Lấy danh sách bài hát gợi ý cho User hiện tại (Gọi sang Python Engine).
- `GET /api/analytics/metrics`: Lấy dữ liệu Confusion Matrix, Accuracy để vẽ biểu đồ sự tiến hóa (Task 3).

### Recommender Engine (Python) - Cung cấp cho NodeJS
- `POST /engine/recommend`: Nhận `user_id`, tính toán kNN + Explore/Exploit, trả về danh sách `song_id`.
- `POST /engine/evaluate`: Tính toán lại Confusion Matrix & Accuracy dựa trên dữ liệu từ bảng Interaction_Streams (lọc theo source="recommendation").

## 6. Folder Structure
```text
/ (Root Workspace)
├── PROJECT_MEMORY.md       # Single Source of Truth
├── frontend/               # ReactJS Web App
│   ├── public/
│   ├── src/
│   │   ├── components/     # Music Player, Chart
│   │   ├── pages/          # Home, Analytics
│   │   ├── services/       # Fetch API
│   │   └── App.jsx
│   └── package.json
├── backend/                # NodeJS Express API
│   ├── src/
│   │   ├── controllers/    # API logic
│   │   ├── routes/         # Express routes
│   │   ├── models/         # SQLite DB queries
│   │   └── index.js
│   ├── database/           # SQLite DB file
│   └── package.json
└── recommender/            # Python ML Engine
    ├── api.py              # FastAPI entry point
    ├── core.py             # kNN, Explore & Exploit logic
    ├── evaluate.py         # Confusion Matrix & Accuracy calc
    └── requirements.txt    # pandas, scikit-learn, fastapi
```

## 7. Data Flow (Luồng dữ liệu)
1. **Tương tác (Telemetry):** Người dùng thao tác trên Frontend (Skip < 15s, Like, Complete). Frontend gửi `POST /api/telemetry/log` về NodeJS. NodeJS ghi vào DB (bảng `Interaction_Streams`).
2. **Yêu cầu Gợi ý:** Frontend gọi `GET /api/recommendations`. NodeJS chuyển tiếp yêu cầu sang Python Engine (`POST /engine/recommend`).
3. **Tính toán (AI):** Python đọc SQLite, lọc nhiễu (bias filter), tính kNN kết hợp 20% Explore (nhạc mới/random) và 80% Exploit (nhạc hợp gu). Trả về danh sách gợi ý.
4. **Vòng lặp Phản hồi (Feedback Loop):** Người dùng tương tác với danh sách gợi ý. Dữ liệu này được lưu vào bảng `Interaction_Streams` với `source="recommendation"` và `recommendation_id`.
5. **Đánh giá (Metrics):** Python Engine sử dụng dữ liệu tương tác (lọc theo `source="recommendation"`) để so sánh với kết quả dự đoán (Ví dụ: Dự đoán thích -> User Like = True Positive; Dự đoán thích -> User Skip = False Positive). Tính toán Confusion Matrix và lưu vào `Run_Metrics`. Frontend vẽ biểu đồ chứng minh hệ thống ngày càng thông minh.

## 8. Decisions
- **Rule 1:** Tuân thủ Single Source of Truth. `PROJECT_MEMORY.md` là tài liệu tham chiếu cao nhất.
- **Rule 2:** Tách biệt rõ ràng Logic (NodeJS phục vụ Web) và AI (Python xử lý Thuật toán). Dùng SQLite làm cầu nối dữ liệu cực nhanh ở Local.
- **Rule 3:** Đánh giá độ thông minh không phải bằng giao diện đẹp, mà bằng biểu đồ tiến hóa (Accuracy) và Confusion Matrix thay đổi theo thời gian thực (Closed Feedback Loop).

## 9. TODO
- [ ] Khởi tạo thư mục `frontend` với ReactJS cơ bản.
- [ ] Khởi tạo thư mục `backend` với NodeJS, Express và kết nối SQLite.
- [ ] Khởi tạo thư mục `recommender` với Python, thiết lập FastAPI và thư viện ML.
- [ ] Chuẩn bị Integration Test cho Recommender System (Task 2).
- [ ] Implement kNN & Explore/Exploit (Task 2).
- [ ] Implement Feedback Loop & Biểu đồ Confusion Matrix (Task 3).

## 10. Completed
- [x] Hoàn thành luồng Auth và Music Player cơ bản (Task 1).
- [x] Gộp bảng Feedback vào Interaction_Streams (thêm `source` và `recommendation_id`) theo đề xuất từ Chat 4.
- [x] Thiết kế hệ thống tổng thể.
- [x] Khởi tạo `PROJECT_MEMORY.md`.

## 11. Known Issues
- Chưa có.
