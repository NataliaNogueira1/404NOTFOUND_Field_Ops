import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InspectionReviewPage } from '@/pages/inspections/InspectionReviewPage'

// Minimal review payload; cancellation fields are overridden per test (#262).
const baseReview = {
  id: 1, title: 'Inspecao', priority: 'MEDIUM',
  clientName: 'Cliente', siteName: 'Local', equipmentName: null, technicianName: 'Ana',
  dueDate: '2026-10-02', progress: 100, nonConformities: [], startLocation: null, endLocation: null,
  cancellation: null, sections: [{ title: 'Seguranca', order: 1, items: [] }],
}

function renderWith(review: object) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(
    new Response(JSON.stringify(review), { headers: { 'Content-Type': 'application/json' } }),
  )))
  render(
    <MemoryRouter initialEntries={['/app/inspections/1/review']}>
      <Routes><Route path="/app/inspections/:id/review" element={<InspectionReviewPage />} /></Routes>
    </MemoryRouter>,
  )
}

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('InspectionReviewPage cancellation (#262)', () => {
  it('shows the reason, who canceled and when for a CANCELED inspection', async () => {
    renderWith({
      ...baseReview,
      status: 'CANCELED',
      cancellation: {
        reason: 'Equipamento descomissionado, nao sera mais inspecionado.',
        canceledBy: 'Carlos Supervisor',
        canceledAt: '2026-09-15T12:00:00Z',
      },
    })

    const notice = await screen.findByRole('alert', { name: 'Justificativa de cancelamento' })
    expect(notice).toBeInTheDocument()
    expect(screen.getByText('Inspeção cancelada')).toBeInTheDocument()
    expect(screen.getByText('Equipamento descomissionado, nao sera mais inspecionado.')).toBeInTheDocument()
    expect(screen.getByText('Carlos Supervisor')).toBeInTheDocument()
    // The ISO timestamp is formatted; the original string must not leak through.
    expect(screen.queryByText('2026-09-15T12:00:00Z')).not.toBeInTheDocument()
  })

  it('degrades gracefully when cancellation fields are missing', async () => {
    renderWith({
      ...baseReview,
      status: 'CANCELED',
      cancellation: { reason: null, canceledBy: null, canceledAt: null },
    })

    expect(await screen.findByRole('alert', { name: 'Justificativa de cancelamento' })).toBeInTheDocument()
    expect(screen.getByText('Motivo não informado')).toBeInTheDocument()
    expect(screen.getByText('Usuário não identificado')).toBeInTheDocument()
    expect(screen.getByText('Data não registrada')).toBeInTheDocument()
  })

  it('does not render the cancellation block for a non-canceled inspection', async () => {
    renderWith({ ...baseReview, status: 'UNDER_REVIEW', cancellation: null })

    // Wait for the page to finish loading before asserting absence.
    expect(await screen.findByRole('heading', { name: 'Revisão da inspeção' })).toBeInTheDocument()
    expect(screen.queryByRole('alert', { name: 'Justificativa de cancelamento' })).not.toBeInTheDocument()
    expect(screen.queryByText('Inspeção cancelada')).not.toBeInTheDocument()
  })
})
