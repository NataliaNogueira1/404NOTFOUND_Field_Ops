import { AlertCircle, ArrowLeft, Download, FileText, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { inspectionReviewApi, type InspectionReview } from '@/api/inspectionReview'
import { inspectionReportApi } from '@/api/inspectionReport'
import { PriorityBadge, SeverityBadge, StatusBadge } from '@/components/badges/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState =
  | { type: 'loading' }
  | { type: 'ready'; review: InspectionReview }
  | { type: 'not-found' }
  | { type: 'error'; message: string }

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InspectionReportPage() {
  const { id = '' } = useParams()

  const [state, setState] = useState<PageState>({ type: 'loading' })
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  // ── Load review data from the real API ──────────────────────────────────────
  const load = useCallback(async () => {
    setState({ type: 'loading' })
    try {
      const review = await inspectionReviewApi.get(id)
      setState({ type: 'ready', review })
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setState({ type: 'not-found' })
      } else {
        const message =
          error instanceof ApiError ? error.message : 'Nao foi possivel carregar os dados da inspecao.'
        setState({ type: 'error', message })
      }
    }
  }, [id])

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timeout)
  }, [load])

  // ── Download PDF from the backend API ───────────────────────────────────────
  async function handleDownload() {
    setDownloading(true)
    setDownloadError(null)
    try {
      await inspectionReportApi.downloadPdf(id)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Nao foi possivel gerar o PDF. Tente novamente.'
      setDownloadError(message)
    } finally {
      setDownloading(false)
    }
  }

  // ── Loading / error states ───────────────────────────────────────────────────
  if (state.type === 'loading') {
    return (
      <Card role="status" className="flex min-h-48 items-center justify-center gap-2 p-6 text-muted">
        <Loader2 className="animate-spin" size={18} />
        Carregando relatorio...
      </Card>
    )
  }

  if (state.type === 'not-found') {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Inspecao nao encontrada"
        description="A inspecao solicitada nao existe ou foi removida."
      />
    )
  }

  if (state.type === 'error') {
    return (
      <Card className="flex min-h-48 flex-col items-center justify-center gap-3 p-6">
        <p role="alert" className="text-danger">
          {state.message}
        </p>
        <Button variant="secondary" onClick={() => void load()}>
          Tentar novamente
        </Button>
      </Card>
    )
  }

  const { review } = state

  return <ReportContent id={id} review={review} downloading={downloading} downloadError={downloadError} onDownload={() => void handleDownload()} />
}

// ─── ReportContent (extracted to keep the main component lean) ────────────────

interface ReportContentProps {
  id: string
  review: InspectionReview
  downloading: boolean
  downloadError: string | null
  onDownload: () => void
}

function ReportContent({ id, review, downloading, downloadError, onDownload }: ReportContentProps) {
  const allItems = useMemo(
    () => review.sections.flatMap((section) => section.items),
    [review.sections],
  )

  const answeredItems = allItems.filter((item) => item.answer !== null)
  const nonConformingItems = allItems.filter((item) => isNonConforming(item.answer))
  const conformeCount = answeredItems.length - nonConformingItems.length
  const ncCount = nonConformingItems.length
  const totalAnswered = answeredItems.length
  const conformityPercent =
    totalAnswered > 0 ? Math.round((conformeCount / totalAnswered) * 100) : 0
  const conformityColor =
    conformityPercent >= 80
      ? 'text-success-dark'
      : conformityPercent >= 50
        ? 'text-warning'
        : 'text-danger'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            to={`/app/inspections/${id}/review`}
          >
            <ArrowLeft size={16} />
            Voltar para revisao
          </Link>
          <h1 className="text-2xl font-semibold">Relatorio da inspecao</h1>
          <p className="text-sm text-muted">{review.title}</p>
        </div>

        <Button onClick={onDownload} disabled={downloading} className="gap-2">
          <Download size={17} />
          {downloading ? 'Gerando PDF...' : 'Baixar PDF'}
        </Button>
      </div>

      {/* Preview notice */}
      <Card className="flex items-start gap-3 border-primary/30 bg-primary/5 p-4">
        <FileText size={18} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-primary">Pre-visualizacao do relatorio</p>
          <p className="text-sm text-muted">
            O PDF sera gerado pelo servidor com todos os dados oficiais da inspecao. Clique em
            &quot;Baixar PDF&quot; para salvar o arquivo.
          </p>
        </div>
      </Card>

      {downloadError && (
        <Card className="border-danger/30 bg-danger/5 p-4" role="alert">
          <p className="text-sm font-semibold text-danger">{downloadError}</p>
        </Card>
      )}

      {/* Info grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Tecnico" value={review.technicianName} />
        <InfoCard label="Cliente" value={review.clientName} />
        <InfoCard label="Local" value={review.siteName} />
        <InfoCard label="Equipamento" value={review.equipmentName ?? '-'} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Status">
          <StatusBadge status={review.status} />
        </InfoCard>
        <InfoCard label="Prioridade">
          <PriorityBadge priority={review.priority} />
        </InfoCard>
        <InfoCard label="Prazo" value={formatDate(review.dueDate)} />
        <InfoCard label="Progresso" value={`${review.progress}%`} />
      </section>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox label="Total respondidos" value={String(totalAnswered)} color="text-primary" />
        <StatBox label="Conformes" value={String(conformeCount)} color="text-success-dark" />
        <StatBox label="Nao conformes" value={String(ncCount)} color="text-danger" />
        <StatBox label="Conformidade" value={`${conformityPercent}%`} color={conformityColor} />
      </div>

      {/* Checklist preview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Checklist</h2>
        {review.sections.map((section) => (
          <Card key={`${section.order}-${section.title}`} className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-primary">{section.title}</h3>
            <div className="divide-y divide-border">
              {section.items.map((item, idx) => {
                const nc = isNonConforming(item.answer)
                return (
                  <div
                    key={item.snapshotId}
                    className="flex items-start justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="mr-2 text-xs font-medium text-muted">{idx + 1}.</span>
                        {item.title}
                      </p>
                      {item.observation && (
                        <p className="mt-0.5 text-xs text-muted">Obs: {item.observation}</p>
                      )}
                    </div>
                    <span
                      className={
                        nc
                          ? 'shrink-0 text-xs font-bold text-danger'
                          : item.answer === null
                            ? 'shrink-0 text-xs font-bold text-warning-dark'
                            : 'shrink-0 text-xs font-bold text-success-dark'
                      }
                    >
                      {item.answer === null ? 'Pendente' : nc ? 'NAO CONFORME' : item.answer}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}

        {review.sections.length === 0 && (
          <Card className="p-5">
            <p className="text-sm text-muted">Nenhum item de checklist registrado.</p>
          </Card>
        )}
      </div>

      {/* Non-conformities preview */}
      {review.nonConformities.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Nao conformidades ({review.nonConformities.length})
          </h2>
          <Card className="divide-y divide-border">
            {review.nonConformities.map((nc) => (
              <div key={nc.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{nc.title}</p>
                  <p className="text-xs text-muted">{nc.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <SeverityBadge severity={nc.severity} />
                  <span className="text-xs text-muted">{nc.status}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoCard({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1">
        {children ?? <p className="text-sm font-semibold">{value ?? '-'}</p>}
      </div>
    </Card>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card className="p-4 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </Card>
  )
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function isNonConforming(answer: string | null): boolean {
  return answer?.trim().toUpperCase() === 'NON_CONFORMING'
}

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return isoString
  return d.toLocaleDateString('pt-BR')
}
