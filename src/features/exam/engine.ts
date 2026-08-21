import type { AttemptQuestion, ReviewPolicy } from '@/types/domain'

export interface StartRules { attemptsUsed: number; maxAttempts: number; alreadyPassed: boolean; stopOnPass: boolean; materialComplete: boolean; requireMaterialCompletion: boolean; batchStatus: 'DRAFT' | 'OPEN' | 'CLOSED'; now: number; startAt?: number | null; dueAt?: number | null }

export function canStartAttempt(rules: StartRules): { allowed: boolean; reason: string | null } {
  if (rules.batchStatus !== 'OPEN') return { allowed: false, reason: 'Đợt đào tạo chưa mở hoặc đã đóng.' }
  if (rules.startAt && rules.now < rules.startAt) return { allowed: false, reason: 'Đợt đào tạo chưa đến thời gian bắt đầu.' }
  if (rules.dueAt && rules.now > rules.dueAt) return { allowed: false, reason: 'Đợt đào tạo đã hết hạn.' }
  if (rules.requireMaterialCompletion && !rules.materialComplete) return { allowed: false, reason: 'Bạn cần hoàn thành tài liệu bắt buộc trước.' }
  if (rules.stopOnPass && rules.alreadyPassed) return { allowed: false, reason: 'Bạn đã đạt và không cần làm lại.' }
  if (rules.attemptsUsed >= rules.maxAttempts) return { allowed: false, reason: 'Bạn đã sử dụng hết số lượt làm bài.' }
  return { allowed: true, reason: null }
}

export function calculateScore(questions: AttemptQuestion[]) {
  let rawScore = 0
  let maxScore = 0
  for (const question of questions) {
    maxScore += question.points
    const selected = question.options.find((option) => option.id === question.selectedOptionId)
    if (selected?.isCorrect) rawScore += question.points
  }
  return { rawScore, maxScore, scorePercent: maxScore === 0 ? 0 : Math.round((rawScore / maxScore) * 10000) / 100 }
}

export function isPassed(scorePercent: number, passScore: number) { return scorePercent >= passScore }
export function remainingSeconds(deadlineAt: string, now = Date.now()) { return Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - now) / 1000)) }
export function shouldUnlockReview(policy: ReviewPolicy, passed: boolean, stopOnPass: boolean, attemptsUsed: number, maxAttempts: number, processLocked = false) {
  if (policy === 'AFTER_EACH_SUBMISSION') return true
  return processLocked || attemptsUsed >= maxAttempts || (passed && stopOnPass)
}
