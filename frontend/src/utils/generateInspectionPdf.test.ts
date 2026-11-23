import type { jsPDF } from 'jspdf'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InspectionStatus, Priority, Severity } from '@/types/domain'
import { generateInspectionPdf, type PdfInspectionData } from './generateInspectionPdf'

// Uses the real jspdf/jspdf-autotable so the test fails if an upgrade breaks the PDF
// API. Only `save` is replaced, to capture the document instead of downloading it.
// In jspdf 4.x `save` is an instance property, so it is overridden per instance.

const saved = vi.hoisted(() => ({ calls: [] as { filename: string; pages: number; pdf: string }[] }))

vi.mock('jspdf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jspdf')>()
  class CapturingJsPDF extends actual.jsPDF {
    constructor(...args: ConstructorParameters<typeof actual.jsPDF>) {
      super(...args)
      this.save = ((filename?: string) => {
        saved.calls.push({ filename: filename ?? '', pages: this.getNumberOfPages(), pdf: this.output() })
        return this
      }) as unknown as jsPDF['save']
    }
  }
  return { ...actual, jsPDF: CapturingJsPDF }
})

const data: PdfInspectionData = {
  inspection: {
    id: 'insp-001',
    title: 'Inspecao preventiva do gerador',
    templateId: 'tpl-001',
    clientId: 'cli-001',
    siteId: 'site-001',
    equipmentId: 'eq-001',
    technicianId: 'tec-001',
    status: InspectionStatus.APPROVED,
    priority: Priority.HIGH,
    dueDate: '2026-11-30',
    progress: 100,
    supervisorInstructions: 'Verificar nivel de oleo antes da partida.',
  },
  technicianName: 'Tecnico Exemplo',
  clientName: 'Cliente Exemplo',
  siteName: 'Unidade Centro',
  equipmentName: 'Gerador GX-200',
  supervisorName: 'Supervisor Exemplo',
  reviewAnswers: [
    { id: 'a1', section: 'Estrutura', question: 'Base sem trincas', result: 'Conforme' },
    {
      id: 'a2',
      section: 'Estrutura',
      question: 'Parafusos fixados',
      result: 'Nao conforme',
      nonConformityId: 'nc-1',
    },
    { id: 'a3', section: 'Eletrica', question: 'Cabos isolados', result: 'Conforme' },
  ],
  nonConformities: [
    {
      id: 'nc-1',
      title: 'Parafuso solto na base',
      inspectionId: 'insp-001',
      item: 'Parafusos fixados',
      clientId: 'cli-001',
      severity: Severity.HIGH,
      status: 'Aberta',
      date: '2026-11-20',
    },
  ],
}

function generate(input: PdfInspectionData) {
  generateInspectionPdf(input)
  return saved.calls[saved.calls.length - 1]
}

describe('generateInspectionPdf', () => {
  beforeEach(() => {
    saved.calls = []
  })

  it('generates a valid PDF and saves it with the inspection id in the filename', () => {
    const { pdf, filename, pages } = generate(data)

    expect(saved.calls).toHaveLength(1)
    expect(pdf.startsWith('%PDF-')).toBe(true)
    expect(filename).toMatch(/^inspecao-insp-001-\d{4}-\d{2}-\d{2}\.pdf$/)
    expect(pages).toBeGreaterThanOrEqual(1)
  })

  it('renders the header and inspection info', () => {
    const { pdf } = generate(data)

    for (const text of [
      'FieldOps',
      'Relatorio de Inspecao',
      'Inspecao preventiva do gerador',
      '[ Aprovada ]',
      'Tecnico Exemplo',
      'Cliente Exemplo',
      'Unidade Centro',
      'Gerador GX-200',
      'Supervisor Exemplo',
      'Alta',
      '30/11/2026',
    ]) {
      expect(pdf).toContain(`(${text})`)
    }
  })

  it('renders the checklist tables grouped by section', () => {
    const { pdf } = generate(data)

    for (const text of ['Checklist', 'Estrutura', 'Eletrica', 'Base sem trincas', 'Parafusos fixados', 'Cabos isolados']) {
      expect(pdf).toContain(`(${text})`)
    }
  })

  it('renders the non-conformities table and supervisor instructions', () => {
    const { pdf } = generate(data)

    for (const text of [
      'Nao Conformidades',
      'Parafuso solto na base',
      'Aberta',
      'Instrucoes do supervisor',
      'Verificar nivel de oleo antes da partida.',
    ]) {
      expect(pdf).toContain(`(${text})`)
    }
  })

  it('omits the non-conformities section when there are none', () => {
    const { pdf } = generate({ ...data, nonConformities: [] })

    expect(pdf).not.toContain('(Nao Conformidades)')
  })
})
