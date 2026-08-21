import Papa from 'papaparse'
import { z } from 'zod'
export const CSV_HEADERS = ['question_code', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'explanation'] as const
const rowSchema = z.object({ question_code: z.string().trim().min(1, 'Thiếu mã câu hỏi'), question_text: z.string().trim().min(1, 'Thiếu nội dung câu hỏi'), option_a: z.string().trim().min(1, 'Thiếu đáp án A'), option_b: z.string().trim().min(1, 'Thiếu đáp án B'), option_c: z.string().trim().min(1, 'Thiếu đáp án C'), option_d: z.string().trim().min(1, 'Thiếu đáp án D'), correct_option: z.string().trim().toUpperCase().pipe(z.enum(['A', 'B', 'C', 'D'])), explanation: z.string().trim().default('') })
export type QuestionCsvRow = z.infer<typeof rowSchema>
export interface CsvPreviewRow { rowNumber: number; data: Record<string, string>; value?: QuestionCsvRow; errors: string[] }
export interface CsvPreview { rows: CsvPreviewRow[]; missingHeaders: string[]; total: number; valid: number; invalid: number }
export function parseQuestionCsv(csv: string): CsvPreview {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: (header) => header.trim().toLowerCase() })
  const fields = parsed.meta.fields ?? []
  const missingHeaders = CSV_HEADERS.filter((header) => !fields.includes(header))
  const rows = parsed.data.map((data, index) => {
    const result = rowSchema.safeParse(data)
    return { rowNumber: index + 2, data, value: result.success ? result.data : undefined, errors: result.success ? [] : result.error.issues.map((issue) => issue.message) }
  })
  return { rows, missingHeaders, total: rows.length, valid: rows.filter((row) => row.errors.length === 0).length, invalid: rows.filter((row) => row.errors.length > 0).length }
}
