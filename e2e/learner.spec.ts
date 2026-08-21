import { expect, test } from '@playwright/test'

test('learner route does not fall back to local data', async ({ page }) => {
  await page.goto('/#/training/invalid-token')
  await expect(page.getByText('Supabase chưa cấu hình.')).toBeVisible()
  await expect(page.getByText('Chọn nhân viên')).toHaveCount(0)
})
