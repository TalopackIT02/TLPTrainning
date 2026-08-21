import { expect, test } from '@playwright/test'

test('admin requires a configured Supabase connection', async ({ page }) => {
  await page.goto('/#/admin/login')
  await expect(page.getByRole('heading', { name: 'TLP Training' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Hệ thống chưa được kết nối Supabase')
  await expect(page.getByLabel('Mật khẩu')).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Quên / đổi mật khẩu' })).toBeDisabled()
})
