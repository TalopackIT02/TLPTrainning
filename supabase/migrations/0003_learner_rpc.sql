-- Secure public learner boundary. No learner table is exposed to anon.
create or replace function public_attempt_payload(p_attempt_id uuid, p_include_review boolean default false)
returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
  select jsonb_build_object(
    'id',a.id,'attemptNo',a.attempt_no,'startedAt',a.started_at,'deadlineAt',a.deadline_at,
    'submittedAt',a.submitted_at,'durationSeconds',a.duration_seconds,'status',a.status,
    'scorePercent',a.score_percent,'passed',a.passed,'autoSubmitted',a.auto_submitted,
    'reviewUnlocked',a.review_unlocked,
    'questions',coalesce((select jsonb_agg(jsonb_build_object(
      'id',q.id,'displayOrder',q.display_order,'text',q.question_text_snapshot,'points',q.points_snapshot,
      'explanation',case when p_include_review then q.explanation_snapshot else null end,
      'selectedOptionId',ans.selected_option_id,
      'options',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'displayOrder',o.display_order,'text',o.option_text_snapshot,'isCorrect',case when p_include_review then o.is_correct_snapshot else null end) order by o.display_order) from attempt_question_options o where o.attempt_question_id=q.id),'[]'::jsonb)
    ) order by q.display_order) from attempt_questions q left join attempt_answers ans on ans.attempt_question_id=q.id where q.attempt_id=a.id),'[]'::jsonb)
  ) from exam_attempts a where a.id=p_attempt_id;
$$;
revoke all on function public_attempt_payload(uuid,boolean) from public,anon,authenticated;

create or replace function get_public_batch(p_public_token uuid) returns jsonb
language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('batchId',b.id,'batchName',b.batch_name,'courseName',c.course_name,'startAt',b.start_at,'dueAt',b.due_at,'status',b.status)
 from training_batches b join training_courses c on c.id=b.course_id where b.public_token=p_public_token;
$$;

create or replace function search_batch_employees(p_public_token uuid,p_query text default '') returns jsonb
language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'employeeCode',e.employee_code,'fullName',e.full_name,'departmentId',e.department_id,'departmentName',d.department_name,'positionName',e.position_name,'isActive',e.is_active) order by e.employee_code),'[]'::jsonb)
 from training_batches b join batch_employees be on be.batch_id=b.id join employees e on e.id=be.employee_id left join departments d on d.id=e.department_id
 where b.public_token=p_public_token and e.is_active and (coalesce(trim(p_query),'')='' or e.employee_code ilike '%'||trim(p_query)||'%' or e.full_name ilike '%'||trim(p_query)||'%')
 limit 20;
$$;

create or replace function mark_material_opened(p_public_token uuid,p_employee_id uuid,p_material_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_be uuid; begin
 select be.id into v_be from training_batches b join batch_employees be on be.batch_id=b.id join learning_materials m on m.course_id=b.course_id where b.public_token=p_public_token and be.employee_id=p_employee_id and m.id=p_material_id;
 if v_be is null then raise exception 'INVALID_RELATION'; end if;
 insert into employee_material_progress(batch_employee_id,material_id,opened_at) values(v_be,p_material_id,now()) on conflict(batch_employee_id,material_id) do update set opened_at=coalesce(employee_material_progress.opened_at,excluded.opened_at);
 update batch_employees set current_status=case when current_status='NOT_STARTED' then 'READING' else current_status end where id=v_be;
end $$;

create or replace function mark_material_completed(p_public_token uuid,p_employee_id uuid,p_material_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_be uuid; v_remaining int; begin
 select be.id into v_be from training_batches b join batch_employees be on be.batch_id=b.id join learning_materials m on m.course_id=b.course_id where b.public_token=p_public_token and be.employee_id=p_employee_id and m.id=p_material_id and m.is_active;
 if v_be is null then raise exception 'INVALID_RELATION'; end if;
 insert into employee_material_progress(batch_employee_id,material_id,opened_at,completed_at,is_completed) values(v_be,p_material_id,now(),now(),true) on conflict(batch_employee_id,material_id) do update set opened_at=coalesce(employee_material_progress.opened_at,excluded.opened_at),completed_at=now(),is_completed=true;
 select count(*) into v_remaining from learning_materials m join batch_employees be on be.id=v_be join training_batches b on b.id=be.batch_id left join employee_material_progress mp on mp.batch_employee_id=be.id and mp.material_id=m.id where m.course_id=b.course_id and m.is_active and m.is_required and coalesce(mp.is_completed,false)=false;
 update batch_employees set current_status=case when v_remaining=0 then 'READY_FOR_EXAM' else 'READING' end where id=v_be and current_status not in ('PASSED','FAILED','LOCKED');
end $$;

create or replace function submit_attempt(p_public_token uuid,p_employee_id uuid,p_attempt_id uuid,p_auto_submitted boolean default false) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_a exam_attempts%rowtype; v_b training_batches%rowtype; v_be batch_employees%rowtype; v_raw numeric; v_max numeric; v_pct numeric; v_pass boolean; v_unlock boolean; begin
 select a.* into v_a from exam_attempts a join batch_employees be on be.id=a.batch_employee_id join training_batches b on b.id=be.batch_id where a.id=p_attempt_id and be.employee_id=p_employee_id and b.public_token=p_public_token for update of a;
 if v_a.id is null then raise exception 'INVALID_ATTEMPT'; end if;
 select * into v_be from batch_employees where id=v_a.batch_employee_id for update;
 select b.* into v_b from training_batches b where b.id=v_be.batch_id;
 if v_a.status='SUBMITTED' then return public_attempt_payload(v_a.id,v_a.review_unlocked); end if;
 select coalesce(sum(case when o.is_correct_snapshot then q.points_snapshot else 0 end),0),coalesce(sum(q.points_snapshot),0) into v_raw,v_max from attempt_questions q left join attempt_answers ans on ans.attempt_question_id=q.id left join attempt_question_options o on o.id=ans.selected_option_id where q.attempt_id=v_a.id;
 v_pct:=case when v_max=0 then 0 else round(v_raw/v_max*100,2) end; v_pass:=v_pct>=v_b.pass_score; v_unlock:=v_b.review_policy='AFTER_EACH_SUBMISSION' or v_a.attempt_no>=v_b.max_attempts or (v_pass and v_b.stop_on_pass);
 update exam_attempts set submitted_at=now(),duration_seconds=greatest(0,extract(epoch from (now()-started_at))::int),status='SUBMITTED',raw_score=v_raw,max_score=v_max,score_percent=v_pct,passed=v_pass,auto_submitted=p_auto_submitted or now()>=deadline_at,review_unlocked=v_unlock where id=v_a.id;
 if v_unlock then update exam_attempts set review_unlocked=true where batch_employee_id=v_be.id and status='SUBMITTED'; end if;
 update batch_employees set attempts_used=greatest(attempts_used,v_a.attempt_no),last_score=v_pct,best_score=greatest(coalesce(best_score,0),v_pct),last_attempt_at=now(),current_status=case when v_pass and v_b.stop_on_pass then 'PASSED' when not v_pass and v_a.attempt_no>=v_b.max_attempts then 'FAILED' else 'READY_FOR_EXAM' end,completed_at=case when v_pass then now() else completed_at end,locked_at=case when v_unlock and (v_pass and v_b.stop_on_pass or v_a.attempt_no>=v_b.max_attempts) then now() else locked_at end where id=v_be.id;
 return public_attempt_payload(v_a.id,v_unlock);
end $$;

create or replace function start_or_resume_attempt(p_public_token uuid,p_employee_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_b training_batches%rowtype; v_be batch_employees%rowtype; v_active exam_attempts%rowtype; v_attempt uuid; v_attempt_no int; v_q record; v_o record; v_aq uuid; v_order int:=0; v_option_order int; v_count int:=0; v_incomplete int; begin
 select b.* into v_b from training_batches b where b.public_token=p_public_token;
 if v_b.id is null then raise exception 'INVALID_TOKEN'; end if;
 select be.* into v_be from batch_employees be where be.batch_id=v_b.id and be.employee_id=p_employee_id for update;
 if v_be.id is null then raise exception 'EMPLOYEE_NOT_ASSIGNED'; end if;
 select * into v_active from exam_attempts where batch_employee_id=v_be.id and status='IN_PROGRESS' order by started_at desc limit 1;
 if v_active.id is not null then
   if now()>=v_active.deadline_at then perform submit_attempt(p_public_token,p_employee_id,v_active.id,true); else return public_attempt_payload(v_active.id,false); end if;
 end if;
 if v_b.status<>'OPEN' then raise exception 'BATCH_NOT_OPEN'; end if;
 if v_b.start_at is not null and now()<v_b.start_at then raise exception 'BATCH_NOT_STARTED'; end if;
 if v_b.due_at is not null and now()>v_b.due_at then update batch_employees set current_status='EXPIRED' where id=v_be.id and current_status not in ('PASSED','FAILED','LOCKED'); raise exception 'BATCH_EXPIRED'; end if;
 if v_be.attempts_used>=v_b.max_attempts then raise exception 'MAX_ATTEMPTS'; end if;
 if v_b.stop_on_pass and exists(select 1 from exam_attempts where batch_employee_id=v_be.id and passed) then raise exception 'STOP_ON_PASS'; end if;
 if v_b.require_material_completion then select count(*) into v_incomplete from learning_materials m left join employee_material_progress mp on mp.material_id=m.id and mp.batch_employee_id=v_be.id where m.course_id=v_b.course_id and m.is_active and m.is_required and coalesce(mp.is_completed,false)=false; if v_incomplete>0 then raise exception 'MATERIAL_REQUIRED'; end if; end if;
 v_attempt_no:=v_be.attempts_used+1; insert into exam_attempts(batch_employee_id,attempt_no,started_at,deadline_at) values(v_be.id,v_attempt_no,now(),now()+make_interval(mins=>v_b.time_limit_minutes)) returning id into v_attempt;
 for v_q in select q.* from batch_bank_rules br join questions q on q.bank_id=br.bank_id and q.is_active where br.batch_id=v_b.id order by case when v_b.shuffle_questions then random() else 0 end,q.created_at limit v_b.question_count loop
   v_order:=v_order+1; v_count:=v_count+1; insert into attempt_questions(attempt_id,source_question_id,display_order,question_text_snapshot,explanation_snapshot,points_snapshot) values(v_attempt,v_q.id,v_order,v_q.question_text,v_q.explanation,v_q.default_points) returning id into v_aq; v_option_order:=0;
   for v_o in select o.* from question_options o where o.question_id=v_q.id order by case when v_b.shuffle_options then random() else 0 end,o.sort_order loop v_option_order:=v_option_order+1; insert into attempt_question_options(attempt_question_id,source_option_id,display_order,option_text_snapshot,is_correct_snapshot) values(v_aq,v_o.id,v_option_order,v_o.option_text,v_o.is_correct); end loop;
 end loop;
 if v_count<>v_b.question_count then raise exception 'INSUFFICIENT_QUESTIONS'; end if;
 update batch_employees set attempts_used=v_attempt_no,current_status='IN_PROGRESS',last_attempt_at=now() where id=v_be.id;
 return public_attempt_payload(v_attempt,false);
end $$;

create or replace function save_answer(p_public_token uuid,p_employee_id uuid,p_attempt_id uuid,p_attempt_question_id uuid,p_attempt_option_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_correct boolean; v_points numeric; begin
 select o.is_correct_snapshot,q.points_snapshot into v_correct,v_points from attempt_question_options o join attempt_questions q on q.id=o.attempt_question_id join exam_attempts a on a.id=q.attempt_id join batch_employees be on be.id=a.batch_employee_id join training_batches b on b.id=be.batch_id where b.public_token=p_public_token and be.employee_id=p_employee_id and a.id=p_attempt_id and a.status='IN_PROGRESS' and now()<a.deadline_at and q.id=p_attempt_question_id and o.id=p_attempt_option_id;
 if v_correct is null then raise exception 'INVALID_ANSWER'; end if;
 insert into attempt_answers(attempt_question_id,selected_option_id,is_correct,points_awarded,answered_at) values(p_attempt_question_id,p_attempt_option_id,v_correct,case when v_correct then v_points else 0 end,now()) on conflict(attempt_question_id) do update set selected_option_id=excluded.selected_option_id,is_correct=excluded.is_correct,points_awarded=excluded.points_awarded,answered_at=now();
end $$;

create or replace function get_learner_state(p_public_token uuid,p_employee_id uuid) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare v_b training_batches%rowtype; v_be batch_employees%rowtype; v_materials jsonb; v_active uuid; v_attempts jsonb; v_can boolean:=true; v_reason text; begin
 select b.* into v_b from training_batches b where b.public_token=p_public_token; select be.* into v_be from batch_employees be where be.batch_id=v_b.id and be.employee_id=p_employee_id;
 if v_be.id is null then raise exception 'EMPLOYEE_NOT_ASSIGNED'; end if;
 select id into v_active from exam_attempts where batch_employee_id=v_be.id and status='IN_PROGRESS' order by started_at desc limit 1;
 if v_active is null then if v_b.status<>'OPEN' then v_can:=false; v_reason:='Đợt đào tạo chưa mở hoặc đã đóng.'; elsif v_b.start_at is not null and now()<v_b.start_at then v_can:=false; v_reason:='Đợt đào tạo chưa bắt đầu.'; elsif v_b.due_at is not null and now()>v_b.due_at then v_can:=false; v_reason:='Đợt đào tạo đã hết hạn.'; elsif v_be.attempts_used>=v_b.max_attempts then v_can:=false; v_reason:='Đã hết số lượt làm bài.'; elsif v_b.stop_on_pass and exists(select 1 from exam_attempts where batch_employee_id=v_be.id and passed) then v_can:=false; v_reason:='Đã đạt và bị khóa làm lại.'; end if; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'courseId',m.course_id,'title',m.title,'materialType',m.material_type,'content',m.content,'fileUrl',m.file_url,'isRequired',m.is_required,'estimatedMinutes',m.estimated_minutes,'isActive',m.is_active,'completed',coalesce(mp.is_completed,false)) order by m.sort_order),'[]') into v_materials from learning_materials m left join employee_material_progress mp on mp.material_id=m.id and mp.batch_employee_id=v_be.id where m.course_id=v_b.course_id and m.is_active;
 if v_b.require_material_completion and exists(select 1 from learning_materials m left join employee_material_progress mp on mp.material_id=m.id and mp.batch_employee_id=v_be.id where m.course_id=v_b.course_id and m.is_active and m.is_required and not coalesce(mp.is_completed,false)) and v_active is null then v_can:=false; v_reason:='Bạn cần hoàn thành tài liệu bắt buộc trước.'; end if;
 select coalesce(jsonb_agg(public_attempt_payload(a.id,a.review_unlocked) order by a.attempt_no),'[]') into v_attempts from exam_attempts a where a.batch_employee_id=v_be.id;
 return jsonb_build_object('batch',jsonb_build_object('id',v_b.id,'batchCode',v_b.batch_code,'batchName',v_b.batch_name,'courseId',v_b.course_id,'examId',v_b.exam_id,'publicToken',v_b.public_token,'startAt',v_b.start_at,'dueAt',v_b.due_at,'status',v_b.status,'questionCount',v_b.question_count,'timeLimitMinutes',v_b.time_limit_minutes,'maxAttempts',v_b.max_attempts,'passScore',v_b.pass_score,'shuffleQuestions',v_b.shuffle_questions,'shuffleOptions',v_b.shuffle_options,'stopOnPass',v_b.stop_on_pass,'requireMaterialCompletion',v_b.require_material_completion,'reviewPolicy',v_b.review_policy),'employee',(select jsonb_build_object('id',e.id,'employeeCode',e.employee_code,'fullName',e.full_name,'departmentId',e.department_id,'positionName',e.position_name,'isActive',e.is_active) from employees e where e.id=p_employee_id),'course',(select jsonb_build_object('id',c.id,'courseCode',c.course_code,'courseName',c.course_name,'description',c.description,'version',c.version,'status',c.status) from training_courses c where c.id=v_b.course_id),'materials',v_materials,'attempts',v_attempts,'attemptsUsed',v_be.attempts_used,'attemptsRemaining',greatest(0,v_b.max_attempts-v_be.attempts_used),'bestScore',v_be.best_score,'lastScore',v_be.last_score,'activeAttemptId',v_active,'canStart',v_can or v_active is not null,'reason',v_reason);
end $$;

create or replace function create_batch_from_exam(p_batch_code text,p_batch_name text,p_exam_id uuid,p_start_at timestamptz,p_due_at timestamptz,p_employee_ids uuid[]) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_exam exams%rowtype; v_id uuid; begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if; select * into v_exam from exams where id=p_exam_id; if v_exam.id is null then raise exception 'INVALID_EXAM'; end if;
 insert into training_batches(batch_code,batch_name,course_id,exam_id,start_at,due_at,question_count,time_limit_minutes,max_attempts,pass_score,shuffle_questions,shuffle_options,stop_on_pass,review_policy,require_material_completion) values(p_batch_code,p_batch_name,v_exam.course_id,v_exam.id,p_start_at,p_due_at,v_exam.default_question_count,v_exam.default_time_limit_minutes,v_exam.default_max_attempts,v_exam.default_pass_score,v_exam.shuffle_questions,v_exam.shuffle_options,v_exam.stop_on_pass,v_exam.review_policy,v_exam.require_material_completion) returning id into v_id;
 insert into batch_bank_rules(batch_id,source_exam_bank_rule_id,bank_id,selection_mode,question_count) select v_id,id,bank_id,selection_mode,question_count from exam_bank_rules where exam_id=v_exam.id;
 insert into batch_employees(batch_id,employee_id) select v_id,unnest(coalesce(p_employee_ids,array[]::uuid[])); return v_id;
end $$;

revoke all on function get_public_batch(uuid),search_batch_employees(uuid,text),mark_material_opened(uuid,uuid,uuid),mark_material_completed(uuid,uuid,uuid),submit_attempt(uuid,uuid,uuid,boolean),start_or_resume_attempt(uuid,uuid),save_answer(uuid,uuid,uuid,uuid,uuid),get_learner_state(uuid,uuid) from public;
grant execute on function get_public_batch(uuid),search_batch_employees(uuid,text),mark_material_opened(uuid,uuid,uuid),mark_material_completed(uuid,uuid,uuid),submit_attempt(uuid,uuid,uuid,boolean),start_or_resume_attempt(uuid,uuid),save_answer(uuid,uuid,uuid,uuid,uuid),get_learner_state(uuid,uuid) to anon,authenticated;
revoke all on function create_batch_from_exam(text,text,uuid,timestamptz,timestamptz,uuid[]) from public,anon;
grant execute on function create_batch_from_exam(text,text,uuid,timestamptz,timestamptz,uuid[]) to authenticated;
