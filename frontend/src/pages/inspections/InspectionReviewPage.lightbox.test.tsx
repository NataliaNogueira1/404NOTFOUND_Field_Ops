import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InspectionReviewPage } from '@/pages/inspections/InspectionReviewPage'

const review = { id: 1, title: 'Inspecao real', status: 'UNDER_REVIEW', priority: 'MEDIUM', clientName: 'Cliente', siteName: 'Local', equipmentName: 'Motor', technicianName: 'Ana', dueDate: '2026-10-02', progress: 100, nonConformities: [], sections: [{ title: 'Seguranca', order: 1, items: [{ snapshotId: 10, code: 'A', title: 'Protecao', description: null, responseType: 'CONFORMITY', required: true, answer: 'CONFORMING', observation: 'Ok', answeredAt: '2026-10-01T10:00:00Z', answeredBy: 'Ana', nonConformities: [], evidences: [{ id: 1, reference: 'https://example.test/one.jpg', description: 'Frente', capturedAt: '2026-10-01T10:00:00Z', uploadedBy: 'Ana' }, { id: 2, reference: 'https://example.test/two.jpg', description: 'Lateral', capturedAt: '2026-10-01T10:01:00Z', uploadedBy: 'Ana' }] }] }] }
function renderPage() { vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(review), { headers: { 'Content-Type': 'application/json' } })))); return render(<MemoryRouter initialEntries={['/app/inspections/1/review']}><Routes><Route path="/app/inspections/:id/review" element={<InspectionReviewPage />} /></Routes></MemoryRouter>) }
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('InspectionReviewPage evidence lightbox', () => {
  it('renders multiple real evidences and opens, navigates and closes the lightbox', async () => {
    renderPage(); const open = await screen.findAllByRole('button', { name: /Abrir foto/ }); expect(open).toHaveLength(4)
    await userEvent.click(open[0]); const dialog = await screen.findByRole('dialog'); expect(within(dialog).getAllByText('Protecao').length).toBeGreaterThan(0)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Proxima foto' })); expect(within(dialog).getByText('2 / 2')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar lightbox' })); expect(screen.queryByRole('dialog')).toBeNull()
  })
})
