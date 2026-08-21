begin;
do $$ begin
  if (select count(*) from question_options where is_correct group by question_id having count(*)>1 limit 1) is not null then raise exception 'Multiple correct options detected'; end if;
  if exists(select 1 from exam_attempts group by batch_employee_id,attempt_no having count(*)>1) then raise exception 'Duplicate attempt number detected'; end if;
  if exists(select 1 from exam_attempts where status='SUBMITTED' and submitted_at is null) then raise exception 'Submitted attempt without submitted_at'; end if;
end $$;
rollback;
