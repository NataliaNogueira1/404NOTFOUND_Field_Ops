import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TemplatesPage } from '@/pages/inspectionTemplates/TemplatesPage'

const template = {
  id: 10, title: 'Checklist de Compressor', category: 'Manutencao', version: 2,
  sectionCount: 3, itemCount: 12, status: 'ACTIVE',
}

afterEach(cleanup)

describe('TemplatesPage', () => {
  it('loads a server page and reflects debounced filters and sorting in the URL', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      content: [template], totalElements: 1, totalPages: 1, number: 0, size: 10,
      first: true, last: true,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><TemplatesPage /><LocationProbe /></MemoryRouter>)

    expect(await screen.findByText('Checklist de Compressor')).not.toBeNull()
    expect(screen.getByText('Mostrando 1-1 de 1')).not.toBeNull()
    await userEvent.type(screen.getByLabelText('Buscar'), 'Compressor')
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'ACTIVE')

    expect(screen.getByTestId('template-location')).toHaveTextContent('name=Compressor')
    expect(screen.getByTestId('template-location')).toHaveTextContent('status=ACTIVE')
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringMatching(/inspection-templates\?.*name=Compressor.*status=ACTIVE/), expect.anything()))

    await userEvent.click(screen.getByRole('button', { name: 'Titulo' }))
    expect(screen.getByTestId('template-location')).toHaveTextContent('sort=title%2Cdesc')
  })
})

function LocationProbe() {
  return <span data-testid="template-location">{useLocation().search}</span>
}
