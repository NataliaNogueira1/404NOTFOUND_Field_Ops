import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnswerHistoryTab } from '@/pages/inspections/AnswerHistoryTab'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const sampleHistory = [
  {
    itemId: '10',
    section: 'Equipamentos',
    sectionOrder: 1,
    itemTitle: 'Estado do equipamento',
    itemOrder: 1,
    responseType: 'CONFORMITY',
    value: 'CONFORMING',
    observation: 'Sem anomalias',
    answeredAt: '2026-09-22T14:32:00Z',
    answeredBy: 'Joao',
    answeredById: 3,
  },
  {
    itemId: '10',
    section: 'Equipamentos',
    sectionOrder: 1,
    itemTitle: 'Estado do equipamento',
    itemOrder: 1,
    responseType: 'CONFORMITY',
    value: 'NON_CONFORMING',
    observation: 'Equipamento apresentou ruido',
    answeredAt: '2026-09-22T16:10:00Z',
    answeredBy: 'Joao',
    answeredById: 3,
  },
  {
    itemId: '20',
    section: 'Equipamentos',
    sectionOrder: 1,
    itemTitle: 'Protecao',
    itemOrder: 2,
    responseType: 'CONFORMITY',
    value: 'CONFORMING',
    observation: null,
    answeredAt: '2026-09-22T16:15:00Z',
    answeredBy: 'Maria',
    answeredById: 4,
  },
]

describe('AnswerHistoryTab', () => {
  afterEach(cleanup)

  it('shows the loading state and then the grouped history', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(sampleHistory))))
    render(<AnswerHistoryTab inspectionId="1" />)

    // Loading state appears first.
    expect(screen.getByText(/carregando historico de respostas/i)).not.toBeNull()

    // Section header appears once (grouped by section).
    expect(await screen.findByText('Equipamentos')).not.toBeNull()
    // Items grouped inside the section.
    expect(screen.getByText('Estado do equipamento')).not.toBeNull()
    expect(screen.getByText('Protecao')).not.toBeNull()
  })

  it('renders value, observation, date and author for each version', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse(sampleHistory))))
    render(<AnswerHistoryTab inspectionId="1" />)

    await screen.findByText('Equipamentos')

    // Both versions of the same item are shown (history, not just current value).
    expect(screen.getAllByText('CONFORMING').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('NON_CONFORMING')).not.toBeNull()
    expect(screen.getByText('Equipamento apresentou ruido')).not.toBeNull()
    // Author present.
    expect(screen.getAllByText(/Joao/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Maria/)).not.toBeNull()
    // Date label present.
    expect(screen.getAllByText(/Data:/i).length).toBeGreaterThan(0)
  })

  it('shows the empty state when the API returns an empty list', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse([]))))
    render(<AnswerHistoryTab inspectionId="1" />)

    expect(await screen.findByText(/nenhum historico de respostas encontrado/i)).not.toBeNull()
  })

  it('treats a 404 as "inspection not found", distinct from empty history', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          jsonResponse({ status: 404, code: 'NOT_FOUND', message: 'Inspection not found' }, 404),
        ),
      ),
    )
    render(<AnswerHistoryTab inspectionId="999" />)

    expect(await screen.findByText(/inspecao nao encontrada/i)).not.toBeNull()
    expect(screen.queryByText(/nenhum historico de respostas encontrado/i)).toBeNull()
  })

  it('shows an error state with a working retry', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => Promise.reject(new Error('offline')))
      .mockImplementationOnce(() => Promise.resolve(jsonResponse(sampleHistory)))
    vi.stubGlobal('fetch', fetchMock)
    render(<AnswerHistoryTab inspectionId="1" />)

    // Error state appears first.
    expect(await screen.findByText(/nao foi possivel carregar o historico de respostas/i)).not.toBeNull()

    // Retry reloads and shows the data.
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(await screen.findByText('Equipamentos')).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
