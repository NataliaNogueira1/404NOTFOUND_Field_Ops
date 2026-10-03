import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InspectionReviewPage } from '@/pages/inspections/InspectionReviewPage'
const review = { id: 1, title: 'Inspecao', status: 'UNDER_REVIEW', priority: 'MEDIUM', clientName: 'Cliente', siteName: 'Local', equipmentName: null, technicianName: 'Ana', dueDate: '2026-10-02', progress: 0, sections: [{ title: 'Secao sem resposta', order: 1, items: [{ snapshotId: 1, code: null, title: 'Item nao respondido', description: null, responseType: 'TEXT', required: true, answer: null, observation: null, answeredAt: null, answeredBy: null, evidences: [], nonConformities: [] }] }], nonConformities: [] }
const history = [{ itemId: '1', section: 'Secao sem resposta', sectionOrder: 1, itemTitle: 'Item nao respondido', itemOrder: 1, responseType: 'TEXT', value: 'versao antiga', observation: null, answeredAt: '2026-10-01T10:00:00Z', answeredBy: 'Ana', answeredById: 3 }]
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('InspectionReviewPage review data', () => {
  it('renders an unanswered item and loads separate history on demand', async () => {
    const fetchMock = vi.fn((url: string) => Promise.resolve(new Response(JSON.stringify(url.endsWith('/history') ? history : review), { headers: { 'Content-Type': 'application/json' } }))); vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter initialEntries={['/app/inspections/1/review']}><Routes><Route path="/app/inspections/:id/review" element={<InspectionReviewPage />} /></Routes></MemoryRouter>)
    expect(await screen.findByText(/Item nao respondido/)).toBeInTheDocument(); expect(screen.getByText('Sem evidencias associadas a este item.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: /historico/i })); expect(await screen.findByText('versao antiga')).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/inspections\/1\/answers\/history$/), expect.anything()))
  })
})
