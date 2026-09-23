import { ArrowLeft, Download, FileText } from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PriorityBadge, SeverityBadge, StatusBadge } from '@/components/badges/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { byId, clients, equipment, nonConformities, reviewAnswers, sites, users } from '@/mocks/domain'
import { inspectionStore } from '@/state/mockStores'
import { generateInspectionPdf } from '@/utils/generateInspectionPdf'

// ─── Page ─────────────────────────────────────────────────────────────────────

export function InspectionReportPage() {
  const { id = 'ins-compressor' } = useParams()

  const inspections = useSyncExternalStore(
    inspectionStore.subscribe,
    inspectionStore.adminSnapshot,
    inspectionStore.adminSnapshot,
  )
  const inspection = byId(inspections, id) ?? inspections[0]

  const client = byId(clients, inspection.clientId)
  const site = byId(sites, inspection.siteId)
  const equip = byId(equipment, inspection.equipmentId)
  const tech = byId(users, inspection.technicianId)
  const supervisor = byId(users, inspection.supervisorId ?? '')

  const [downloading, setDownloading] = useState(false)

  const inspectionNcs = useMemo(
    () => nonConformities.filter(nc => nc.inspectionId === inspection.id),
    [inspection.id],
  )

  const grouped = useMemo(
    () =>
      Object.entries(
        reviewAnswers.reduce<Record<string, typeof reviewAnswers>>((acc, a) => {
          acc[a.section] = [...(acc[a.section] ?? []), a]
          return acc
        }, {}),
      ),
    [],
  )

  const conformeCount = reviewAnswers.filter(a => !a.nonConformityId).length
  const ncCount = reviewAnswers.filter(a => Boolean(a.nonConformityId)).length

  function handleDownload() {
    setDownloading(true)
    // Small timeout to let the button state render before the (sync) PDF generation
    setTimeout(() => {
      try {
        generateInspectionPdf({
          inspection,
          technicianName: tech?.name ?? '-',
          clientName: client?.name ?? '-',
          siteName: site?.name ?? '-',
          equipmentName: equip?.name ?? '-',
          supervisorName: supervisor?.name ?? (inspection.supervisorName ?? '-'),
          reviewAnswers,
          nonConformities: inspectionNcs,
        })
      } finally {
        setDownloading(false)
      }
    }, 50)
  }

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
          <p className="text-sm text-muted">{inspection.title}</p>
        </div>

        <Button onClick={handleDownload} disabled={downloading} className="gap-2">
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
            O PDF sera gerado com as informacoes abaixo. Clique em &quot;Baixar PDF&quot; para
            salvar o arquivo. Os dados exibidos sao os mesmos que constam na revisao da inspecao.
          </p>
        </div>
      </Card>

      {/* Info grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Tecnico" value={tech?.name} />
        <InfoCard label="Cliente" value={client?.name} />
        <InfoCard label="Local" value={site?.name} />
        <InfoCard label="Equipamento" value={equip?.name} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Status">
          <StatusBadge status={inspection.status} />
        </InfoCard>
        <InfoCard label="Prioridade">
          <PriorityBadge priority={inspection.priority} />
        </InfoCard>
        <InfoCard label="Prazo" value={new Date(inspection.dueDate).toLocaleDateString('pt-BR')} />
        <InfoCard label="Supervisor" value={supervisor?.name ?? inspection.supervisorName ?? '-'} />
      </section>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatBox label="Total de itens" value={reviewAnswers.length} color="text-primary" />
        <StatBox label="Conformes" value={conformeCount} color="text-success-dark" />
        <StatBox label="Nao conformes" value={ncCount} color="text-danger" />
      </div>

      {/* Checklist preview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Checklist</h2>
        {grouped.map(([section, answers]) => (
          <Card key={section} className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-primary">{section}</h3>
            <div className="divide-y divide-border">
              {answers.map((answer, idx) => (
                <div key={answer.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="mr-2 text-xs font-medium text-muted">{idx + 1}.</span>
                      {answer.question}
                    </p>
                    {answer.observation && (
                      <p className="mt-0.5 text-xs text-muted">Obs: {answer.observation}</p>
                    )}
                  </div>
                  <span
                    className={
                      answer.nonConformityId
                        ? 'shrink-0 text-xs font-bold text-danger'
                        : 'shrink-0 text-xs font-bold text-success-dark'
                    }
                  >
                    {answer.result}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Non-conformities preview */}
      {inspectionNcs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Nao conformidades ({inspectionNcs.length})</h2>
          <Card className="divide-y divide-border">
            {inspectionNcs.map(nc => (
              <div key={nc.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{nc.title}</p>
                  <p className="text-xs text-muted">{nc.item}</p>
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

      {/* Supervisor instructions */}
      {inspection.supervisorInstructions && (
        <Card className="p-4">
          <p className="mb-1 text-sm font-semibold">Instrucoes do supervisor</p>
          <p className="text-sm text-muted">{inspection.supervisorInstructions}</p>
        </Card>
      )}

      {/* Download CTA (bottom) */}
      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={handleDownload} disabled={downloading}>
          <Download size={17} />
          {downloading ? 'Gerando PDF...' : 'Baixar PDF'}
        </Button>
      </div>
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

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-4 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </Card>
  )
}
