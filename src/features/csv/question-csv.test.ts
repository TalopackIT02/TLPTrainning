// @vitest-environment node
import { parseQuestionCsv } from './question-csv'
describe('question CSV', () => {
  it('previews valid and invalid rows without importing blindly', () => {
    const csv = 'question_code,question_text,option_a,option_b,option_c,option_d,correct_option,explanation\nQ1,Câu?,A,B,C,D,A,OK\nQ2,,A,B,C,D,X,'
    const result = parseQuestionCsv(csv)
    expect(result).toMatchObject({ total: 2, valid: 1, invalid: 1, missingHeaders: [] })
    expect(result.rows[1].errors.length).toBeGreaterThan(0)
  })
})
