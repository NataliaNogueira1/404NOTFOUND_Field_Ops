import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Inspection, NonConformity, ReviewAnswer } from '@/types/domain'
import { Priority, InspectionStatus } from '@/types/domain'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const priorityLabel: Record<Priority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
}

const statusLabel: Record<InspectionStatus, string> = {
  DRAFT: 'Rascunho',
  ASSIGNED: 'Atribuida',
  IN_PROGRESS: 'Em andamento',
  SUBMITTED: 'Enviada',
  UNDER_REVIEW: 'Em revisao',
  APPROVED: 'Aprovada',
  REJECTED: 'Reprovada',
  CANCELED: 'Cancelada',
}

function formatDate(isoString?: string): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return isoString
  return d.toLocaleDateString('pt-BR')
}

// ─── Colour palette (RGB) ─────────────────────────────────────────────────────

const COLOR_PRIMARY: [number, number, number] = [37, 99, 235]   // #2563EB
const COLOR_DANGER: [number, number, number] = [220, 38, 38]     // #DC2626
const COLOR_SUCCESS: [number, number, number] = [22, 163, 74]    // #16A34A
const COLOR_WARNING: [number, number, number] = [245, 158, 11]   // #F59E0B
const COLOR_MUTED: [number, number, number] = [100, 116, 139]    // #64748B
const COLOR_BORDER: [number, number, number] = [226, 232, 240]   // #E2E8F0
const COLOR_TEXT: [number, number, number] = [15, 23, 42]        // #0F172A
const COLOR_WHITE: [number, number, number] = [255, 255, 255]

// ─── Layout constants ─────────────────────────────────────────────────────────

const MARGIN = 16
const PAGE_WIDTH = 210 // A4

function resultColor(result: string): [number, number, number] {
  if (/conforme/i.test(result) && !/nao/i.test(result)) return COLOR_SUCCESS
  if (/nao.conforme/i.test(result)) return COLOR_DANGER
  return COLOR_MUTED
}

// ─── PDF generation ───────────────────────────────────────────────────────────

export interface PdfInspectionData {
  inspection: Inspection
  technicianName: string
  clientName: string
  siteName: string
  equipmentName: string
  supervisorName: string
  reviewAnswers: ReviewAnswer[]
  nonConformities: NonConformity[]
}

export function generateInspectionPdf(data: PdfInspectionData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ─── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(...COLOR_PRIMARY)
  doc.rect(0, 0, PAGE_WIDTH, 28, 'F')

  doc.setTextColor(...COLOR_WHITE)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('FieldOps', MARGIN, 12)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatorio de Inspecao', MARGIN, 19)

  doc.setFontSize(8)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, PAGE_WIDTH - MARGIN, 19, { align: 'right' })

  let y = 36

  // ─── Title ──────────────────────────────────────────────────────────────────
  doc.setTextColor(...COLOR_TEXT)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(data.inspection.title, MARGIN, y)
  y += 6

  // Status badge inline
  const status = statusLabel[data.inspection.status] ?? data.inspection.status
  const statusCol = data.inspection.status === InspectionStatus.APPROVED
    ? COLOR_SUCCESS
    : data.inspection.status === InspectionStatus.REJECTED
      ? COLOR_DANGER
      : COLOR_MUTED
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...statusCol)
  doc.text(`[ ${status} ]`, MARGIN, y)
  y += 8

  // ─── Info grid (2 columns) ──────────────────────────────────────────────────
  doc.setDrawColor(...COLOR_BORDER)
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN, y, PAGE_WIDTH - MARGIN * 2, 36, 2, 2, 'FD')

  const COL1 = MARGIN + 4
  const COL2 = PAGE_WIDTH / 2 + 4
  const ROW_H = 8

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLOR_MUTED)

  const gridItems: [string, string, number, number][] = [
    ['Tecnico', data.technicianName, COL1, y + 8],
    ['Cliente', data.clientName, COL2, y + 8],
    ['Local', data.siteName, COL1, y + 8 + ROW_H],
    ['Equipamento', data.equipmentName, COL2, y + 8 + ROW_H],
    ['Prioridade', priorityLabel[data.inspection.priority] ?? data.inspection.priority, COL1, y + 8 + ROW_H * 2],
    ['Prazo', formatDate(data.inspection.dueDate), COL2, y + 8 + ROW_H * 2],
    ['Supervisor', data.supervisorName, COL1, y + 8 + ROW_H * 3],
  ]

  for (const [label, value, x, gy] of gridItems) {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLOR_MUTED)
    doc.text(label, x, gy)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR_TEXT)
    doc.text(value || '-', x, gy + 4)
  }

  y += 44

  // ─── Summary stats ──────────────────────────────────────────────────────────
  const totalItems = data.reviewAnswers.length
  const ncItems = data.reviewAnswers.filter(a => Boolean(a.nonConformityId)).length
  const conformeItems = totalItems - ncItems
  const progress = totalItems > 0 ? Math.round((conformeItems / totalItems) * 100) : 0

  const stats: [string, string, [number, number, number]][] = [
    ['Total de itens', String(totalItems), COLOR_PRIMARY],
    ['Conformes', String(conformeItems), COLOR_SUCCESS],
    ['Nao conformes', String(ncItems), COLOR_DANGER],
    ['Conformidade', `${progress}%`, progress >= 80 ? COLOR_SUCCESS : progress >= 50 ? COLOR_WARNING : COLOR_DANGER],
  ]

  const boxW = (PAGE_WIDTH - MARGIN * 2 - 6) / 4
  for (let i = 0; i < stats.length; i++) {
    const [label, value, color] = stats[i]
    const bx = MARGIN + i * (boxW + 2)
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(...COLOR_BORDER)
    doc.roundedRect(bx, y, boxW, 18, 2, 2, 'FD')
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...color)
    doc.text(value, bx + boxW / 2, y + 10, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR_MUTED)
    doc.text(label, bx + boxW / 2, y + 16, { align: 'center' })
  }
  y += 26

  // ─── Checklist table ────────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLOR_TEXT)
  doc.text('Checklist', MARGIN, y)
  y += 4

  // Group answers by section
  const grouped = data.reviewAnswers.reduce<Record<string, ReviewAnswer[]>>((acc, a) => {
    acc[a.section] = [...(acc[a.section] ?? []), a]
    return acc
  }, {})

  for (const [section, answers] of Object.entries(grouped)) {
    autoTable(doc, {
      startY: y,
      head: [[{ content: section, colSpan: 3, styles: { fillColor: COLOR_PRIMARY, textColor: COLOR_WHITE, fontStyle: 'bold', fontSize: 8 } }],
             ['#', 'Item', 'Resultado']],
      body: answers.map((a, idx) => [
        String(idx + 1),
        a.question,
        a.result,
      ]),
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontSize: 7 },
        1: { cellWidth: 120, fontSize: 7 },
        2: {
          cellWidth: 40,
          fontSize: 7,
          fontStyle: 'bold',
        },
      },
      headStyles: { fontSize: 7.5, fillColor: [226, 232, 240], textColor: COLOR_TEXT },
      bodyStyles: { fontSize: 7, textColor: COLOR_TEXT },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: MARGIN, right: MARGIN },
      styles: { overflow: 'linebreak', cellPadding: 2.5 },
      didParseCell(hookData) {
        // Color the result column based on value
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const val: string = String(hookData.cell.raw ?? '')
          hookData.cell.styles.textColor = resultColor(val)
        }
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 4
  }

  // ─── Non-conformities section ───────────────────────────────────────────────
  if (data.nonConformities.length > 0) {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage()
      y = MARGIN
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLOR_TEXT)
    doc.text('Nao Conformidades', MARGIN, y)
    y += 4

    const severityLabel: Record<string, string> = {
      LOW: 'Baixa',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      CRITICAL: 'Critica',
    }
    const severityColor: Record<string, [number, number, number]> = {
      LOW: COLOR_SUCCESS,
      MEDIUM: COLOR_PRIMARY,
      HIGH: COLOR_WARNING,
      CRITICAL: COLOR_DANGER,
    }

    autoTable(doc, {
      startY: y,
      head: [['#', 'Titulo', 'Item', 'Criticidade', 'Status']],
      body: data.nonConformities.map((nc, idx) => [
        String(idx + 1),
        nc.title,
        nc.item,
        severityLabel[nc.severity] ?? nc.severity,
        nc.status,
      ]),
      columnStyles: {
        0: { cellWidth: 8, halign: 'center', fontSize: 7 },
        1: { cellWidth: 55, fontSize: 7 },
        2: { cellWidth: 70, fontSize: 7 },
        3: { cellWidth: 22, fontSize: 7, fontStyle: 'bold' },
        4: { cellWidth: 20, fontSize: 7 },
      },
      headStyles: { fontSize: 7.5, fillColor: [220, 38, 38], textColor: COLOR_WHITE, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: COLOR_TEXT },
      alternateRowStyles: { fillColor: [255, 241, 242] },
      margin: { left: MARGIN, right: MARGIN },
      styles: { overflow: 'linebreak', cellPadding: 2.5 },
      didParseCell(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          const val = String(hookData.cell.raw ?? '').toUpperCase()
          const key = Object.keys(severityLabel).find(k => severityLabel[k] === val || k === val)
          if (key) hookData.cell.styles.textColor = severityColor[key] ?? COLOR_TEXT
        }
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 4
  }

  // ─── Supervisor instructions ────────────────────────────────────────────────
  if (data.inspection.supervisorInstructions) {
    if (y > 250) { doc.addPage(); y = MARGIN }
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLOR_TEXT)
    doc.text('Instrucoes do supervisor', MARGIN, y)
    y += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR_MUTED)
    const lines = doc.splitTextToSize(data.inspection.supervisorInstructions, PAGE_WIDTH - MARGIN * 2)
    doc.text(lines, MARGIN, y)
  }

  // ─── Footer on each page ────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFillColor(...COLOR_BORDER)
    doc.rect(0, 291, PAGE_WIDTH, 6, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...COLOR_MUTED)
    doc.text('FieldOps — Documento gerado automaticamente. Nao possui valor juridico.', MARGIN, 295)
    doc.text(`Pagina ${p} de ${pageCount}`, PAGE_WIDTH - MARGIN, 295, { align: 'right' })
  }

  // ─── Save ────────────────────────────────────────────────────────────────────
  const filename = `inspecao-${data.inspection.id}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
