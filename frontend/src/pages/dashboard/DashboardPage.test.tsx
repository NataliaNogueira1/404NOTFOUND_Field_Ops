import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { DashboardFilters, DashboardSummary } from '@/api/dashboard'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ThemeProvider } from '@/theme/ThemeProvider'

const getSummary = vi.hoisted(() => vi.fn())

vi.mock('@/api/dashboard', () => ({
  dashboardApi: { getSummary },
}))

function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    byStatus: { APPROVED: 3, IN_PROGRESS: 2 },
    byCriticality: { HIGH: 1 },
    openNonConformities: 0,
    overdue: 1,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </ThemeProvider>,
  )
}

function lastFilters(): DashboardFilters | undefined {
  return getSummary.mock.calls.at(-1)?.[0] as DashboardFilters | undefined
}

describe('DashboardPage filters', () => {
  beforeEach(() => {
    // jsdom doesn't implement matchMedia, which ThemeProvider reads on mount.
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('loads the summary without filters and shows indicators on initial render', async () => {
    getSummary.mockResolvedValue(summary())

    renderPage()

    expect(await screen.findByText('Total de inspeções')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument())
    expect(getSummary.mock.calls[0][0]).toEqual({})
  })

  it('shows the error banner and reloads when retrying', async () => {
    getSummary.mockRejectedValueOnce(new Error('offline'))
    getSummary.mockResolvedValueOnce(summary())

    renderPage()

    await screen.findByText(/Não foi possível carregar os indicadores/)

    await userEvent.click(
      screen.getByRole('button', { name: /tente novamente/i }),
    )

    await waitFor(() => expect(getSummary).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('5')).toBeInTheDocument()
  })

  it('shows the empty state when there are no inspections', async () => {
    getSummary.mockResolvedValue(
      summary({ byStatus: {}, byCriticality: {} }),
    )

    renderPage()

    expect(
      await screen.findByText('Nenhuma inspeção registrada ainda.'),
    ).toBeInTheDocument()
  })

  it('applies period and client filters with the correct arguments', async () => {
    getSummary.mockResolvedValue(summary())

    renderPage()

    await screen.findByText('Total de inspeções')

    await userEvent.type(screen.getByLabelText('De'), '2026-01-01')
    await userEvent.type(screen.getByLabelText('Até'), '2026-01-31')
    await userEvent.type(screen.getByLabelText('Cliente'), 'Atlas')
    await userEvent.click(
      screen.getByRole('button', { name: 'Aplicar filtros' }),
    )

    await waitFor(() =>
      expect(lastFilters()).toEqual({
        from: '2026-01-01',
        to: '2026-01-31',
        clientName: 'Atlas',
      }),
    )
  })

  it('blocks the query and shows an accessible error when from is after to', async () => {
    getSummary.mockResolvedValue(summary())

    renderPage()

    await screen.findByText('Total de inspeções')
    expect(getSummary).toHaveBeenCalledTimes(1)

    await userEvent.type(screen.getByLabelText('De'), '2026-02-10')
    await userEvent.type(screen.getByLabelText('Até'), '2026-01-01')
    await userEvent.click(
      screen.getByRole('button', { name: 'Aplicar filtros' }),
    )

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'A data inicial não pode ser maior que a data final.',
    )
    expect(getSummary).toHaveBeenCalledTimes(1)
  })

  it('clears the filters and reloads without arguments', async () => {
    getSummary.mockResolvedValue(summary())

    renderPage()

    await screen.findByText('Total de inspeções')

    await userEvent.type(screen.getByLabelText('De'), '2026-01-01')
    await userEvent.type(screen.getByLabelText('Até'), '2026-01-31')
    await userEvent.type(screen.getByLabelText('Cliente'), 'Atlas')
    await userEvent.click(
      screen.getByRole('button', { name: 'Aplicar filtros' }),
    )

    await waitFor(() =>
      expect(lastFilters()).toEqual({
        from: '2026-01-01',
        to: '2026-01-31',
        clientName: 'Atlas',
      }),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Limpar' }))

    expect(screen.getByLabelText('De')).toHaveValue('')
    expect(screen.getByLabelText('Até')).toHaveValue('')
    expect(screen.getByLabelText('Cliente')).toHaveValue('')
    await waitFor(() => expect(lastFilters()).toEqual({}))
  })
})
