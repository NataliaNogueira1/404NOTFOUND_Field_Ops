import { Ban } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface CancellationNoticeProps {
  /** Reason the inspection was canceled, as entered by the admin/supervisor. */
  reason?: string | null
  /** Name of the user who canceled the inspection. */
  canceledBy?: string | null
  /** When the inspection was canceled (ISO 8601). */
  canceledAt?: string | null
}

/**
 * Cancellation audit block shown for a CANCELED inspection (#262): reason, who canceled
 * it and when. Shared between the supervisor/admin review screen and the technician's
 * detail screen (#338), so both audiences see the same information. Each field degrades
 * gracefully when the backend omits it. Render it only while the status is CANCELED.
 */
export function CancellationNotice({ reason, canceledBy, canceledAt }: CancellationNoticeProps) {
  return (
    <Card role="alert" aria-label="Justificativa de cancelamento" className="border-danger/40 bg-danger-light/10 p-4">
      <div className="flex items-center gap-2 text-danger-dark">
        <Ban size={18} aria-hidden />
        <h2 className="text-base font-semibold">Inspeção cancelada</h2>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted">Motivo</dt>
          <dd className="mt-0.5 whitespace-pre-line">{reason?.trim() ? reason : 'Motivo não informado'}</dd>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <dt className="text-xs font-medium text-muted">Cancelada por</dt>
            <dd className="mt-0.5 font-semibold">{canceledBy?.trim() ? canceledBy : 'Usuário não identificado'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Data do cancelamento</dt>
            <dd className="mt-0.5 font-semibold">{canceledAt ? formatDateTime(canceledAt) : 'Data não registrada'}</dd>
          </div>
        </div>
      </dl>
    </Card>
  )
}

/** Formats an ISO timestamp as a localized pt-BR date+time, falling back to the raw value. */
function formatDateTime(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('pt-BR')
}
