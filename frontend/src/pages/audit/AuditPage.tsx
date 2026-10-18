import { AlertCircle, Download, History, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { auditApi } from '@/api/audit'
import { ApiError } from '@/api/client'
import { Select } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { AuditAction, type AuditTimelineEntry } from '@/types/domain'

/** Labels legíveis para cada ação de auditoria. */
const ACTION_LABELS: Record<AuditAction, string> = {
  [AuditAction.INSPECTION_CREATED]: 'Inspeção criada',
  [AuditAction.INSPECTION_ASSIGNED]: 'Inspeção atribuída',
  [AuditAction.INSPECTION_STARTED]: 'Inspeção iniciada',
  [AuditAction.INSPECTION_SUBMITTED]: 'Enviada para revisão',
  [AuditAction.INSPECTION_REVIEW_STARTED]: 'Revisão iniciada',
  [AuditAction.INSPECTION_APPROVED]: 'Aprovada',
  [AuditAction.INSPECTION_REJECTED]: 'Reprovada',
  [AuditAction.INSPECTION_CANCELED]: 'Cancelada',
  [AuditAction.REVIEW_COMMENT_ADDED]: 'Comentário adicionado',
}

function labelForAction(action: string): string {
  return ACTION_LABELS[action as AuditAction] ?? action
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; entries: AuditTimelineEntry[] }
  | { status: 'error'; message: string }

/**
 * Página de auditoria global. Exibe todos os eventos de auditoria de uma inspeção
 * ou um painel agregado quando nenhum ID é informado.
 *
 * O filtro por "ID da inspeção" dispara uma chamada real à API:
 * GET /api/v1/inspections/{id}/history
 */
export function AuditPage() {
  const [inspectionId, setInspectionId] = useState('')
  const [action, setAction] = useState('')
  const [period, setPeriod] = useState('')
  const [state, setState] = useState<LoadState>({ status: 'ready', entries: [] })

  const load = useCallback(async (id: string) => {
    if (!id.trim()) {
      setState({ status: 'ready', entries: [] })
      return
    }
    setState({ status: 'loading' })
    try {
      const entries = await auditApi.getInspectionTimeline(id.trim())
      setState({ status: 'ready', entries })
    } catch (cause) {
      const message =
        cause instanceof ApiError
          ? cause.message
          : 'Não foi possível carregar os eventos de auditoria.'
      setState({ status: 'error', message })
    }
  }, [])

  // Dispara busca 400ms após o usuário parar de digitar o ID
  useEffect(() => {
    const timer = window.setTimeout(() => void load(inspectionId), 400)
    return () => window.clearTimeout(timer)
  }, [inspectionId, load])

  const entries = useMemo(
    () => (state.status === 'ready' ? state.entries : []),
    [state],
  )

  const filtered = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (!action || entry.action === action) &&
          (!period || entry.occurredAt.slice(0, 10) === period),
      ),
    [entries, action, period],
  )

  const hasFilters = Boolean(action || period)
  const allActions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.action))),
    [entries],
  )

  function clearFilters() {
    setAction('')
    setPeriod('')
  }

  const columns: Column<AuditTimelineEntry>[] = [
    {
      header: 'Data / hora',
      cell: (entry) => formatDateTime(entry.occurredAt),
    },
    {
      header: 'Ação',
      cell: (entry) => (
        <span className="font-mono text-xs font-semibold text-primary-dark">
          {labelForAction(entry.action)}
        </span>
      ),
    },
    {
      header: 'Entidade',
      cell: (entry) => entry.entityType,
    },
    {
      header: 'ID da entidade',
      cell: (entry) => (
        <span className="font-mono text-xs">{entry.entityId}</span>
      ),
    },
    {
      header: 'Detalhe',
      cell: (entry) => entry.detail ?? '-',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Consulte a timeline de eventos de uma inspeção."
        action={
          <Button variant="secondary" disabled={filtered.length === 0}>
            <Download size={17} />
            Exportar
          </Button>
        }
      />

      {/* Filtros */}
      <Card className="grid gap-4 p-4 md:grid-cols-4">
        <Input
          label="ID da inspeção"
          id="audit-inspection-id"
          value={inspectionId}
          onChange={(e) => setInspectionId(e.target.value)}
          placeholder="Ex: 42"
        />
        <Select
          label="Ação"
          id="audit-action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          disabled={entries.length === 0}
        >
          <option value="">Todas</option>
          {allActions.map((value) => (
            <option key={value} value={value}>
              {labelForAction(value)}
            </option>
          ))}
        </Select>
        <Input
          label="Período"
          id="audit-period"
          type="date"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          disabled={entries.length === 0}
        />
        {hasFilters && (
          <div className="self-end md:col-span-1">
            <Button variant="ghost" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>

      {/* Estados de carregamento / erro / vazio */}
      {state.status === 'loading' && (
        <Card
          className="flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-muted"
          role="status"
        >
          <Loader2 className="animate-spin" size={18} />
          Carregando eventos de auditoria...
        </Card>
      )}

      {state.status === 'error' && (
        <Card className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex items-center gap-2 text-sm font-medium text-danger">
            <AlertCircle size={18} />
            {state.message}
          </div>
          <Button variant="secondary" onClick={() => void load(inspectionId)}>
            Tentar novamente
          </Button>
        </Card>
      )}

      {state.status === 'ready' && entries.length === 0 && !inspectionId && (
        <EmptyState
          icon={History}
          title="Informe o ID de uma inspeção"
          description="Digite o ID numérico da inspeção no campo acima para ver sua timeline de auditoria."
        />
      )}

      {state.status === 'ready' && entries.length === 0 && inspectionId && (
        <EmptyState
          icon={History}
          title="Nenhum evento encontrado"
          description="A inspeção informada não possui eventos de auditoria registrados."
        />
      )}

      {state.status === 'ready' && entries.length > 0 && (
        <DataTable columns={columns} rows={filtered} />
      )}
    </div>
  )
}
