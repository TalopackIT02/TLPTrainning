import { expect, type Page, test } from '@playwright/test'
async function enterLearner(page: Page) {
  await page.goto('/#/training/demo-an-toan')
  await page.getByPlaceholder('Tìm theo mã hoặc họ tên').fill('NV001')
  await page.getByText('NV001 — Nguyễn Văn An', { exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục' }).click()
  const complete = page.getByRole('button', { name: 'Đánh dấu đã đọc' })
  if (await complete.isVisible()) await complete.click()
  await page.getByRole('button', { name: 'Bắt đầu kiểm tra' }).click()
  await expect(page.getByText('Thời gian còn lại')).toBeVisible()
}
async function submitWithoutAnswers(page: Page) {
  for (let index = 0; index < 9; index++) await page.getByRole('button', { name: 'Tiếp' }).click()
  await page.getByRole('button', { name: 'Nộp bài' }).click()
  await page.getByRole('button', { name: 'Xác nhận nộp' }).click()
}
async function answerCorrectlyAndSubmit(page: Page) {
  const correctText = ['Trước mỗi ca làm việc', 'Chỉ khi có kiểm tra', 'Khi thiết bị đã hỏng', 'Không cần kiểm tra']
  for (let index = 0; index < 10; index++) {
    const heading = await page.locator('h3').filter({ hasText: /\(Câu \d+\)/ }).textContent()
    const sourceNumber = Number(heading?.match(/\(Câu (\d+)\)/)?.[1])
    await page.getByText(correctText[(sourceNumber - 1) % 4], { exact: true }).click()
    if (index < 9) await page.getByRole('button', { name: 'Tiếp' }).click()
  }
  await page.getByRole('button', { name: 'Nộp bài' }).click()
  await page.getByRole('button', { name: 'Xác nhận nộp' }).click()
}
test('learner fail, protected review, retry, pass and stop_on_pass lock', async ({ page }) => {
  await enterLearner(page)
  await submitWithoutAnswers(page)
  await expect(page.getByRole('heading', { name: 'CHƯA ĐẠT' })).toBeVisible()
  await expect(page.getByText(/Đáp án đúng chưa được mở/)).toBeVisible()
  await expect(page.getByText('Đáp án đúng:', { exact: false })).toHaveCount(0)
  await page.getByRole('button', { name: 'Làm lại' }).click()
  await answerCorrectlyAndSubmit(page)
  await expect(page.getByRole('heading', { name: 'ĐẠT' })).toBeVisible()
  await expect(page.getByText('100 điểm')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Làm lại' })).toHaveCount(0)
  await expect(page.getByText('Xem lại đáp án')).toBeVisible()
})
test('refresh resumes the same attempt and persisted timer', async ({ page }) => {
  await enterLearner(page)
  const before = await page.locator('.tabular-nums').textContent()
  await page.waitForTimeout(1200)
  await page.reload()
  await expect(page.getByText('Thời gian còn lại')).toBeVisible()
  await expect(page.getByText('Câu 1 / 10')).toBeVisible()
  const after = await page.locator('.tabular-nums').textContent()
  expect(after).not.toBe(before)
  expect(after && before).toBeTruthy()
})
