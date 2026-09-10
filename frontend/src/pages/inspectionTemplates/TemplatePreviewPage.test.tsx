import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TemplatePreviewPage } from '@/pages/inspectionTemplates/TemplatePreviewPage'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('TemplatePreviewPage', () => {
  it('renders the persisted checklist in order with read-only response controls', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(validTemplate())))
    renderPreview('99')

    expect(await screen.findByRole('heading', { name: 'Previa: Modelo de campo' })).not.toBeNull()
    expect(screen.getByText('Categoria: Seguranca')).not.toBeNull()
    expect(screen.getByText('Secoes: 2 | Itens: 7')).not.toBeNull()
    expect(screen.getAllByRole('heading', { level: 3 }).map(heading => heading.textContent))
      .toEqual(['Secao 1: Primeira', 'Secao 2: Segunda'])
    expect(screen.getByText('1. Confirmacao *')).not.toBeNull()
    expect(screen.getByText('2. Comentario')).not.toBeNull()
    expect(screen.getByText('Obs. na falha')).not.toBeNull()
    expect(screen.getByText('Evid. na falha')).not.toBeNull()

    expect(screen.getByRole('button', { name: 'Conforme' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nao Conforme' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'N/A' })).toBeDisabled()
    expect(screen.getByLabelText('Resposta curta')).toBeDisabled()
    expect(screen.getByLabelText('Resposta longa')).toBeDisabled()
    expect(screen.getByLabelText('Numero')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Sim' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nao' })).toBeDisabled()
    expect(screen.getByLabelText('Selecao unica')).toBeDisabled()
    expect(screen.getByLabelText('Data')).toBeDisabled()

    expect(screen.getByRole('link', { name: 'Voltar para edicao' })).toHaveAttribute(
      'href', '/app/inspection-templates/99/edit',
    )
    expect(screen.getByRole('button', { name: 'Publicar versao' })).toBeEnabled()
  })

  it('disables publishing when the template is invalid', async () => {
    const template = validTemplate()
    template.sections[0].items = []
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(template)))
    renderPreview('100')

    expect(await screen.findByRole('button', { name: 'Publicar versao' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Todas as secoes precisam de pelo menos um item.')
  })
})

function renderPreview(id: string) {
  render(<MemoryRouter initialEntries={[`/app/inspection-templates/${id}/preview`]}>
    <Routes>
      <Route path="/app/inspection-templates/:id/preview" element={<TemplatePreviewPage />} />
    </Routes>
  </MemoryRouter>)
}

function validTemplate() {
  return {
    id: 99,
    title: 'Modelo de campo',
    description: 'Checklist eletrico',
    category: 'Seguranca',
    status: 'DRAFT',
    currentVersion: 0,
    createdBy: 7,
    version: 0,
    sections: [
      {
        id: 12, title: 'Segunda', description: null, displayOrder: 2,
        items: [
          item(22, 'Data da leitura', 'DATE', 6),
          item(21, 'Comentario', 'TEXT_SHORT', 1),
          item(23, 'Detalhes', 'TEXT_LONG', 2),
          item(24, 'Medicao', 'NUMBER', 3),
          item(25, 'Ligado?', 'BOOLEAN', 4),
          { ...item(26, 'Estado', 'SINGLE_CHOICE', 5), optionsJson: ['Bom', 'Ruim'] },
        ],
      },
      {
        id: 11, title: 'Primeira', description: 'Validacoes iniciais', displayOrder: 1,
        items: [{
          ...item(20, 'Confirmacao', 'CONFORMITY', 1), required: true,
          observationRequiredOnFailure: true, evidenceRequiredOnFailure: true,
        }],
      },
    ],
  }
}

function item(id: number, title: string, responseType: string, displayOrder: number) {
  return {
    id, title, description: null, responseType, required: false,
    observationRequiredOnFailure: false, evidenceRequiredOnFailure: false,
    optionsJson: null, displayOrder,
  }
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
