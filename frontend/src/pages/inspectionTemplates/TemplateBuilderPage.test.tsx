import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TemplateBuilderPage } from '@/pages/inspectionTemplates/TemplateBuilderPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('TemplateBuilderPage sections', () => {
  it('loads ordered sections and creates a section through the API', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(templateResponse()))
      .mockResolvedValueOnce(jsonResponse({
        id: 13, title: 'Funcionamento', description: 'Testes operacionais', displayOrder: 3,
      }, 201))
    vi.stubGlobal('fetch', fetchMock)
    renderBuilder()

    expect(await screen.findByRole('heading', { name: 'Seguranca' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Eletrica' })).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar secao' }))
    await userEvent.type(screen.getByLabelText('Titulo da secao'), 'Funcionamento')
    await userEvent.type(screen.getByLabelText('Descricao da secao'), 'Testes operacionais')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar secao' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/v1/inspection-templates/42/sections'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Funcionamento', description: 'Testes operacionais', displayOrder: 3,
        }),
      }),
    ))
    expect(await screen.findByRole('heading', { name: 'Funcionamento' })).not.toBeNull()
  })

  it('reorders, edits, and confirms deletion through the API', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(templateResponse()))
      .mockResolvedValueOnce(jsonResponse({ id: 12, title: 'Eletrica', description: null, displayOrder: 1 }))
      .mockResolvedValueOnce(jsonResponse({ id: 11, title: 'Seguranca editada', description: 'Nova descricao', displayOrder: 2 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    renderBuilder()

    await screen.findByRole('heading', { name: 'Eletrica' })
    await userEvent.click(screen.getByRole('button', { name: 'Mover Eletrica para cima' }))
    await waitFor(() => expect(fetchMock).toHaveBeenNthCalledWith(2,
      expect.stringContaining('/sections/12'),
      expect.objectContaining({ method: 'PUT' }),
    ))

    await userEvent.click(screen.getByRole('button', { name: 'Editar Seguranca' }))
    const title = screen.getByLabelText('Titulo da secao')
    await userEvent.clear(title)
    await userEvent.type(title, 'Seguranca editada')
    await userEvent.type(screen.getByLabelText('Descricao da secao'), 'Nova descricao')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar secao' }))
    expect(await screen.findByRole('heading', { name: 'Seguranca editada' })).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Excluir Seguranca editada' }))
    expect(screen.getByText('Esta acao tambem exclui os itens vinculados a secao.')).not.toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Excluir secao' }))
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/sections/11'), expect.objectContaining({ method: 'DELETE' }),
    ))
  })
})

function renderBuilder() {
  render(<MemoryRouter initialEntries={['/app/inspection-templates/42/edit']}>
    <Routes>
      <Route path="/app/inspection-templates/:id/edit" element={<TemplateBuilderPage />} />
    </Routes>
  </MemoryRouter>)
}

function templateResponse() {
  return {
    id: 42, title: 'Modelo', description: '', category: 'Seguranca', status: 'DRAFT',
    currentVersion: 0, createdBy: 7, version: 0,
    sections: [
      { id: 11, title: 'Seguranca', description: null, displayOrder: 1 },
      { id: 12, title: 'Eletrica', description: null, displayOrder: 2 },
    ],
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
