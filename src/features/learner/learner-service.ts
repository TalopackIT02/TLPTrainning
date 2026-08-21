import { supabase } from '@/lib/supabase'
import type { Attempt, Employee, LearnerState, PublicBatchSummary } from '@/types/domain'

async function rpc<T>(name: string, args: Record<string, unknown>) { if (!supabase) throw new Error('Supabase chưa cấu hình.'); const { data, error } = await supabase.rpc(name, args); if (error) throw error; return data as T }
export const learnerService = {
  async getPublicBatch(publicToken: string): Promise<PublicBatchSummary> {
    return rpc('get_public_batch', { p_public_token: publicToken })
  },
  async searchEmployees(publicToken: string, query: string): Promise<Employee[]> {
    return rpc('search_batch_employees', { p_public_token: publicToken, p_query: query })
  },
  async getState(publicToken: string, employeeId: string): Promise<LearnerState> {
    return rpc('get_learner_state', { p_public_token: publicToken, p_employee_id: employeeId })
  },
  async markMaterialComplete(publicToken: string, employeeId: string, materialId: string) {
    await rpc('mark_material_completed', { p_public_token: publicToken, p_employee_id: employeeId, p_material_id: materialId })
  },
  async startOrResume(publicToken: string, employeeId: string): Promise<Attempt> {
    return rpc('start_or_resume_attempt', { p_public_token: publicToken, p_employee_id: employeeId })
  },
  async saveAnswer(publicToken: string, employeeId: string, attemptId: string, questionId: string, optionId: string) {
    await rpc('save_answer', { p_public_token: publicToken, p_employee_id: employeeId, p_attempt_id: attemptId, p_attempt_question_id: questionId, p_attempt_option_id: optionId })
  },
  async submitAttempt(publicToken: string, employeeId: string, attemptId: string, autoSubmitted = false): Promise<Attempt> {
    return rpc('submit_attempt', { p_public_token: publicToken, p_employee_id: employeeId, p_attempt_id: attemptId, p_auto_submitted: autoSubmitted })
  },
}
