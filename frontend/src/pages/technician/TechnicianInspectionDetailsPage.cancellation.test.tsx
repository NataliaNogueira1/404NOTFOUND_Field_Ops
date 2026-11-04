import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { TechnicianInspectionDetailsPage } from '@/pages/technician/TechnicianPages'

/** Builds a mobile inspection detail payload as returned by GET /mobile/inspections/{id}. */
function inspectionDetail(overrides: Record<string, unknown>) {
  return {
    id: '7',
    title: 'Inspeção de painel',
    templateId: 't1',
    clientId: 'c1',
    clientName: 'Indústria Modelo',
    siteId: 's1',
    siteName: 'Matriz',
    equipmentId: 'e1',
    equipmentName: 'Painel A',
    equipmentQrCode: null,
    technicianId: '3',
    supervisorId: '2',
    supervisorName: 'Marina Supervisora',
    status: 'ASSIGNED',
    priority: 'MEDIUM',
    dueDate: '2026-11-10',
    dueTime: null,
    createdAt: '2026-11-01T08:00:00Z',
    startedAt: null,
    progress: 0,
    supervisorInstructions: null,
    rejectionReason: null,
    canceledReason: null,
    canceledBy: null,
    canceledAt: null,
    version: 1,
    template: { id: 't1', title: 'Modelo', category: 'ELÉTRICA', version: 1, sections: [] },
    ...overrides,
  }
}

function renderDetail(detail: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify(detail), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    ),
  )
  render(
    <MemoryRouter initialEntries={['/technician/inspections/7']}>
      <Routes>
        <Route path="/technician/inspections/:id" element={<TechnicianInspectionDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TechnicianInspectionDetailsPage — cancelamento (#338)', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('exibe motivo, autor e data quando a inspeção está CANCELED', async () => {
    renderDetail(
      inspectionDetail({
        status: 'CANCELED',
        canceledReason: 'Cliente cancelou a visita técnica.',
        canceledBy: 'Marina Supervisora',
        canceledAt: '2026-11-02T12:00:00Z',
      }),
    )

    const notice = await screen.findByRole('alert', { name: /justificativa de cancelamento/i })
    const { getByText } = within(notice)
    expect(getByText('Cliente cancelou a visita técnica.')).toBeInTheDocument()
    expect(getByText('Marina Supervisora')).toBeInTheDocument()
    expect(getByText(/02\/11\/2026/)).toBeInTheDocument()
  })

  it('não exibe o bloco de cancelamento em outros estados', async () => {
    renderDetail(inspectionDetail({ status: 'ASSIGNED' }))

    // Espera a tela carregar (o título aparece)
    expect(await screen.findByRole('heading', { name: 'Inspeção de painel' })).toBeInTheDocument()
    expect(screen.queryByRole('alert', { name: /justificativa de cancelamento/i })).toBeNull()
  })

  it('degrada graciosamente quando falta o motivo do cancelamento', async () => {
    renderDetail(
      inspectionDetail({
        status: 'CANCELED',
        canceledReason: null,
        canceledBy: null,
        canceledAt: null,
      }),
    )

    await screen.findByRole('alert', { name: /justificativa de cancelamento/i })
    expect(screen.getByText('Motivo não informado')).toBeInTheDocument()
    expect(screen.getByText('Usuário não identificado')).toBeInTheDocument()
    expect(screen.getByText('Data não registrada')).toBeInTheDocument()
  })
})
