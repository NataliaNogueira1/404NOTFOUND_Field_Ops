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

  it('creates a single-choice item with two dynamic options', async () => {
    const template = templateResponse()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(template))
      .mockResolvedValueOnce(jsonResponse({
        id: 21, title: 'Estado da placa', description: 'Verifique danos', responseType: 'SINGLE_CHOICE',
        required: true, observationRequiredOnFailure: false, evidenceRequiredOnFailure: false,
        optionsJson: ['Legivel', 'Danificada'], displayOrder: 1,
      }, 201))
    vi.stubGlobal('fetch', fetchMock)
    renderBuilder()

    await screen.findByRole('heading', { name: 'Seguranca' })
    await userEvent.click(screen.getAllByRole('button', { name: 'Adicionar item a secao' })[0])
    expect(screen.getAllByRole('option')).toHaveLength(7)
    await userEvent.type(screen.getByLabelText('Titulo (pergunta)'), 'Estado da placa')
    await userEvent.type(screen.getByLabelText('Descricao (ajuda)'), 'Verifique danos')
    await userEvent.selectOptions(screen.getByLabelText('Tipo de resposta'), 'SINGLE_CHOICE')
    const options = screen.getAllByLabelText(/Opcao \d/)
    await userEvent.type(options[0], 'Legivel')
    await userEvent.type(options[1], 'Danificada')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar item' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/sections/11/items'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Estado da placa', description: 'Verifique danos', responseType: 'SINGLE_CHOICE',
          required: true, observationRequiredOnFailure: false, evidenceRequiredOnFailure: false,
          optionsJson: ['Legivel', 'Danificada'], displayOrder: 1,
        }),
      }),
    ))
    expect(await screen.findByText('Estado da placa')).not.toBeNull()
    expect(screen.getByText('Selecao unica')).not.toBeNull()
    expect(screen.getByText('Ordem 1')).not.toBeNull()
  })

  it('persists and displays required observation and evidence rules', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(templateResponse()))
      .mockResolvedValueOnce(jsonResponse({
        id: 23, title: 'Cabos eletricos integros?', description: null, responseType: 'CONFORMITY',
        required: true, observationRequiredOnFailure: true, evidenceRequiredOnFailure: true,
        optionsJson: null, displayOrder: 1,
      }, 201))
    vi.stubGlobal('fetch', fetchMock)
    renderBuilder()

    await screen.findByRole('heading', { name: 'Seguranca' })
    await userEvent.click(screen.getAllByRole('button', { name: 'Adicionar item a secao' })[0])
    await userEvent.type(screen.getByLabelText('Titulo (pergunta)'), 'Cabos eletricos integros?')
    await userEvent.click(screen.getByLabelText('Observacao obrigatoria na falha'))
    await userEvent.click(screen.getByLabelText('Evidencia obrigatoria na falha'))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar item' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/sections/11/items'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'Cabos eletricos integros?', description: '', responseType: 'CONFORMITY',
          required: true, observationRequiredOnFailure: true, evidenceRequiredOnFailure: true,
          optionsJson: null, displayOrder: 1,
        }),
      }),
    ))
    expect(await screen.findByText('Obrigatorio')).not.toBeNull()
    expect(screen.getByText('Observacao na falha')).not.toBeNull()
    expect(screen.getByText('Evidencia na falha')).not.toBeNull()
  })

  it('persists item reordering inside its section', async () => {
    const template = templateResponse()
    template.sections[0].items = [
      { id: 21, title: 'Primeiro', description: null, responseType: 'BOOLEAN', required: true, optionsJson: [], displayOrder: 1 },
      { id: 22, title: 'Segundo', description: null, responseType: 'DATE', required: false, optionsJson: [], displayOrder: 2 },
    ]
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(template))
      .mockResolvedValueOnce(jsonResponse({ ...template.sections[0].items[1], displayOrder: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    renderBuilder()

    await screen.findByText('Segundo')
    await userEvent.click(screen.getByRole('button', { name: 'Mover Segundo para cima' }))
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/sections/11/items/22'),
      expect.objectContaining({ method: 'PUT', body: expect.stringContaining('"displayOrder":1') }),
    ))
    expect(screen.getByText('Segundo').closest('div')?.textContent).toContain('Ordem 1')
  })

  it('confirms and publishes a complete persisted template through the API', async () => {
    const template = templateResponse()
    template.sections.forEach((section, index) => {
      section.items = [{
        id: 30 + index, title: `Item ${index + 1}`, description: null, responseType: 'BOOLEAN',
        required: true, observationRequiredOnFailure: false, evidenceRequiredOnFailure: false,
        optionsJson: null, displayOrder: 1,
      }]
    })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(template))
      .mockResolvedValueOnce(jsonResponse(template))
      .mockResolvedValueOnce(jsonResponse({
        id: 501, versionNumber: 1, titleSnapshot: 'Modelo', descriptionSnapshot: '',
        publishedAt: '2026-09-09T12:00:00Z', publishedBy: 7,
      }, 201))
    vi.stubGlobal('fetch', fetchMock)
    renderBuilder()

    await screen.findByText('Item 1')
    await userEvent.click(screen.getByRole('button', { name: 'Publicar' }))
    expect(screen.getByText('Ao publicar, a versao nao podera ser alterada. Continuar?')).not.toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Continuar e publicar' }))

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/v1/inspection-templates/42/publish'),
      expect.objectContaining({ method: 'POST' }),
    ))
    expect(await screen.findByText('Ativo')).not.toBeNull()
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
      { id: 11, title: 'Seguranca', description: null, displayOrder: 1, items: [] as Array<Record<string, unknown>> },
      { id: 12, title: 'Eletrica', description: null, displayOrder: 2, items: [] as Array<Record<string, unknown>> },
    ],
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
