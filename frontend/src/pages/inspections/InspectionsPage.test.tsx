import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InspectionsPage } from '@/pages/inspections/InspectionsPage'

describe('InspectionsPage filters', () => {
  afterEach(cleanup)

  it('searches inspections by related equipment name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    )
    render(
      <MemoryRouter>
        <InspectionsPage />
      </MemoryRouter>,
    )

    await userEvent.type(screen.getByLabelText(/busca/i), 'Gerador Diesel')

    await waitFor(() => {
      expect(screen.getByText(/inspecao gerador diesel/i)).not.toBeNull()
      expect(screen.queryByText(/inspecao extintor p12/i)).toBeNull()
    })
  })

  it('loads filtered and sorted inspections from the paginated API', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: [
              {
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
              },
            ],
            totalElements: 42,
            totalPages: 5,
            number: 0,
            size: 10,
            first: true,
            last: false,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter initialEntries={['/app/inspections?status=ASSIGNED&sort=dueDate%2Cdesc']}>
        <InspectionsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Inspecao API')).not.toBeNull()
    expect(screen.getByText('Mostrando 1-10 de 42')).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/inspections\?.*sort=dueDate%2Cdesc.*status=ASSIGNED/),
      expect.anything(),
    )
  })

  it('cancels an inspection through the API with the informed reason and refetches the list', async () => {
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
      return Promise.resolve(
        new Response(
          JSON.stringify({
            content: [
              {
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
              },
            ],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 10,
            first: true,
            last: false,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
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
    expect(await screen.findByText(/inspecao cancelada com sucesso/i)).not.toBeNull()
  })
})
