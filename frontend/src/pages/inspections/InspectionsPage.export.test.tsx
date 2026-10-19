import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InspectionsPage } from '@/pages/inspections/InspectionsPage'
import { UserRole } from '@/types/domain'
import type { AuthState } from '@/auth/session'

const exportCsv =
  vi.fn<(filters: { status: string; from: string; to: string; clientId?: number }) => Promise<void>>(() =>
    Promise.resolve(),
  )

vi.mock('@/api/adminCatalog', () => ({
  adminCatalogApi: {
    // Lazily reference the hoisted mock so the vi.mock factory (hoisted above
    // this const) does not read exportCsv during its temporal dead zone.
    exportCsv: (filters: { status: string; from: string; to: string; clientId?: number }) => exportCsv(filters),
    listInspections: vi.fn(() =>
      Promise.resolve({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 10, first: true, last: true }),
    ),
    cancelInspection: vi.fn(),
  },
}))

vi.mock('@/api/clients', () => ({
  ClientStatus: { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' },
  clientsApi: {
    list: vi.fn(() =>
      Promise.resolve({
        content: [
          { id: '7', name: 'Cliente A', legalName: '', document: '', email: '', phone: '', status: 'ACTIVE', activeSitesCount: 0, version: 1 },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 200,
      }),
    ),
  },
}))

vi.mock('@/api/users', () => ({
  usersApi: {
    list: vi.fn(() =>
      Promise.resolve({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 200 }),
    ),
  },
}))

let sessionState: AuthState = { status: 'authenticated', user: null }

vi.mock('@/auth/session', () => ({
  authSession: {
    subscribe: () => () => {},
    snapshot: () => sessionState,
  },
}))

function authenticatedAs(role: UserRole): AuthState {
  return {
    status: 'authenticated',
    user: { id: '1', name: 'User', email: 'user@example.com', role, phone: '', active: true },
  }
}

describe('InspectionsPage CSV export (PBI-092)', () => {
  beforeEach(() => {
    exportCsv.mockClear()
  })

  afterEach(cleanup)

  it('shows the export button for ADMIN and calls exportCsv with the active filters', async () => {
    sessionState = authenticatedAs(UserRole.ADMIN)
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    const exportButton = await screen.findByRole('button', { name: /exportar csv/i })
    expect(exportButton).toBeInTheDocument()

    await waitFor(() => expect(screen.getByRole('option', { name: 'Cliente A' })).toBeInTheDocument())
    await userEvent.selectOptions(screen.getByLabelText(/cliente/i), 'Cliente A')
    await userEvent.type(screen.getByLabelText(/periodo/i), '2026-03-15')

    await userEvent.click(screen.getByRole('button', { name: /exportar csv/i }))

    await waitFor(() => expect(exportCsv).toHaveBeenCalledTimes(1))
    expect(exportCsv).toHaveBeenCalledWith({ status: '', from: '2026-03-15', to: '2026-03-15', clientId: 7 })
  })

  it('hides the export button for SUPERVISOR', async () => {
    sessionState = authenticatedAs(UserRole.SUPERVISOR)
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: /inspecoes/i })
    expect(screen.queryByRole('button', { name: /exportar csv/i })).toBeNull()
  })

  it('shows a pt-BR alert when the export fails', async () => {
    sessionState = authenticatedAs(UserRole.ADMIN)
    exportCsv.mockRejectedValueOnce(new Error('falha'))
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('button', { name: /exportar csv/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/csv/i)
  })
})
