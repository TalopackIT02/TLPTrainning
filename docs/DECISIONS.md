# Technical Decisions

## ADR-001 — HashRouter

Dùng `HashRouter` để GitHub Pages không cần rewrite và refresh/open trực tiếp learner hash route vẫn hoạt động.

## ADR-002 — Demo adapter khi thiếu credentials

Khi không có Supabase env, ứng dụng dùng localStorage seed để dev và E2E chạy trọn luồng. Khi env hợp lệ, Auth và learner API chuyển sang Supabase. Không có secret giả hoặc service role trong bundle.

## ADR-003 — Persisted deadline

Thêm `exam_attempts.deadline_at`. Deadline được ghi cùng attempt trong transaction, tránh timer phụ thuộc state trình duyệt và đơn giản hóa kiểm tra resume/auto-submit.

## ADR-004 — Batch/attempt immutability

Batch copy exam settings và bank rules; attempt copy question/option text, correct flag, point và order. Template sửa về sau không ảnh hưởng dữ liệu lịch sử.

## ADR-005 — UI system khi HtmlDemo trống

HtmlDemo chưa có file. UI theo concept nội bộ: navy sidebar, cobalt action, nền slate, table-driven admin và mobile one-column learner. Component tách theo feature để có thể remap sang HtmlDemo về sau.
