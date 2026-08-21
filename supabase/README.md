# Supabase setup

Chạy theo thứ tự:

1. `migrations/0001_initial_schema.sql`
2. `migrations/0002_rls.sql`
3. `migrations/0003_learner_rpc.sql`
4. `migrations/0004_admin_transactions.sql`
5. Tạo Supabase Auth user cho Admin.

Không cấp direct table access cho anon. Không đặt service-role key hoặc database password trong frontend.
