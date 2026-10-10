import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InspectionReviewPage } from '@/pages/inspections/InspectionReviewPage'

const review = { id: 1, title: 'Inspecao', status: 'UNDER_REVIEW', priority: 'MEDIUM', clientName: 'Cliente', siteName: 'Local', equipmentName: null, technicianName: 'Ana', dueDate: '2026-10-02', progress: 100, nonConformities: [], sections: [{ title: 'Seguranca', order: 1, items: [{ snapshotId: 1, code: null, title: 'Protecao', description: null, responseType: 'CONFORMITY', required: true, answer: 'NON_CONFORMING', observation: 'Protecao ausente', answeredAt: null, answeredBy: 'Ana', evidences: [], nonConformities: [] }] }, { title: 'Eletrica', order: 2, items: [] }] }
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('InspectionReviewPage sections', () => {
  it('highlights non-conforming answers and offers navigation to each snapshot section', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(review), { headers: { 'Content-Type': 'application/json' } }))))
    render(<MemoryRouter initialEntries={['/app/inspections/1/review']}><Routes><Route path="/app/inspections/:id/review" element={<InspectionReviewPage />} /></Routes></MemoryRouter>)
    expect(await screen.findByText('Resposta nao conforme: NON_CONFORMING')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegacao por secao' })).toHaveTextContent('Seguranca')
    expect(screen.getByRole('link', { name: 'Eletrica' })).toHaveAttribute('href', '#review-section-2')
  })
})
