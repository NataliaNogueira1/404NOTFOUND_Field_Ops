import { Eye } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/api/client'
import {
  NonConformityStatus,
  type NonConformityListItem,
  nonConformitiesApi,
} from '@/api/nonConformities'
import { SeverityBadge } from '@/components/badges/Badge'
import { Modal } from '@/components/feedback/Modal'
import { Select } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue, useListQuery } from '@/hooks/useListQuery'
import { Severity } from '@/types/domain'

const severityLabel: Record<Severity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
}
const statusLabel: Record<NonConformityStatus, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Resolvida',
}
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function formatInstant(value: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : dateFormatter.format(parsed)
}

export function NonConformitiesPage() {
  const list = useListQuery('createdAt,desc')
  const clientQuery = list.value('client')
  const debouncedClient = useDebouncedValue(clientQuery)
  const severity = list.value('severity') as Severity | ''
  const status = list.value('status') as NonConformityStatus | ''
  const [rows, setRows] = useState<NonConformityListItem[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<NonConformityListItem | null>(null)
  const hasFilters = Boolean(clientQuery || severity || status)

  const loadNonConformities = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await nonConformitiesApi.list({
        client: debouncedClient,
        severity,
        status,
        page: list.page,
        size: list.size,
        sort: list.sort,
      })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch (cause) {
      setError(nonConformityError(cause))
    } finally {
      setLoading(false)
    }
  }, [debouncedClient, severity, status, list.page, list.size, list.sort])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void loadNonConformities(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [loadNonConformities])

  const columns: Column<NonConformityListItem>[] = [
    { header: 'Titulo', sortKey: 'title', cell: (nc) => <span className="font-medium">{nc.title}</span> },
    { header: 'Inspecao', cell: (nc) => `#${nc.inspectionId}` },
    { header: 'Cliente', cell: (nc) => nc.clientName || '-' },
    { header: 'Criticidade', sortKey: 'severity', cell: (nc) => <SeverityBadge severity={nc.severity} /> },
    { header: 'Status', sortKey: 'status', cell: (nc) => statusLabel[nc.status] },
    { header: 'Registrada em', sortKey: 'createdAt', cell: (nc) => formatInstant(nc.createdAt) },
    {
      header: 'Acoes',
      cell: (nc) => (
        <Button
          aria-label={`Ver detalhes da nao conformidade ${nc.title}`}
          variant="ghost"
          className="h-8 px-2"
          onClick={() => setSelected(nc)}
        >
          <Eye size={16} aria-hidden />
          Detalhes
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Nao conformidades" description="Acompanhe desvios encontrados em campo." />
      <Card className="grid gap-4 p-4 md:grid-cols-3">
        <Input
          label="Cliente"
          id="nc-client"
          value={clientQuery}
          placeholder="Nome exato do cliente"
          onChange={(event) => list.update('client', event.target.value)}
        />
        <Select
          label="Criticidade"
          id="nc-severity"
          value={severity}
          onChange={(event) => list.update('severity', event.target.value)}
        >
          <option value="">Todas</option>
          {Object.values(Severity).map((value) => (
            <option key={value} value={value}>
              {severityLabel[value]}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          id="nc-status"
          value={status}
          onChange={(event) => list.update('status', event.target.value)}
        >
          <option value="">Todos</option>
          {Object.values(NonConformityStatus).map((value) => (
            <option key={value} value={value}>
              {statusLabel[value]}
            </option>
          ))}
        </Select>
        {hasFilters && (
          <div className="md:col-span-3">
            <Button variant="ghost" onClick={() => list.clear(['client', 'severity', 'status'])}>
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>
      {error && <ErrorState message={error} onRetry={() => void loadNonConformities()} />}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        loadingLabel="Carregando nao conformidades..."
        empty="Nenhuma nao conformidade encontrada."
        page={list.page + 1}
        pageSize={list.size}
        totalRows={totalElements}
        totalPages={totalPages}
        sort={list.sort}
        onSortChange={list.toggleSort}
        onPageChange={(next) => list.setPage(next - 1)}
        onPageSizeChange={list.setSize}
      />
      <Modal open={Boolean(selected)} title="Detalhes da nao conformidade" onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-3">
            <SeverityBadge severity={selected.severity} />
            <p className="text-lg font-semibold">{selected.title}</p>
            {selected.description && <p className="text-sm text-text">{selected.description}</p>}
            <dl className="grid gap-2 text-sm text-muted">
              <Detail label="Inspecao" value={`#${selected.inspectionId}`} />
              <Detail label="Cliente" value={selected.clientName || '-'} />
              <Detail label="Status" value={statusLabel[selected.status]} />
              <Detail label="Registrada em" value={formatInstant(selected.createdAt)} />
              {selected.status === NonConformityStatus.CLOSED && (
                <Detail label="Resolvida em" value={formatInstant(selected.closedAt)} />
              )}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-medium text-muted">{label}</dt>
      <dd className="text-text">{value}</dd>
    </div>
  )
}

function nonConformityError(cause: unknown) {
  if (cause instanceof ApiError && cause.fieldErrors.length) {
    return cause.fieldErrors.map((fieldError) => fieldError.message).join(' ')
  }
  if (cause instanceof ApiError && cause.message) {
    return cause.message
  }
  return 'Nao foi possivel carregar as nao conformidades.'
}
