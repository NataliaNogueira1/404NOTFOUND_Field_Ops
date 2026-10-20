import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InspectionReviewPage } from '@/pages/inspections/InspectionReviewPage'

// Minimal review payload; location fields are overridden per test (PBI-045).
const baseReview = {
  id: 1, title: 'Inspecao', status: 'UNDER_REVIEW', priority: 'MEDIUM',
  clientName: 'Cliente', siteName: 'Local', equipmentName: null, technicianName: 'Ana',
  dueDate: '2026-10-02', progress: 100, nonConformities: [],
  sections: [{ title: 'Seguranca', order: 1, items: [] }],
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

describe('InspectionReviewPage location (PBI-045)', () => {
  it('shows start/end coordinates, accuracy in metres and a Google Maps link', async () => {
    renderWith({
      ...baseReview,
      startLocation: { latitude: -23.5015, longitude: -47.4526, accuracy: 8.5, capturedAt: '2026-08-03T09:15:00-03:00' },
      endLocation: { latitude: -23.5021, longitude: -47.4531, accuracy: 12, capturedAt: '2026-08-03T10:40:00-03:00' },
    })

    expect(await screen.findByText('-23.501500, -47.452600')).toBeInTheDocument()
    expect(screen.getByText('-23.502100, -47.453100')).toBeInTheDocument()
    // Accuracy is rounded to whole metres.
    expect(screen.getByText(/Precisao: 9 m/)).toBeInTheDocument()
    expect(screen.getByText(/Precisao: 12 m/)).toBeInTheDocument()

    const mapLink = screen.getByRole('link', { name: 'Ver localizacao de inicio no mapa' })
    expect(mapLink).toHaveAttribute('href', 'https://www.google.com/maps?q=-23.5015,-47.4526')
  })

  it('renders an explicit "not registered" state when a location is absent (RN-059)', async () => {
    renderWith({ ...baseReview, startLocation: null, endLocation: null })

    const notRegistered = await screen.findAllByText('Localizacao nao registrada')
    expect(notRegistered).toHaveLength(2)
    expect(screen.queryByRole('link', { name: /no mapa/ })).not.toBeInTheDocument()
  })
})
