import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InspectionsPage } from '@/pages/inspections/InspectionsPage'

/** Retorna uma resposta paginada vazia */
function emptyPage() {
  return Promise.resolve(
    new Response(
      JSON.stringify({
        content: [],
        totalElements: 0,
        totalPages: 1,
        number: 0,
        size: 10,
        first: true,
        last: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  )
}

/** Retorna uma página com uma inspeção de exemplo */
function pageWith(inspection: Record<string, unknown>) {
  return Promise.resolve(
    new Response(
      JSON.stringify({
        content: [inspection],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 10,
        first: true,
        last: true,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  )
}

const apiInspection = {
  id: 9,
  title: 'Inspecao API',
  clientName: 'Industria Modelo',
  siteName: 'Matriz',
  equipmentName: 'Compressor',
  technicianId: 3,
  technicianName: 'Carlos Henrique',
  priority: 'HIGH',
  dueDate: '2026-09-04',
  status: 'ASSIGNED',
  progress: 0,
  overdue: false,
}

describe('InspectionsPage', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('exibe tabela vazia quando a API retorna lista vazia', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => emptyPage()),
    )
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    // Aguarda carregamento terminar
    await waitFor(() => {
      expect(screen.queryByText(/carregando inspeções/i)).toBeNull()
    })

    // Sem dados na tabela
    expect(screen.queryByRole('button', { name: /abrir|revisar/i })).toBeNull()
  })

  it('exibe tabela vazia quando a API está indisponível (sem fallback mock)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    )
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText(/carregando inspeções/i)).toBeNull()
    })

    // Com API offline, a tabela deve ficar vazia (sem fallback mock)
    expect(screen.queryByRole('button', { name: /abrir|revisar/i })).toBeNull()
  })

  it('carrega inspeções paginadas da API com filtros corretos', async () => {
    const fetchMock = vi.fn(() => pageWith(apiInspection))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter initialEntries={['/app/inspections?status=ASSIGNED&sort=dueDate%2Cdesc']}>
        <InspectionsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Inspecao API')).not.toBeNull()
    expect(screen.getByText('Mostrando 1-1 de 1')).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/inspections\?.*sort=dueDate%2Cdesc.*status=ASSIGNED/),
      expect.anything(),
    )
  })

  it('envia o intervalo de datas da listagem como from e to', async () => {
    const fetchMock = vi.fn(() => emptyPage())
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter initialEntries={['/app/inspections?from=2026-10-10&to=2026-10-20']}>
        <InspectionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/inspections\?.*from=2026-10-10.*to=2026-10-20/),
        expect.anything(),
      )
    })
  })

  it('cancela uma inspeção via API com o motivo informado e recarrega a lista', async () => {
    let cancelBody: Record<string, unknown> | undefined
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/v1/inspections/9/cancel')) {
        cancelBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 9,
              status: 'CANCELED',
              canceledAt: '2026-09-15T12:00:00Z',
              canceledBy: 1,
              canceledReason: cancelBody.reason,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }
      return pageWith(apiInspection)
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    await screen.findByText('Inspecao API')
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    await userEvent.type(screen.getByLabelText(/motivo/i), 'Cliente solicitou reagendamento')
    await userEvent.click(screen.getByRole('button', { name: /confirmar cancelamento/i }))

    await waitFor(() => expect(cancelBody).toEqual({ reason: 'Cliente solicitou reagendamento' }))
    expect(fetchMock.mock.calls.filter((call) => String(call[0]).includes('/api/v1/inspections?'))).toHaveLength(2)
    expect(await screen.findByText(/inspeção cancelada com sucesso/i)).not.toBeNull()
  })

  it('exibe erro de validação ao tentar cancelar com motivo menor que 10 caracteres', async () => {
    const fetchMock = vi.fn(() => pageWith(apiInspection))
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    await screen.findByText('Inspecao API')
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    await userEvent.type(screen.getByLabelText(/motivo/i), 'Curto')
    await userEvent.click(screen.getByRole('button', { name: /confirmar cancelamento/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/pelo menos 10 caracteres/i)
  })

  it('carrega nomes de técnicos e clientes da API para os selects de filtro', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/v1/users?')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              content: [
                { id: 3, name: 'Carlos Henrique', email: 'carlos@example.com', role: 'TECHNICIAN', status: 'ACTIVE', phone: null, version: 1 },
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
      if (url.includes('/api/v1/clients?')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              content: [
                { id: 1, name: 'Industria Modelo', legalName: null, document: null, email: null, phone: null, status: 'ACTIVE', activeSitesCount: 2, version: 1 },
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
      return emptyPage()
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    // Aguarda os nomes aparecerem nos selects
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Carlos Henrique' })).toBeInTheDocument()
    })
    expect(screen.getByRole('option', { name: 'Industria Modelo' })).toBeInTheDocument()
  })

  it('renderiza filtros sem dados quando a API de usuários/clientes falha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network error'))),
    )
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText(/carregando inspeções/i)).toBeNull()
    })

    // Os selects de técnico e cliente devem existir mas sem opções além de "Todos"
    expect(screen.getByLabelText(/técnico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cliente/i)).toBeInTheDocument()
  })
})
