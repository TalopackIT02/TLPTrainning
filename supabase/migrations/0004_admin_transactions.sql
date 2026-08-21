-- Authenticated multi-step admin operations kept atomic.
create or replace function admin_save_question(p_bank_id uuid,p_question jsonb) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_option jsonb; begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 if not exists(select 1 from question_banks where id=p_bank_id) then raise exception 'INVALID_BANK'; end if;
 v_id:=(p_question->>'id')::uuid;
 insert into questions(id,bank_id,question_code,question_text,explanation,default_points,is_active)
 values(v_id,p_bank_id,p_question->>'questionCode',p_question->>'questionText',nullif(p_question->>'explanation',''),coalesce((p_question->>'defaultPoints')::numeric,1),coalesce((p_question->>'isActive')::boolean,true))
 on conflict(id) do update set question_code=excluded.question_code,question_text=excluded.question_text,explanation=excluded.explanation,default_points=excluded.default_points,is_active=excluded.is_active;
 for v_option in select value from jsonb_array_elements(p_question->'options') loop
   insert into question_options(id,question_id,option_code,option_text,is_correct,sort_order)
   values((v_option->>'id')::uuid,v_id,v_option->>'optionCode',v_option->>'optionText',(v_option->>'isCorrect')::boolean,(v_option->>'sortOrder')::int)
   on conflict(id) do update set option_code=excluded.option_code,option_text=excluded.option_text,is_correct=excluded.is_correct,sort_order=excluded.sort_order;
 end loop;
 delete from question_options where question_id=v_id and id not in(select (value->>'id')::uuid from jsonb_array_elements(p_question->'options'));
 if (select count(*) from question_options where question_id=v_id and is_correct)<>1 then raise exception 'EXACTLY_ONE_CORRECT_OPTION_REQUIRED'; end if;
 return v_id;
end $$;

create or replace function admin_import_questions(p_bank_id uuid,p_file_name text,p_questions jsonb) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_job uuid; v_question jsonb; v_count int:=0; begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 insert into import_jobs(import_type,file_name,status,total_rows) values('QUESTIONS',p_file_name,'PROCESSING',jsonb_array_length(p_questions)) returning id into v_job;
 for v_question in select value from jsonb_array_elements(p_questions) loop perform admin_save_question(p_bank_id,v_question); v_count:=v_count+1; end loop;
 update import_jobs set status='COMPLETED',success_rows=v_count,failed_rows=jsonb_array_length(p_questions)-v_count,completed_at=now() where id=v_job; return v_job;
end $$;

create or replace function admin_upsert_training_batch(
 p_batch_id uuid,p_batch_code text,p_batch_name text,p_exam_id uuid,p_start_at timestamptz,p_due_at timestamptz,p_status batch_status,
 p_question_count int,p_time_limit_minutes int,p_max_attempts int,p_pass_score numeric,p_shuffle_questions boolean,p_shuffle_options boolean,
 p_stop_on_pass boolean,p_review_policy review_policy,p_require_material_completion boolean,p_employee_ids uuid[]
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_exam exams%rowtype; v_old training_batches%rowtype; begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
 select * into v_exam from exams where id=p_exam_id; if v_exam.id is null then raise exception 'INVALID_EXAM'; end if;
 select * into v_old from training_batches where id=p_batch_id for update;
 if v_old.id is null then
   insert into training_batches(id,batch_code,batch_name,course_id,exam_id,start_at,due_at,status,question_count,time_limit_minutes,max_attempts,pass_score,shuffle_questions,shuffle_options,stop_on_pass,review_policy,require_material_completion)
   values(p_batch_id,p_batch_code,p_batch_name,v_exam.course_id,p_exam_id,p_start_at,p_due_at,p_status,p_question_count,p_time_limit_minutes,p_max_attempts,p_pass_score,p_shuffle_questions,p_shuffle_options,p_stop_on_pass,p_review_policy,p_require_material_completion);
   insert into batch_bank_rules(batch_id,source_exam_bank_rule_id,bank_id,selection_mode,question_count) select p_batch_id,id,bank_id,selection_mode,question_count from exam_bank_rules where exam_id=p_exam_id;
   if not exists(select 1 from batch_bank_rules where batch_id=p_batch_id) then raise exception 'EXAM_BANK_RULE_REQUIRED'; end if;
 else
   if v_old.status<>'DRAFT' and (v_old.exam_id<>p_exam_id or v_old.question_count<>p_question_count or v_old.time_limit_minutes<>p_time_limit_minutes or v_old.max_attempts<>p_max_attempts or v_old.pass_score<>p_pass_score or v_old.shuffle_questions<>p_shuffle_questions or v_old.shuffle_options<>p_shuffle_options or v_old.stop_on_pass<>p_stop_on_pass or v_old.review_policy<>p_review_policy or v_old.require_material_completion<>p_require_material_completion) then raise exception 'BATCH_SNAPSHOT_LOCKED'; end if;
   update training_batches set batch_code=p_batch_code,batch_name=p_batch_name,start_at=p_start_at,due_at=p_due_at,status=p_status,question_count=p_question_count,time_limit_minutes=p_time_limit_minutes,max_attempts=p_max_attempts,pass_score=p_pass_score,shuffle_questions=p_shuffle_questions,shuffle_options=p_shuffle_options,stop_on_pass=p_stop_on_pass,review_policy=p_review_policy,require_material_completion=p_require_material_completion where id=p_batch_id;
 end if;
 delete from batch_employees be where be.batch_id=p_batch_id and not(be.employee_id=any(coalesce(p_employee_ids,array[]::uuid[]))) and not exists(select 1 from exam_attempts a where a.batch_employee_id=be.id);
 insert into batch_employees(batch_id,employee_id) select p_batch_id,unnest(coalesce(p_employee_ids,array[]::uuid[])) on conflict(batch_id,employee_id) do nothing;
 return p_batch_id;
end $$;

revoke all on function admin_save_question(uuid,jsonb),admin_import_questions(uuid,text,jsonb),admin_upsert_training_batch(uuid,text,text,uuid,timestamptz,timestamptz,batch_status,int,int,int,numeric,boolean,boolean,boolean,review_policy,boolean,uuid[]) from public,anon;
grant execute on function admin_save_question(uuid,jsonb),admin_import_questions(uuid,text,jsonb),admin_upsert_training_batch(uuid,text,text,uuid,timestamptz,timestamptz,batch_status,int,int,int,numeric,boolean,boolean,boolean,review_policy,boolean,uuid[]) to authenticated;
