import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InspectionReviewPage } from '@/pages/inspections/InspectionReviewPage'

const review = { id: 1, title: 'Inspecao real', status: 'UNDER_REVIEW', priority: 'MEDIUM', clientName: 'Cliente', siteName: 'Local', equipmentName: 'Motor', technicianName: 'Ana', dueDate: '2026-10-02', progress: 100, nonConformities: [], sections: [{ title: 'Seguranca', order: 1, items: [{ snapshotId: 10, code: 'A', title: 'Protecao', description: null, responseType: 'CONFORMITY', required: true, answer: 'CONFORMING', observation: 'Ok', answeredAt: '2026-10-01T10:00:00Z', answeredBy: 'Ana', nonConformities: [], evidences: [{ id: 1, reference: 'inspection-1/one.jpg', contentUrl: '/api/v1/inspection-evidences/1/content', description: 'Frente', location: 'Portao norte', capturedAt: '2026-10-01T10:00:00Z', uploadedBy: 'Ana', itemSnapshotId: 10 }, { id: 2, reference: 'inspection-1/two.jpg', contentUrl: '/api/v1/inspection-evidences/2/content', description: 'Lateral', location: null, capturedAt: '2026-10-01T10:01:00Z', uploadedBy: 'Ana', itemSnapshotId: 10 }] }] }] }
function renderPage(failContent = false) {
  vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(
    url.includes('/review')
      ? new Response(JSON.stringify(review), { headers: { 'Content-Type': 'application/json' } })
      : failContent
        ? new Response(JSON.stringify({ status: 404, code: 'NOT_FOUND', message: 'Arquivo ausente' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
        : new Response('real-image', { headers: { 'Content-Type': 'image/jpeg' } }),
  )))
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:real-image')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  return render(<MemoryRouter initialEntries={['/app/inspections/1/review']}><Routes><Route path="/app/inspections/:id/review" element={<InspectionReviewPage />} /></Routes></MemoryRouter>)
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
describe('InspectionReviewPage evidence lightbox', () => {
  it('renders multiple real evidences and opens, navigates and closes the lightbox', async () => {
    renderPage(); const open = await screen.findAllByRole('button', { name: /Abrir foto/ }); expect(open).toHaveLength(4)
    await userEvent.click(open[0]); const dialog = await screen.findByRole('dialog'); expect(within(dialog).getAllByText('Protecao').length).toBeGreaterThan(0); expect(within(dialog).getByText('Portao norte')).toBeInTheDocument(); expect(within(dialog).getByText('Frente')).toBeInTheDocument(); expect(within(dialog).getAllByAltText('Protecao')[0]).toHaveAttribute('src', 'blob:real-image')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Proxima foto' })); expect(within(dialog).getByText('2 / 2')).toBeInTheDocument()
    expect(within(dialog).getByText('Localizacao nao informada')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar lightbox' })); expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the real loading failure instead of a mock image', async () => {
    renderPage(true)
    await userEvent.click((await screen.findAllByRole('button', { name: /Abrir foto/ }))[0])
    expect(await screen.findByText('Nao foi possivel carregar a evidencia.')).toBeInTheDocument()
  })
})
