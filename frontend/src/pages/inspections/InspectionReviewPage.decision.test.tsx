import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InspectionReviewPage } from '@/pages/inspections/InspectionReviewPage'

const review = { id: 1, title: 'Inspecao', status: 'UNDER_REVIEW', priority: 'MEDIUM', clientName: 'Cliente', siteName: 'Local', equipmentName: null, technicianName: 'Ana', dueDate: '2026-10-02', progress: 0, sections: [], nonConformities: [] }
const approved = { ...review, status: 'APPROVED' }
function body(value: unknown, status = 200) { return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } }) }
function renderPage(fetchMock: ReturnType<typeof vi.fn>) { vi.stubGlobal('fetch', fetchMock); return render(<MemoryRouter initialEntries={['/app/inspections/1/review']}><Routes><Route path="/app/inspections/:id/review" element={<InspectionReviewPage />} /></Routes></MemoryRouter>) }
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
describe('InspectionReviewPage decisions', () => {
  it('posts approval once, disables duplicate submission, and refreshes state', async () => {
    let resolveApproval: ((response: Response) => void) | undefined
    const fetchMock = vi.fn((url: string) => url.endsWith('/review') ? Promise.resolve(body(fetchMock.mock.calls.length > 1 ? approved : review)) : new Promise<Response>(resolve => { resolveApproval = resolve }))
    renderPage(fetchMock); await screen.findByText('Inspecao'); await userEvent.click(screen.getByRole('button', { name: 'Aprovar' })); const confirm = screen.getByRole('button', { name: 'Aprovar inspecao' }); await userEvent.click(confirm); await userEvent.click(confirm)
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/approve'))).toHaveLength(1); await waitFor(() => expect(screen.getByRole('button', { name: 'Aprovando...' })).toBeDisabled())
    resolveApproval?.(body({ id: 1, status: 'APPROVED' })); await waitFor(() => expect(screen.getByText(/nao pode receber uma nova decisao/i)).toBeInTheDocument())
  })
  it('posts rejection and keeps the current state after request failure', async () => {
    const fetchMock = vi.fn((url: string) => url.endsWith('/review') ? Promise.resolve(body(review)) : Promise.resolve(body({ status: 422, code: 'BUSINESS_RULE', message: 'Estado invalido' }, 422)))
    renderPage(fetchMock); await screen.findByText('Inspecao'); await userEvent.click(screen.getAllByRole('button', { name: 'Reprovar' }).at(-1)!); await userEvent.type(screen.getByLabelText(/motivo/i), 'Motivo suficiente'); await userEvent.click(screen.getByRole('button', { name: /confirmar reprovacao/i }))
    await screen.findByText('Estado invalido'); expect(screen.getByRole('button', { name: 'Aprovar' })).toBeEnabled(); expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/reject'))).toBe(true)
  })
})
