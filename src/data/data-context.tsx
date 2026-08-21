import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { archiveEntity, loadAdminData, persistEntity, persistQuestionImport } from './admin-service'
import type { AppData, Course, Department, Employee, Exam, ImportJob, Material, Question, QuestionBank, TrainingBatch } from '@/types/domain'

type Collection = 'departments' | 'employees' | 'courses' | 'materials' | 'banks' | 'exams' | 'batches'
type Entity = Department | Employee | Course | Material | QuestionBank | Exam | TrainingBatch
interface DataContextValue { data: AppData; loading: boolean; error: string | null; upsert: (collection: Collection, entity: Entity) => Promise<void>; archive: (collection: Collection, id: string) => Promise<void>; importQuestions: (bankId: string, questions: Question[], job: ImportJob) => Promise<void> }
const DataContext = createContext<DataContextValue | null>(null)
const emptyData: AppData = { departments: [], employees: [], courses: [], materials: [], banks: [], exams: [], batches: [], attempts: [], importJobs: [], materialProgress: {} }
const configurationError = 'Supabase chưa được cấu hình. Hãy thiết lập VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.'

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(isSupabaseConfigured ? null : configurationError)
  const reloadLive = useCallback(async () => { if (!isSupabaseConfigured) { setData(emptyData); setError(configurationError); return } setLoading(true); setError(null); try { setData(await loadAdminData()) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu Supabase.') } finally { setLoading(false) } }, [])
  useEffect(() => { void reloadLive() }, [reloadLive])

  const requireConfiguration = useCallback(() => { if (!isSupabaseConfigured) throw new Error(configurationError) }, [])
  const upsert = useCallback(async (collection: Collection, entity: Entity) => { requireConfiguration(); await persistEntity(collection, entity); await reloadLive() }, [reloadLive, requireConfiguration])
  const archive = useCallback(async (collection: Collection, id: string) => { requireConfiguration(); await archiveEntity(collection, id); await reloadLive() }, [reloadLive, requireConfiguration])
  const importQuestions = useCallback(async (bankId: string, questions: Question[], job: ImportJob) => { requireConfiguration(); await persistQuestionImport(bankId, job.fileName, questions); await reloadLive() }, [reloadLive, requireConfiguration])
  const value = useMemo(() => ({ data, loading, error, upsert, archive, importQuestions }), [data, loading, error, upsert, archive, importQuestions])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
export function useData() { const value = useContext(DataContext); if (!value) throw new Error('useData must be inside DataProvider'); return value }
