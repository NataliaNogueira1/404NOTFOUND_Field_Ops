import { ClipboardCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type AdminInspectionSummary, adminCatalogApi } from '@/api/adminCatalog'
import { PriorityBadge, StatusBadge } from '@/components/badges/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue, useListQuery } from '@/hooks/useListQuery'

/**
 * Dedicated queue for inspections awaiting supervisor review.
 * Shows only SUBMITTED and UNDER_REVIEW inspections, ordered by due date ascending
 * (oldest first) so the most urgent ones are at the top.
 *
 * Route: /app/inspections/review
 */
export function ReviewQueuePage() {
  const navigate = useNavigate()
  const list = useListQuery('dueDate,asc')
  const query = list.value('name')
  const debouncedQuery = useDebouncedValue(query)

  const [rows, setRows] = useState<AdminInspectionSummary[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminCatalogApi.listInspections({
        name: debouncedQuery,
        status: '',
        technicianName: '',
        clientName: '',
        priority: '',
        dueDate: '',
        overdue: false,
        review: true,          // always filter to SUBMITTED + UNDER_REVIEW
        page: list.page,
        size: list.size,
        sort: list.sort,
      })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, list.page, list.size, list.sort])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  const columns: Column<AdminInspectionSummary>[] = [
    {
      header: 'Inspeção',
      sortKey: 'title',
      cell: item => (
        <button
          className="text-left font-medium text-primary hover:underline"
          onClick={() => navigate(`/app/inspections/${item.id}/review`)}
        >
          {item.title}
        </button>
      ),
    },
    { header: 'Cliente', sortKey: 'clientName', cell: item => item.clientName },
    { header: 'Equipamento', sortKey: 'equipmentName', cell: item => item.equipmentName },
    { header: 'Técnico', sortKey: 'technician.name', cell: item => item.technicianName },
    {
      header: 'Prioridade',
      sortKey: 'priority',
      cell: item => <PriorityBadge priority={item.priority} />,
    },
    {
      header: 'Data prevista',
      sortKey: 'dueDate',
      cell: item => (
        <span className={item.overdue ? 'font-semibold text-danger' : ''}>
          {item.dueDate}
        </span>
      ),
    },
    {
      header: 'Estado',
      sortKey: 'status',
      cell: item => <StatusBadge status={item.status} />,
    },
    {
      header: 'Ação',
      cell: item => (
        <Button
          variant="secondary"
          className="h-8"
          onClick={() => navigate(`/app/inspections/${item.id}/review`)}
        >
          <ClipboardCheck size={15} />
          Revisar
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aguardando revisão"
        description="Inspeções enviadas pelos técnicos que aguardam aprovação do supervisor."
      />

      <Card className="p-4">
        <Input
          label="Busca"
          id="review-search"
          value={query}
          onChange={e => list.update('name', e.target.value)}
          placeholder="Inspeção, cliente ou equipamento"
          className="max-w-sm"
        />
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        loadingLabel="Carregando inspeções pendentes..."
        page={list.page + 1}
        pageSize={list.size}
        totalRows={totalElements}
        totalPages={totalPages}
        sort={list.sort}
        onSortChange={list.toggleSort}
        onPageChange={next => list.setPage(next - 1)}
        onPageSizeChange={list.setSize}
      />
    </div>
  )
}
