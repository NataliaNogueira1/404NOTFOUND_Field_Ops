import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InspectionReviewPage } from '@/pages/inspections/InspectionReviewPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const history = [
  {
    itemId: '10',
    section: 'Seguranca',
    sectionOrder: 1,
    itemTitle: 'Botao de emergencia',
    itemOrder: 1,
    responseType: 'CONFORMITY',
    value: 'CONFORMING',
    observation: 'Ok',
    answeredAt: '2026-09-22T14:32:00Z',
    answeredBy: 'Carlos',
    answeredById: 3,
  },
]

describe('InspectionReviewPage - answer history tab', () => {
  afterEach(cleanup)

  it('shows the "Historico de respostas" tab and loads it on click', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(history)))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/app/inspections/ins-compressor/review']}>
        <InspectionReviewPage />
      </MemoryRouter>,
    )

    // The tab is present.
    const tab = screen.getByRole('tab', { name: /historico de respostas/i })
    expect(tab).not.toBeNull()

    // Switching to the tab triggers the history load.
    await userEvent.click(tab)
    expect(await screen.findByText('Seguranca')).not.toBeNull()
    expect(screen.getByText('Botao de emergencia')).not.toBeNull()
    expect(screen.getByText('CONFORMING')).not.toBeNull()
    expect(screen.getByText(/Carlos/)).not.toBeNull()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/v1\/inspections\/ins-compressor\/answers\/history$/),
        expect.anything(),
      )
    })
  })
})
