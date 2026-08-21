export type Id = string
export type BatchStatus = 'DRAFT' | 'OPEN' | 'CLOSED'
export type LearnerStatus = 'NOT_STARTED' | 'READING' | 'READY_FOR_EXAM' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'EXPIRED' | 'LOCKED'
export type ReviewPolicy = 'AFTER_EACH_SUBMISSION' | 'AFTER_FINAL_LOCK'
export type SelectionMode = 'RANDOM' | 'ALL'

export interface Department { id: Id; departmentCode: string; departmentName: string; isActive: boolean }
export interface Employee { id: Id; employeeCode: string; fullName: string; departmentId: Id | null; departmentName?: string; positionName: string; email?: string; isActive: boolean }
export interface Course { id: Id; courseCode: string; courseName: string; description: string; version: string; status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }
export interface Material { id: Id; courseId: Id; title: string; materialType: 'TEXT' | 'LINK' | 'FILE'; content: string; fileUrl?: string; isRequired: boolean; estimatedMinutes: number; isActive: boolean }
export interface QuestionOption { id: Id; optionCode: string; optionText: string; isCorrect: boolean; sortOrder: number }
export interface Question { id: Id; bankId: Id; questionCode: string; questionText: string; explanation: string; defaultPoints: number; isActive: boolean; options: QuestionOption[] }
export interface QuestionBank { id: Id; bankCode: string; bankName: string; courseId: Id | null; description: string; isActive: boolean; questions: Question[] }
export interface Exam { id: Id; examCode: string; courseId: Id; bankId: Id; examName: string; instructions: string; selectionMode: SelectionMode; questionCount: number; timeLimitMinutes: number; maxAttempts: number; passScore: number; shuffleQuestions: boolean; shuffleOptions: boolean; stopOnPass: boolean; requireMaterialCompletion: boolean; reviewPolicy: ReviewPolicy; status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }
export interface BatchEmployee { employeeId: Id; currentStatus: LearnerStatus; attemptsUsed: number; bestScore: number | null; lastScore: number | null; lastAttemptAt: string | null; completedAt: string | null }
export interface TrainingBatch { id: Id; batchCode: string; batchName: string; courseId: Id; examId: Id; publicToken: string; startAt: string | null; dueAt: string | null; status: BatchStatus; questionCount: number; timeLimitMinutes: number; maxAttempts: number; passScore: number; shuffleQuestions: boolean; shuffleOptions: boolean; stopOnPass: boolean; requireMaterialCompletion: boolean; reviewPolicy: ReviewPolicy; employeeIds: Id[]; learnerStates: BatchEmployee[] }
export interface AttemptOption { id: Id; displayOrder: number; text: string; isCorrect?: boolean }
export interface AttemptQuestion { id: Id; displayOrder: number; text: string; explanation?: string; points: number; options: AttemptOption[]; selectedOptionId?: Id }
export interface Attempt { id: Id; employeeId: Id; batchId: Id; attemptNo: number; startedAt: string; deadlineAt: string; submittedAt: string | null; durationSeconds: number | null; status: 'IN_PROGRESS' | 'SUBMITTED'; scorePercent: number | null; passed: boolean | null; autoSubmitted: boolean; reviewUnlocked: boolean; questions: AttemptQuestion[] }
export interface AppData { departments: Department[]; employees: Employee[]; courses: Course[]; materials: Material[]; banks: QuestionBank[]; exams: Exam[]; batches: TrainingBatch[]; attempts: Attempt[]; importJobs: ImportJob[]; materialProgress: Record<string, Id[]> }
export interface ImportJob { id: Id; fileName: string; status: 'COMPLETED' | 'FAILED'; totalRows: number; successRows: number; failedRows: number; createdAt: string }

export interface PublicBatchSummary { batchId: Id; batchName: string; courseName: string; startAt: string | null; dueAt: string | null; status: BatchStatus }
export interface LearnerState { batch: TrainingBatch; employee: Employee; course: Course; materials: Array<Material & { completed: boolean }>; attempts: Attempt[]; attemptsUsed: number; attemptsRemaining: number; bestScore: number | null; lastScore: number | null; activeAttemptId: Id | null; canStart: boolean; reason: string | null }
