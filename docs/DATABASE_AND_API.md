# Database & API summary

Schema chính gồm `departments`, `employees`, `training_courses`, `learning_materials`, `question_banks`, `questions`, `question_options`, `exams`, `exam_bank_rules`, `training_batches`, `batch_bank_rules`, `batch_employees`, `employee_material_progress`, `exam_attempts`, `attempt_questions`, `attempt_question_options`, `attempt_answers`, `import_jobs`.

Các public RPC được cấp cho anon/authenticated:

- `get_public_batch`
- `search_batch_employees`
- `get_learner_state`
- `mark_material_opened` / `mark_material_completed`
- `start_or_resume_attempt`
- `save_answer`
- `submit_attempt`

`create_batch_from_exam` chỉ cấp authenticated. Hàm snapshot exam/bank rules và assign nhân viên trong một transaction.

Mọi RPC learner xác minh `public_token`, employee/batch relation và attempt/question/option relation. `public_attempt_payload` không được grant ra ngoài và chỉ trả correct answer khi `review_unlocked=true`.
