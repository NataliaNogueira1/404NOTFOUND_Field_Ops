import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { adminCatalogApi } from '@/api/adminCatalog'
import { authSession } from '@/auth/session'
import { InspectionsPage } from '@/pages/inspections/InspectionsPage'
import { UserRole, type User } from '@/types/domain'

// Controla o perfil da sessão para testar a autorização do botão de exportação.
vi.mock('@/auth/session', () => {
  const state: { status: 'authenticated'; user: User | null } = { status: 'authenticated', user: null }
  return {
    authSession: {
      subscribe: () => () => {},
      snapshot: () => state,
      __setUser: (user: User | null) => {
        state.user = user
      },
    },
  }
})

function adminUser(): User {
  return { id: '1', name: 'Ana Admin', email: 'ana@fieldops.com', role: UserRole.ADMIN, phone: '', active: true }
}

function supervisorUser(): User {
  return { id: '2', name: 'Marina', email: 'marina@fieldops.com', role: UserRole.SUPERVISOR, phone: '', active: true }
}

function setSessionUser(user: User | null) {
  ;(authSession as unknown as { __setUser: (user: User | null) => void }).__setUser(user)
}

function clientsPage() {
  return Promise.resolve(
    new Response(
      JSON.stringify({
        content: [
          {
            id: 7,
            name: 'Industria Modelo',
            legalName: null,
            document: null,
            email: null,
            phone: null,
            status: 'ACTIVE',
            activeSitesCount: 1,
            version: 1,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 200,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  )
}

function emptyPage() {
  return Promise.resolve(
    new Response(
      JSON.stringify({ content: [], totalElements: 0, totalPages: 1, number: 0, size: 10, first: true, last: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  )
}

function mountFetch() {
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/v1/clients?')) return clientsPage()
    return emptyPage()
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPage(path = '/app/inspections') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <InspectionsPage />
    </MemoryRouter>,
  )
}

describe('InspectionsPage — exportação CSV', () => {
  beforeEach(() => {
    setSessionUser(null)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('exibe o botão Exportar CSV para ADMIN', async () => {
    mountFetch()
    setSessionUser(adminUser())
    renderPage()

    expect(await screen.findByRole('button', { name: /exportar csv/i })).toBeInTheDocument()
  })

  it('não exibe o botão Exportar CSV para não-ADMIN', async () => {
    mountFetch()
    setSessionUser(supervisorUser())
    renderPage()

    await waitFor(() => {
      expect(screen.queryByText(/carregando inspecoes/i)).toBeNull()
    })
    expect(screen.queryByRole('button', { name: /exportar csv/i })).toBeNull()
  })

  it('chama exportCsv com filtros mapeados e clientId resolvido pela API real', async () => {
    mountFetch()
    setSessionUser(adminUser())
    const exportSpy = vi.spyOn(adminCatalogApi, 'exportCsv').mockResolvedValue()

    renderPage('/app/inspections?status=ASSIGNED&clientName=Industria+Modelo&dueDateFrom=2026-09-01&dueDateTo=2026-09-30')

    // Aguarda os clientes carregarem para que o nome → id esteja disponível.
    await screen.findByRole('option', { name: 'Industria Modelo' })
    await userEvent.click(await screen.findByRole('button', { name: /exportar csv/i }))

    await waitFor(() => expect(exportSpy).toHaveBeenCalledTimes(1))
    expect(exportSpy).toHaveBeenCalledWith({
      status: 'ASSIGNED',
      from: '2026-09-01',
      to: '2026-09-30',
      clientId: 7,
    })
  })

  it('chama exportCsv com to vazio quando apenas "De" está preenchido', async () => {
    mountFetch()
    setSessionUser(adminUser())
    const exportSpy = vi.spyOn(adminCatalogApi, 'exportCsv').mockResolvedValue()

    renderPage('/app/inspections?dueDateFrom=2026-09-04')

    await screen.findByRole('button', { name: /exportar csv/i })
    await userEvent.click(screen.getByRole('button', { name: /exportar csv/i }))

    await waitFor(() => expect(exportSpy).toHaveBeenCalledTimes(1))
    expect(exportSpy).toHaveBeenCalledWith({
      status: '',
      from: '2026-09-04',
      to: '',
      clientId: undefined,
    })
  })

  it('mostra alerta em pt-BR quando a exportação falha', async () => {
    mountFetch()
    setSessionUser(adminUser())
    vi.spyOn(adminCatalogApi, 'exportCsv').mockRejectedValue(new Error('Erro ao exportar CSV: 500'))

    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: /exportar csv/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/erro ao exportar csv/i)
  })
})
