// @vitest-environment node
import { calculateScore, canStartAttempt, isPassed, remainingSeconds, shouldUnlockReview } from './engine'

const questions = [
  { id: 'q1', displayOrder: 1, text: 'Q1', points: 1, selectedOptionId: 'a', options: [{ id: 'a', displayOrder: 1, text: 'A', isCorrect: true }] },
  { id: 'q2', displayOrder: 2, text: 'Q2', points: 2, selectedOptionId: 'b', options: [{ id: 'b', displayOrder: 1, text: 'B', isCorrect: false }] },
]

describe('exam engine', () => {
  it('calculates server-equivalent score and pass/fail', () => { expect(calculateScore(questions)).toEqual({ rawScore: 1, maxScore: 3, scorePercent: 33.33 }); expect(isPassed(80, 80)).toBe(true) })
  it('enforces attempts, material and stop_on_pass', () => {
    const base = { attemptsUsed: 0, maxAttempts: 3, alreadyPassed: false, stopOnPass: true, materialComplete: true, requireMaterialCompletion: true, batchStatus: 'OPEN' as const, now: 100 }
    expect(canStartAttempt(base).allowed).toBe(true)
    expect(canStartAttempt({ ...base, attemptsUsed: 3 }).allowed).toBe(false)
    expect(canStartAttempt({ ...base, materialComplete: false }).reason).toMatch(/tài liệu/)
    expect(canStartAttempt({ ...base, alreadyPassed: true }).allowed).toBe(false)
  })
  it('does not reset persisted timer', () => { expect(remainingSeconds(new Date(10_000).toISOString(), 4_000)).toBe(6); expect(remainingSeconds(new Date(1_000).toISOString(), 4_000)).toBe(0) })
  it('protects review policy until final lock', () => { expect(shouldUnlockReview('AFTER_FINAL_LOCK', false, true, 1, 3)).toBe(false); expect(shouldUnlockReview('AFTER_FINAL_LOCK', false, true, 3, 3)).toBe(true); expect(shouldUnlockReview('AFTER_EACH_SUBMISSION', false, true, 1, 3)).toBe(true) })
})
