do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'departments',
    'employees',
    'training_courses',
    'learning_materials',
    'question_banks',
    'import_jobs',
    'questions',
    'question_options',
    'exams',
    'exam_bank_rules',
    'training_batches',
    'batch_bank_rules',
    'batch_employees',
    'employee_material_progress',
    'exam_attempts',
    'attempt_questions',
    'attempt_question_options',
    'attempt_answers'
  ]
  loop
    execute format(
      'grant select, insert, update, delete on table %I to authenticated',
      table_name
    );
    execute format('revoke all on table %I from anon', table_name);
  end loop;
end
$$;
