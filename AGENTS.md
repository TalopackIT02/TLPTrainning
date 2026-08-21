# AGENTS.md — Hợp đồng triển khai

Nguồn yêu cầu ưu tiên: `AGENTS.md` → `PROJECT_SPEC.md` → database/business rules → `TASKS.md` → `README.md`.

## Bất biến MVP

1. Learner không login; vào bằng `#/training/:publicToken` và chọn `CODE — FULL_NAME` trong batch.
2. Exam là template; Training Batch snapshot setting/bank rule; Attempt snapshot câu hỏi/options/correct answer/point/order.
3. Mỗi attempt là record riêng, không ghi đè hoặc hard-delete lịch sử.
4. Chỉ `SINGLE_CHOICE`; CSV phải preview/validate row trước confirm.
5. Timer dùng persisted `started_at`/`deadline_at`; reload resume, hết giờ auto-submit.
6. Score/pass tính server-side. `stop_on_pass`, max attempts, due date và hai review policy phải được giữ.
7. Anon không được direct table CRUD; learner chỉ qua RPC `security definer` kiểm tra token và quan hệ.
8. Admin dùng Supabase Auth; frontend chỉ có URL/anon key.

## Stack

React + TypeScript strict + Vite + HashRouter + Tailwind/shadcn, Supabase PostgreSQL/Auth/RLS/RPC, Papa Parse, Zod, Vitest, Playwright, GitHub Actions/Pages.

## Definition of done

Mỗi phase phải typecheck, test liên quan và build pass. UI kiểm tra desktop/mobile; migration giữ thứ tự và có thể chạy trên project sạch.
