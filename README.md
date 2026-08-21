# TLP Training MVP

Hệ thống quản lý và theo dõi đào tạo nội bộ gồm hai bề mặt:

- Admin/Trainer đăng nhập bằng Supabase Auth tại `#/admin`.
- Người học không đăng nhập, mở link `#/training/:publicToken`, chọn nhân viên trong batch và làm bài.

## Development

Yêu cầu Node.js 20+ và npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Ứng dụng yêu cầu kết nối Supabase để hoạt động. Nếu thiếu cấu hình, màn hình đăng nhập và learner route sẽ hiển thị lỗi cấu hình; hệ thống không tạo dữ liệu cục bộ và không có tài khoản đăng nhập thay thế.

Biến môi trường frontend duy nhất:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Không đưa `service_role`, database password hoặc PAT vào `.env` frontend.

## Supabase

1. Tạo Supabase project.
2. Chạy các file trong `supabase/migrations/` theo thứ tự `0001` → `0004` bằng SQL Editor hoặc `supabase db push`.
3. Tạo ít nhất một user trong Authentication → Users cho Admin.
4. Dùng URL/anon key của project trong `.env.local`.

Migration `0002_rls.sql` không tạo anon table policy. Toàn bộ public learner flow chỉ được cấp `EXECUTE` vào RPC của `0003_learner_rpc.sql`. Score, pass/fail, snapshot và review unlock đều được quyết định trong database.

## Test và build

```bash
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

Unit test bao phủ score/pass, attempt limit, stop-on-pass, review policy, timer và CSV validation. Playwright không có dữ liệu mẫu; bộ smoke test mặc định xác nhận ứng dụng không fallback sang dữ liệu local khi thiếu Supabase. Các critical flow cần chạy trên một Supabase test project đã áp dụng migrations.

## GitHub Pages

Workflow `.github/workflows/deploy.yml` chạy typecheck, unit test, Playwright, production build rồi deploy Pages khi push `main`. `vite.config.ts` lấy repository name từ `GITHUB_REPOSITORY`, vì vậy base path tự thành `/TLPTrainning/` trên Actions và `/` ở local.

Thiết lập repository:

1. Settings → Secrets and variables → Actions, thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (anon key là public nhưng vẫn quản lý tập trung tại Actions).
2. Settings → Pages → Source chọn **GitHub Actions**.
3. Push nhánh `main` và theo dõi workflow.

HashRouter đảm bảo mở trực tiếp `/#/admin` và `/#/training/:publicToken` không cần server rewrite.

## Cấu trúc

- `src/pages/admin`: dashboard, master data, question bank/CSV, exam, batch, monitoring/history.
- `src/pages/learner`: luồng chọn nhân viên, tài liệu, exam, timer và kết quả.
- `src/features`: business logic thuần, CSV parser và learner service/RPC adapter.
- `src/data`: Supabase admin adapter và state quản trị.
- `supabase/migrations`: schema, RLS, learner/admin RPC.
- `e2e`: critical flow Playwright.

## CSV câu hỏi

Template nằm tại `templates/questions_import_template.csv`. UI luôn parse → validate header/row → preview total/valid/invalid → xác nhận mới import dòng hợp lệ và lưu import job.
