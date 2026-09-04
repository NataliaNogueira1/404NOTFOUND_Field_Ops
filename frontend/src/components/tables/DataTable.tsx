import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export interface Column<T> { header: string; cell: (row: T) => ReactNode; className?: string }
export function DataTable<T>({ columns, rows, empty = 'Nenhum registro encontrado.', page, pageSize, totalRows, totalPages: suppliedTotalPages, onPageChange }: { columns: Column<T>[]; rows: T[]; empty?: string; page?: number; pageSize?: number; totalRows?: number; totalPages?: number; onPageChange?: (page: number) => void }) {
  const current = page ?? 1
  const size = pageSize ?? (rows.length || 1)
  const totalPages = suppliedTotalPages ?? Math.max(1, Math.ceil((totalRows ?? rows.length) / size))
  const visible = onPageChange && totalRows === undefined ? rows.slice((current - 1) * size, current * size) : rows
  return <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-muted"><tr>{columns.map(column => <th key={column.header} className={`px-4 py-3 ${column.className ?? ''}`}>{column.header}</th>)}</tr></thead><tbody className="divide-y divide-border">{visible.map((row, index) => <tr key={index} className="bg-white hover:bg-primary-light/10">{columns.map(column => <td key={column.header} className={`px-4 py-3 align-middle ${column.className ?? ''}`}>{column.cell(row)}</td>)}</tr>)}</tbody></table></div>{rows.length === 0 && <div className="p-8 text-center text-sm text-muted">{empty}</div>}{onPageChange && rows.length > 0 && <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted"><span>Pagina {current} de {totalPages} - {totalRows ?? rows.length} registros</span><div className="flex gap-2"><Button aria-label="Pagina anterior" variant="secondary" className="h-8 px-2" disabled={current === 1} onClick={() => onPageChange(current - 1)}><ChevronLeft size={16} /></Button><Button aria-label="Proxima pagina" variant="secondary" className="h-8 px-2" disabled={current === totalPages} onClick={() => onPageChange(current + 1)}><ChevronRight size={16} /></Button></div></div>}</Card>
}
