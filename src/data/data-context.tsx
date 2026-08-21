import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { initialDemoData } from './demo-data'
import { isSupabaseConfigured } from '@/lib/supabase'
import { archiveEntity, loadAdminData, persistEntity, persistQuestionImport } from './admin-service'
import type { AppData, Course, Department, Employee, Exam, ImportJob, Material, Question, QuestionBank, TrainingBatch } from '@/types/domain'

const STORAGE_KEY = 'tlp-training-demo-v1'
type Collection = 'departments' | 'employees' | 'courses' | 'materials' | 'banks' | 'exams' | 'batches'
type Entity = Department | Employee | Course | Material | QuestionBank | Exam | TrainingBatch
interface DataContextValue { data: AppData; loading: boolean; error: string | null; demoMode: boolean; resetDemo: () => void; upsert: (collection: Collection, entity: Entity) => Promise<void>; archive: (collection: Collection, id: string) => Promise<void>; importQuestions: (bankId: string, questions: Question[], job: ImportJob) => Promise<void> }
const DataContext = createContext<DataContextValue | null>(null)

function readDemo() {
  try { const value = localStorage.getItem(STORAGE_KEY); return value ? JSON.parse(value) as AppData : structuredClone(initialDemoData) } catch { return structuredClone(initialDemoData) }
}
function writeDemo(data: AppData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => readDemo())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reloadLive = useCallback(async () => { if (!isSupabaseConfigured) return; setLoading(true); setError(null); try { setData(await loadAdminData()) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu Supabase.') } finally { setLoading(false) } }, [])
  useEffect(() => { void reloadLive() }, [reloadLive])

  const update = useCallback((recipe: (current: AppData) => AppData) => { setData((current) => { const next = recipe(current); if (!isSupabaseConfigured) writeDemo(next); return next }) }, [])
  const upsert = useCallback(async (collection: Collection, entity: Entity) => { if (isSupabaseConfigured) { await persistEntity(collection, entity); await reloadLive(); return } update((current) => ({ ...current, [collection]: [...(current[collection] as Entity[]).filter((item) => item.id !== entity.id), entity] })) }, [reloadLive, update])
  const archive = useCallback(async (collection: Collection, id: string) => { if (isSupabaseConfigured) { await archiveEntity(collection, id); await reloadLive(); return } update((current) => ({ ...current, [collection]: (current[collection] as Entity[]).map((item) => item.id === id ? ('isActive' in item ? { ...item, isActive: false } : 'status' in item ? { ...item, status: 'ARCHIVED' } : item) : item) })) }, [reloadLive, update])
  const importQuestions = useCallback(async (bankId: string, questions: Question[], job: ImportJob) => { if (isSupabaseConfigured) { await persistQuestionImport(bankId, job.fileName, questions); await reloadLive(); return } update((current) => ({ ...current, banks: current.banks.map((bank) => bank.id === bankId ? { ...bank, questions: [...bank.questions, ...questions] } : bank), importJobs: [job, ...current.importJobs] })) }, [reloadLive, update])
  const resetDemo = useCallback(() => { const next = structuredClone(initialDemoData); writeDemo(next); setData(next) }, [])
  const value = useMemo(() => ({ data, loading, error, demoMode: !isSupabaseConfigured, resetDemo, upsert, archive, importQuestions }), [data, loading, error, resetDemo, upsert, archive, importQuestions])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
export function useData() { const value = useContext(DataContext); if (!value) throw new Error('useData must be inside DataProvider'); return value }
