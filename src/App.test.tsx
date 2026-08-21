import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { loadAdminData } from '@/data/admin-service'

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({ authenticated: false, loading: false, passwordRecovery: false }),
}))

vi.mock('@/data/admin-service', () => ({
  loadAdminData: vi.fn(),
  archiveEntity: vi.fn(),
  persistEntity: vi.fn(),
  persistQuestionImport: vi.fn(),
}))

vi.mock('@/pages/learner/LearnerPage', () => ({
  default: () => <div>Cổng đào tạo người học</div>,
}))

describe('route data boundaries', () => {
  beforeEach(() => vi.clearAllMocks())

  it('does not load authenticated admin tables on a public learner route', async () => {
    render(
      <MemoryRouter initialEntries={['/training/public-token']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Cổng đào tạo người học')).toBeInTheDocument()
    expect(loadAdminData).not.toHaveBeenCalled()
  })
})
