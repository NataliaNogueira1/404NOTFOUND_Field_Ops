import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NewTemplatePage } from '@/pages/inspectionTemplates/NewTemplatePage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('NewTemplatePage', () => {
  it('validates required fields, creates a draft, and redirects to the builder', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: 42,
      title: 'Inspecao Preventiva de Compressor',
      description: 'Checklist mensal',
      category: 'Manutencao Preventiva',
      status: 'DRAFT',
      currentVersion: 0,
      createdBy: 7,
    }), { status: 201, headers: { 'Content-Type': 'application/json' } })))
    vi.stubGlobal('fetch', fetchMock)

    render(<MemoryRouter initialEntries={['/app/inspection-templates/new']}>
      <Routes>
        <Route path="/app/inspection-templates/new" element={<NewTemplatePage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>)

    await userEvent.click(screen.getByRole('button', { name: 'Criar modelo' }))
    expect(await screen.findByText('Informe o titulo do modelo.')).not.toBeNull()
    expect(screen.getByText('Selecione uma categoria.')).not.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText('Titulo'), 'Inspecao Preventiva de Compressor')
    await userEvent.type(screen.getByLabelText('Descricao'), 'Checklist mensal')
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Manutencao Preventiva')
    await userEvent.click(screen.getByRole('button', { name: 'Criar modelo' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/inspection-templates'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Inspecao Preventiva de Compressor',
          description: 'Checklist mensal',
          category: 'Manutencao Preventiva',
        }),
      }),
    ))
    expect(await screen.findByTestId('location')).toHaveTextContent('/app/inspection-templates/42/edit')
  })
})

function LocationProbe() {
  return <span data-testid="location">{useLocation().pathname}</span>
}
