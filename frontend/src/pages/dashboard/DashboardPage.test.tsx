import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import type { DashboardSummary } from '@/api/dashboard'
import { InspectionStatus, Priority } from '@/types/domain'

const getSummary = vi.fn()

vi.mock('@/api/dashboard', () => ({
  dashboardApi: {
    getSummary: (...args: unknown[]) => getSummary(...args),
  },
}))

vi.mock('@/hooks/useReviewCount', () => ({
  useReviewCount: () => 2,
}))

vi.mock('@/theme', () => ({
  useTheme: () => ({ theme: 'claro', setTheme: vi.fn(), effectiveTheme: 'light' }),
}))

const sessionSnapshot = { status: 'authenticated', user: { name: 'Marina Supervisora' } }
vi.mock('@/auth/session', () => ({
  authSession: {
    subscribe: () => () => {},
    // useSyncExternalStore requires a stable reference between calls.
    snapshot: () => sessionSnapshot,
  },
}))

function buildSummary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  const byStatus = {} as DashboardSummary['byStatus']
  for (const status of Object.values(InspectionStatus)) byStatus[status] = 0
  const byCriticality = {} as DashboardSummary['byCriticality']
  for (const priority of Object.values(Priority)) byCriticality[priority] = 0
  return {
    byStatus: { ...byStatus, [InspectionStatus.ASSIGNED]: 3, [InspectionStatus.APPROVED]: 5, ...overrides.byStatus },
    byCriticality: { ...byCriticality, [Priority.HIGH]: 2, ...overrides.byCriticality },
    openNonConformities: overrides.openNonConformities ?? 4,
    overdue: overrides.overdue ?? 6,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

afterEach(cleanup)
beforeEach(() => {
  getSummary.mockReset()
})

describe('DashboardPage', () => {
  it('renders summary cards and the criticality chart section from the loaded summary', async () => {
    getSummary.mockResolvedValue(buildSummary())
    renderPage()

    // Total = sum of byStatus values (3 + 5 = 8)
    expect(await screen.findByText('8')).not.toBeNull()
    expect(screen.getByText('Inspeções atrasadas')).not.toBeNull()
    expect(screen.getByText('6')).not.toBeNull()
    expect(screen.getByText('NCs abertas')).not.toBeNull()
    expect(screen.getByText('4')).not.toBeNull()
    expect(screen.getByText('Não conformidades por criticidade')).not.toBeNull()
  })

  it('shows a loading state while the summary request is in flight', () => {
    getSummary.mockReturnValue(new Promise(() => {}))
    renderPage()

    expect(screen.getByRole('status')).not.toBeNull()
  })

  it('shows an error state with a working retry', async () => {
    getSummary.mockRejectedValueOnce(new Error('boom'))
    renderPage()

    expect(await screen.findByRole('alert')).not.toBeNull()
    const retry = screen.getByRole('button', { name: 'Tentar novamente' })

    getSummary.mockResolvedValueOnce(buildSummary())
    await userEvent.click(retry)

    expect(await screen.findByText('8')).not.toBeNull()
    expect(getSummary).toHaveBeenCalledTimes(2)
  })

  it('re-calls getSummary with the applied period and client filters', async () => {
    getSummary.mockResolvedValue(buildSummary())
    renderPage()
    await screen.findByText('8')

    await userEvent.type(screen.getByLabelText('Data inicial'), '2024-01-01')
    await userEvent.type(screen.getByLabelText('Data final'), '2024-01-31')
    await userEvent.type(screen.getByLabelText('Cliente'), 'Cliente A')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() =>
      expect(getSummary).toHaveBeenLastCalledWith({
        from: '2024-01-01',
        to: '2024-01-31',
        client: 'Cliente A',
      }),
    )
  })

  it('blocks the request and shows a field error when the start date is after the end date', async () => {
    getSummary.mockResolvedValue(buildSummary())
    renderPage()
    await screen.findByText('8')
    getSummary.mockClear()

    await userEvent.type(screen.getByLabelText('Data inicial'), '2024-02-10')
    await userEvent.type(screen.getByLabelText('Data final'), '2024-01-01')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    expect(await screen.findByText('A data inicial não pode ser posterior à data final.')).not.toBeNull()
    expect(getSummary).not.toHaveBeenCalled()
  })
})
