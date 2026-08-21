import type { AppData, Employee, Question } from '@/types/domain'

const employees: Employee[] = Array.from({ length: 15 }, (_, index) => ({
  id: `emp-${index + 1}`,
  employeeCode: `NV${String(index + 1).padStart(3, '0')}`,
  fullName: ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Cường', 'Phạm Thu Dung', 'Hoàng Quốc Dũng', 'Vũ Ngọc Hà', 'Đỗ Thành Hưng', 'Bùi Mai Lan', 'Ngô Hải Long', 'Đặng Thu Mai', 'Trịnh Văn Nam', 'Đinh Hồng Nhung', 'Lý Hoàng Phúc', 'Mai Kim Quý', 'Tạ Thanh Sơn'][index],
  departmentId: index % 3 === 0 ? 'dep-ops' : index % 3 === 1 ? 'dep-hr' : 'dep-sales',
  departmentName: index % 3 === 0 ? 'Vận hành' : index % 3 === 1 ? 'Nhân sự' : 'Kinh doanh',
  positionName: index < 3 ? 'Trưởng nhóm' : 'Nhân viên',
  email: `nv${String(index + 1).padStart(3, '0')}@tlp.local`,
  isActive: true,
}))

const questions: Question[] = Array.from({ length: 20 }, (_, index) => {
  const correct = index % 4
  return {
    id: `question-${index + 1}`, bankId: 'bank-safety', questionCode: `AT${String(index + 1).padStart(3, '0')}`,
    questionText: [
      'Thiết bị bảo hộ cá nhân cần được kiểm tra khi nào?', 'Khi phát hiện nguy cơ mất an toàn, hành động đầu tiên là gì?',
      'Lối thoát hiểm phải được duy trì như thế nào?', 'Ai có trách nhiệm tuân thủ quy định an toàn?',
      'Biển báo màu đỏ thường thể hiện nội dung nào?'
    ][index % 5] + ` (Câu ${index + 1})`,
    explanation: 'Tuân thủ hướng dẫn an toàn và báo cáo ngay cho người phụ trách giúp giảm thiểu rủi ro.', defaultPoints: 1, isActive: true,
    options: ['Trước mỗi ca làm việc', 'Chỉ khi có kiểm tra', 'Khi thiết bị đã hỏng', 'Không cần kiểm tra'].map((text, optionIndex) => ({ id: `option-${index + 1}-${optionIndex + 1}`, optionCode: String.fromCharCode(65 + optionIndex), optionText: text, isCorrect: optionIndex === correct, sortOrder: optionIndex + 1 })),
  }
})

export const initialDemoData: AppData = {
  departments: [
    { id: 'dep-ops', departmentCode: 'OPS', departmentName: 'Vận hành', isActive: true },
    { id: 'dep-hr', departmentCode: 'HR', departmentName: 'Nhân sự', isActive: true },
    { id: 'dep-sales', departmentCode: 'SALES', departmentName: 'Kinh doanh', isActive: true },
  ],
  employees,
  courses: [
    { id: 'course-safety', courseCode: 'SAFE-001', courseName: 'An toàn lao động cơ bản', description: 'Quy định và hành vi an toàn bắt buộc tại nơi làm việc.', version: '1.0', status: 'ACTIVE' },
    { id: 'course-security', courseCode: 'SEC-001', courseName: 'An toàn thông tin', description: 'Nhận diện rủi ro và bảo vệ dữ liệu nội bộ.', version: '1.0', status: 'DRAFT' },
  ],
  materials: [{ id: 'material-safety', courseId: 'course-safety', title: 'Quy tắc an toàn trước khi làm việc', materialType: 'TEXT', content: 'Luôn kiểm tra khu vực làm việc, sử dụng đúng thiết bị bảo hộ cá nhân, giữ lối thoát hiểm thông thoáng và báo cáo ngay mọi nguy cơ. Không vận hành thiết bị khi chưa được hướng dẫn. Khi xảy ra sự cố, dừng công việc, cảnh báo người xung quanh và liên hệ người phụ trách.', isRequired: true, estimatedMinutes: 5, isActive: true }],
  banks: [{ id: 'bank-safety', bankCode: 'BANK-SAFE-001', bankName: 'Ngân hàng An toàn lao động', courseId: 'course-safety', description: 'Câu hỏi kiểm tra nhận thức an toàn cơ bản.', isActive: true, questions }],
  exams: [{ id: 'exam-safety', examCode: 'EXAM-SAFE-001', courseId: 'course-safety', bankId: 'bank-safety', examName: 'Kiểm tra An toàn lao động', instructions: 'Chọn một đáp án đúng cho mỗi câu.', selectionMode: 'RANDOM', questionCount: 10, timeLimitMinutes: 10, maxAttempts: 3, passScore: 80, shuffleQuestions: true, shuffleOptions: true, stopOnPass: true, requireMaterialCompletion: true, reviewPolicy: 'AFTER_FINAL_LOCK', status: 'ACTIVE' }],
  batches: [{ id: 'batch-safety', batchCode: 'DT-AT-2026', batchName: 'Đào tạo An toàn lao động 2026', courseId: 'course-safety', examId: 'exam-safety', publicToken: 'demo-an-toan', startAt: '2026-01-01T00:00:00.000Z', dueAt: '2027-12-31T23:59:59.000Z', status: 'OPEN', questionCount: 10, timeLimitMinutes: 10, maxAttempts: 3, passScore: 80, shuffleQuestions: true, shuffleOptions: true, stopOnPass: true, requireMaterialCompletion: true, reviewPolicy: 'AFTER_FINAL_LOCK', employeeIds: employees.map((employee) => employee.id), learnerStates: employees.map((employee) => ({ employeeId: employee.id, currentStatus: 'NOT_STARTED', attemptsUsed: 0, bestScore: null, lastScore: null, lastAttemptAt: null, completedAt: null })) }],
  attempts: [], importJobs: [], materialProgress: {},
}
