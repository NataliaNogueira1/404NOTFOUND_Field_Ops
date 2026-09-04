import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InspectionsPage } from '@/pages/inspections/InspectionsPage'

describe('InspectionsPage filters', () => {
  afterEach(cleanup)

  it('searches inspections by related equipment name', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
    render(<MemoryRouter><InspectionsPage /></MemoryRouter>)

    await userEvent.type(screen.getByLabelText(/busca/i), 'Gerador Diesel')

    await waitFor(() => {
      expect(screen.getByText(/inspecao gerador diesel/i)).not.toBeNull()
      expect(screen.queryByText(/inspecao extintor p12/i)).toBeNull()
    })
  })

  it('loads filtered and sorted inspections from the paginated API', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      content: [{ id: 9, title: 'Inspecao API', clientName: 'Industria Modelo', siteName: 'Matriz',
        equipmentName: 'Compressor', technicianId: 3, technicianName: 'Carlos Henrique',
        priority: 'HIGH', dueDate: '2026-09-04', status: 'ASSIGNED', progress: 0, overdue: false }],
      totalElements: 42, totalPages: 5, number: 0, size: 10, first: true, last: false,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter initialEntries={['/app/inspections?status=ASSIGNED&sort=dueDate%2Cdesc']}><InspectionsPage /></MemoryRouter>)

    expect(await screen.findByText('Inspecao API')).not.toBeNull()
    expect(screen.getByText('Mostrando 1-10 de 42')).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(
      /inspections\?.*sort=dueDate%2Cdesc.*status=ASSIGNED/), expect.anything())
  })
})
