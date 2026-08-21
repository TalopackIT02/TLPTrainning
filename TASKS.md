# TASKS — Trạng thái triển khai

## Phase 0 — Bootstrap
- [x] npm install/dev/build/typecheck.
- [x] HtmlDemo đã kiểm tra: trống, giữ `.gitkeep`.

## Phase 1 — Database
- [x] Schema, PK/FK/unique/check/index/timestamp/archive model.
- [x] RLS authenticated admin + revoke anon tables.
- [x] Seed 15 employees, 2 courses, material, bank 20 questions, exam, batch assignment.
- [x] Invariant SQL query.
- [ ] BLOCKED EXTERNAL: chạy migrations trên Supabase project sạch (cần project credentials/CLI).

## Phase 2 — Learner API
- [x] Public batch, employee search, learner state, material progress.
- [x] Atomic start/resume/snapshot, answer save, submit/auto-submit, result/review.
- [x] Anon chỉ có RPC execute.

## Phase 3–7 — Admin
- [x] Supabase Auth guard, login/logout và admin shell.
- [x] Dashboard, Departments, Employees, Courses, Materials.
- [x] Banks, single-choice Questions, CSV preview/validation/import job.
- [x] Exam settings và Training Batch snapshot/assignment/open-close/public link.

## Phase 8–10 — Learner & Monitoring
- [x] Search dropdown `CODE — NAME`, material, exam, persisted countdown, reload resume.
- [x] Retry/stop-on-pass/max attempts/review policies.
- [x] Batch progress, attempt history và full admin detail.

## Phase 11 — QA
- [x] Unit tests: scoring, pass/fail, limit, stop-on-pass, review, expiry timer, CSV.
- [x] E2E: admin batch; learner fail/retry/pass; refresh timer; review lock.
- [x] Desktop/mobile Playwright projects configured.

## Phase 12 — Deploy
- [x] Actions quality gate và Pages artifact/deploy workflow.
- [x] Dynamic repository base + HashRouter.
- [x] No secret committed; `.env.example` documented.
- [x] GitHub Pages đã bật với source GitHub Actions; workflow run `32462829522` deploy thành công.
