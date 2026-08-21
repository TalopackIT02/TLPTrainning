import { expect, test } from '@playwright/test'

test('admin requires a configured Supabase connection', async ({ page }) => {
  await page.goto('/#/admin/login')
  await expect(page.getByRole('heading', { name: 'TLP Training' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Hệ thống chưa được kết nối Supabase')
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeDisabled()
})
