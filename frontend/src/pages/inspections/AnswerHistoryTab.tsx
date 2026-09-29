import { AlertCircle, History, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { inspectionAnswersApi } from '@/api/inspectionAnswers'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import type { AnswerHistoryEntry } from '@/types/domain'

interface AnswerHistoryTabProps {
  inspectionId: string
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; entries: AnswerHistoryEntry[] }
  | { status: 'not-found' }
  | { status: 'error' }

/** Groups answer entries by section, then by item, preserving the API (deterministic) order. */
function groupBySectionAndItem(entries: AnswerHistoryEntry[]) {
  const sections = new Map<string, Map<string, { itemTitle: string; versions: AnswerHistoryEntry[] }>>()
  for (const entry of entries) {
    if (!sections.has(entry.section)) sections.set(entry.section, new Map())
    const items = sections.get(entry.section)!
    if (!items.has(entry.itemId)) items.set(entry.itemId, { itemTitle: entry.itemTitle, versions: [] })
    items.get(entry.itemId)!.versions.push(entry)
  }
  return Array.from(sections.entries()).map(([section, items]) => ({
    section,
    items: Array.from(items.entries()).map(([itemId, value]) => ({ itemId, ...value })),
  }))
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function AnswerHistoryTab({ inspectionId }: AnswerHistoryTabProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const entries = await inspectionAnswersApi.getInspectionAnswersHistory(inspectionId)
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

  const grouped = useMemo(
    () => (state.status === 'ready' ? groupBySectionAndItem(state.entries) : []),
    [state],
  )

  if (state.status === 'loading') {
    return (
      <Card className="flex min-h-40 items-center justify-center gap-2 p-6 text-sm text-muted" role="status">
        <Loader2 className="animate-spin" size={18} />
        Carregando historico de respostas...
      </Card>
    )
  }

  if (state.status === 'error') {
    return (
      <Card className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex items-center gap-2 text-sm font-medium text-danger">
          <AlertCircle size={18} />
          Nao foi possivel carregar o historico de respostas.
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
        title="Inspecao nao encontrada"
        description="A inspecao solicitada nao existe ou foi removida."
      />
    )
  }

  if (grouped.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Nenhum historico de respostas encontrado"
        description="Esta inspecao ainda nao possui respostas registradas."
      />
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ section, items }) => (
        <Card key={section} className="p-5">
          <h2 className="mb-4 text-base font-semibold">{section}</h2>
          <div className="space-y-5">
            {items.map((item) => (
              <div key={item.itemId} className="rounded-fieldops border border-border bg-slate-50 p-4">
                <p className="font-medium">{item.itemTitle}</p>
                <ol className="mt-3 space-y-3">
                  {item.versions.map((version, index) => (
                    <li
                      key={`${item.itemId}-${index}`}
                      className="rounded-fieldops border border-border bg-white p-3 text-sm"
                    >
                      <p>
                        <span className="font-semibold">Valor:</span>{' '}
                        {version.value ?? '-'}
                      </p>
                      <p className="mt-1 text-muted">
                        <span className="font-semibold text-text">Observacao:</span>{' '}
                        {version.observation ?? '-'}
                      </p>
                      <p className="mt-1 text-muted">
                        <span className="font-semibold text-text">Data:</span>{' '}
                        {formatDateTime(version.answeredAt)}
                      </p>
                      <p className="mt-1 text-muted">
                        <span className="font-semibold text-text">Respondido por:</span>{' '}
                        {version.answeredBy ?? '-'}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
