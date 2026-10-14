import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  History,
  Loader2,
  MessageSquare,
  PlayCircle,
  PlusCircle,
  Send,
  UserCheck,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { auditApi } from '@/api/audit'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { AuditAction, type AuditTimelineEntry } from '@/types/domain'

interface AuditTimelineProps {
  inspectionId: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; entries: AuditTimelineEntry[] }
  | { status: 'not-found' }
  | { status: 'error' }

/** Metadados de exibição para cada tipo de ação. */
const ACTION_META: Record<
  AuditAction,
  { label: string; icon: React.ElementType; colorClass: string }
> = {
  [AuditAction.INSPECTION_CREATED]: {
    label: 'Inspeção criada',
    icon: PlusCircle,
    colorClass: 'text-primary',
  },
  [AuditAction.INSPECTION_ASSIGNED]: {
    label: 'Inspeção atribuída',
    icon: UserCheck,
    colorClass: 'text-primary',
  },
  [AuditAction.INSPECTION_STARTED]: {
    label: 'Inspeção iniciada',
    icon: PlayCircle,
    colorClass: 'text-warning-dark',
  },
  [AuditAction.INSPECTION_SUBMITTED]: {
    label: 'Inspeção enviada para revisão',
    icon: Send,
    colorClass: 'text-primary',
  },
  [AuditAction.INSPECTION_REVIEW_STARTED]: {
    label: 'Revisão iniciada',
    icon: ClipboardList,
    colorClass: 'text-warning-dark',
  },
  [AuditAction.INSPECTION_APPROVED]: {
    label: 'Inspeção aprovada',
    icon: CheckCircle2,
    colorClass: 'text-success-dark',
  },
  [AuditAction.INSPECTION_REJECTED]: {
    label: 'Inspeção reprovada',
    icon: XCircle,
    colorClass: 'text-danger',
  },
  [AuditAction.INSPECTION_CANCELED]: {
    label: 'Inspeção cancelada',
    icon: XCircle,
    colorClass: 'text-muted',
  },
  [AuditAction.REVIEW_COMMENT_ADDED]: {
    label: 'Comentário de revisão adicionado',
    icon: MessageSquare,
    colorClass: 'text-primary',
  },
}

function getActionMeta(action: AuditAction) {
  return ACTION_META[action] ?? { label: action, icon: History, colorClass: 'text-muted' }
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function TimelineEvent({ entry }: { entry: AuditTimelineEntry }) {
  const meta = getActionMeta(entry.action)
  const Icon = meta.icon
  return (
    <li className="flex gap-4">
      {/* Ícone e linha vertical */}
      <div className="flex flex-col items-center">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface ${meta.colorClass}`}
          aria-hidden="true"
        >
          <Icon size={16} />
        </span>
        <span className="mt-1 flex-1 border-l border-border" aria-hidden="true" />
      </div>

      {/* Conteúdo */}
      <div className="mb-6 min-w-0 flex-1 pb-1">
        <p className={`text-sm font-semibold ${meta.colorClass}`}>{meta.label}</p>
        {entry.detail && (
          <p className="mt-1 text-sm text-muted">{entry.detail}</p>
        )}
        <p className="mt-1 text-xs text-muted">
          {formatDateTime(entry.occurredAt)}
        </p>
      </div>
    </li>
  )
}

/**
 * Exibe a timeline cronológica de auditoria de uma inspeção,
 * carregando dados reais do endpoint GET /api/v1/inspections/{id}/history.
 */
export function AuditTimeline({ inspectionId }: AuditTimelineProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const entries = await auditApi.getInspectionTimeline(inspectionId)
      setState({ status: 'ready', entries })
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
        setState({ status: 'not-found' })
        return
      }
      setState({ status: 'error' })
    }
  }, [inspectionId])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [load])

  if (state.status === 'loading') {
    return (
      <Card
        className="flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-muted"
        role="status"
      >
        <Loader2 className="animate-spin" size={18} />
        Carregando timeline de auditoria...
      </Card>
    )
  }

  if (state.status === 'error') {
    return (
      <Card className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex items-center gap-2 text-sm font-medium text-danger">
          <AlertCircle size={18} />
          Não foi possível carregar a timeline de auditoria.
        </div>
        <Button variant="secondary" onClick={() => void load()}>
          Tentar novamente
        </Button>
      </Card>
    )
  }

  if (state.status === 'not-found') {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Inspeção não encontrada"
        description="A inspeção solicitada não existe ou foi removida."
      />
    )
  }

  if (state.entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Nenhum evento de auditoria encontrado"
        description="Esta inspeção ainda não possui eventos registrados."
      />
    )
  }

  return (
    <Card className="p-5">
      <h2 className="mb-5 text-base font-semibold">Histórico de auditoria</h2>
      <ol aria-label="Timeline de auditoria" className="space-y-0">
        {state.entries.map((entry) => (
          <TimelineEvent key={entry.id} entry={entry} />
        ))}
      </ol>
    </Card>
  )
}
