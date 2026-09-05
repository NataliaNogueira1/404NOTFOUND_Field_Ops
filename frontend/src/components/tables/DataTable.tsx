import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  className?: string
  sortKey?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  empty?: string
  loading?: boolean
  loadingLabel?: string
  page?: number
  pageSize?: number
  totalRows?: number
  totalPages?: number
  sort?: string
  onSortChange?: (key: string) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function DataTable<T>({ columns, rows, empty = 'Nenhum registro encontrado',
  loading = false, loadingLabel = 'Carregando...', page, pageSize, totalRows,
  totalPages: suppliedTotalPages, sort, onSortChange, onPageChange,
  onPageSizeChange }: DataTableProps<T>) {
  const current = page ?? 1
  const size = pageSize ?? (rows.length || 1)
  const total = totalRows ?? rows.length
  const totalPages = suppliedTotalPages ?? Math.max(1, Math.ceil(total / size))
  const visible = onPageChange && totalRows === undefined
    ? rows.slice((current - 1) * size, current * size) : rows
  const first = total === 0 ? 0 : (current - 1) * size + 1
  const last = Math.min(current * size, total)

  return <Card className="overflow-hidden">
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
      <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-muted"><tr>{columns.map(column => <th key={column.header} aria-sort={ariaSort(column.sortKey, sort)} className={`px-4 py-3 ${column.className ?? ''}`}>{column.sortKey && onSortChange ? <button className="focus-ring inline-flex items-center gap-1 rounded" onClick={() => onSortChange(column.sortKey!)}>{column.header}<SortIcon column={column.sortKey} sort={sort} /></button> : column.header}</th>)}</tr></thead>
      {!loading && <tbody className="divide-y divide-border">{visible.map((row, index) => <tr key={index} className="bg-white hover:bg-primary-light/10">{columns.map(column => <td key={column.header} className={`px-4 py-3 align-middle ${column.className ?? ''}`}>{column.cell(row)}</td>)}</tr>)}</tbody>}
    </table></div>
    {loading && <div role="status" className="p-8 text-center text-sm text-muted">{loadingLabel}</div>}
    {!loading && rows.length === 0 && <div className="p-8 text-center text-sm text-muted">{empty}</div>}
    {!loading && onPageChange && rows.length > 0 && <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>Mostrando {first}-{last} de {total}</span>
      <div className="flex items-center gap-3">
        {onPageSizeChange && <label className="flex items-center gap-2">Por pagina<select aria-label="Itens por pagina" className="focus-ring rounded-fieldops border border-border bg-white px-2 py-1" value={size} onChange={event => onPageSizeChange(Number(event.target.value))}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select></label>}
        <span>Pagina {current} de {totalPages}</span>
        <div className="flex gap-2"><Button aria-label="Pagina anterior" variant="secondary" className="h-8 px-2" disabled={current === 1} onClick={() => onPageChange(current - 1)}><ChevronLeft size={16} /></Button><Button aria-label="Proxima pagina" variant="secondary" className="h-8 px-2" disabled={current === totalPages} onClick={() => onPageChange(current + 1)}><ChevronRight size={16} /></Button></div>
      </div>
    </div>}
  </Card>
}

function SortIcon({ column, sort }: { column: string; sort?: string }) {
  const [active, direction] = sort?.split(',') ?? []
  if (active !== column) return <ChevronsUpDown aria-hidden size={14} />
  return direction === 'desc' ? <ArrowDown aria-hidden size={14} /> : <ArrowUp aria-hidden size={14} />
}

function ariaSort(column: string | undefined, sort: string | undefined) {
  if (!column) return undefined
  const [active, direction] = sort?.split(',') ?? []
  if (active !== column) return 'none' as const
  return direction === 'desc' ? 'descending' as const : 'ascending' as const
}
