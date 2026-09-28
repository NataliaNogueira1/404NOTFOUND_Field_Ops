import { ArrowLeft, CheckCircle2, FileText, XCircle } from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SeverityBadge } from '@/components/badges/Badge'
import { ConfirmDialog, Modal } from '@/components/feedback/Modal'
import { Lightbox, PhotoThumbnails, type LightboxPhoto } from '@/components/feedback/Lightbox'
import { Toast } from '@/components/feedback/Toast'
import { Textarea } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { byId, clients, equipment, nonConformities, reviewAnswers, sites, users } from '@/mocks/domain'
import { inspectionStore } from '@/state/mockStores'
import { InspectionStatus } from '@/types/domain'

export function InspectionReviewPage() {
  const { id = 'ins-compressor' } = useParams()
  const navigate = useNavigate()
  const inspections = useSyncExternalStore(inspectionStore.subscribe, inspectionStore.adminSnapshot, inspectionStore.adminSnapshot)
  const inspection = byId(inspections, id) ?? inspections[0]
  const client = byId(clients, inspection.clientId)
  const site = byId(sites, inspection.siteId)
  const item = byId(equipment, inspection.equipmentId)
  const tech = byId(users, inspection.technicianId)

  const [approve, setApprove] = useState(false)
  const [reject, setReject] = useState(false)
  const [reason, setReason] = useState('')
  const [toast, setToast] = useState(false)

  // Lightbox state — null means closed, otherwise holds the list and starting index
  const [lightboxPhotos, setLightboxPhotos] = useState<LightboxPhoto[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(-1)

  const canceled = inspection.status === InspectionStatus.CANCELED

  // All photos from the inspection (one per answer that has evidence)
  const allPhotos = useMemo<LightboxPhoto[]>(() => reviewAnswers
    .filter(answer => Boolean(answer.evidence))
    .map(answer => ({
      src: answer.evidence!,
      item: answer.question,
      capturedAt: answer.evidenceCapturedAt,
      location: answer.evidenceLocation,
    })),
  [])

  const grouped = useMemo(() =>
    Object.entries(
      reviewAnswers.reduce<Record<string, typeof reviewAnswers>>((acc, answer) => {
        acc[answer.section] = [...(acc[answer.section] ?? []), answer]
        return acc
      }, {}),
    ),
  [])

  function openLightbox(photos: LightboxPhoto[], startIndex: number) {
    setLightboxPhotos(photos)
    setLightboxIndex(startIndex)
  }

  function closeLightbox() {
    setLightboxIndex(-1)
  }

  function done(message: string) {
    setApprove(false)
    setReject(false)
    setToast(true)
    setTimeout(() => setToast(false), 1800)
    console.info(message)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/inspections">
            <ArrowLeft size={16} />Inspecoes
          </Link>
          <h1 className="text-2xl font-semibold">Revisao da inspecao</h1>
          <p className="text-sm text-muted">{inspection.title} - {item?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(`/app/inspections/${id}/report`)}>
            <FileText size={17} />Relatorio PDF
          </Button>
          {canceled
            ? <Button disabled>Inspecao cancelada</Button>
            : <>
                <Button onClick={() => setApprove(true)}><CheckCircle2 size={17} />Aprovar</Button>
                <Button variant="danger" onClick={() => setReject(true)}><XCircle size={17} />Reprovar</Button>
              </>
          }
        </div>
      </div>

      {canceled && (
        <Card className="border-danger-light/40 bg-danger-light/10 p-4 text-sm font-medium text-danger-dark">
          Esta inspecao foi cancelada e nao esta disponivel para revisao.
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-5">
        <Summary label="Tecnico" value={tech?.name} />
        <Summary label="Cliente" value={client?.name} />
        <Summary label="Local" value={site?.name} />
        <Summary label="Duracao" value="50 min" />
        <Summary label="Resultado" value={canceled ? 'Cancelada' : '8 conformes / 4 nao conformes'} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        {/* Checklist sections */}
        <div className="space-y-4">
          {grouped.map(([section, answers]) => {
            // Build a photo list scoped to this section for "open all" navigation
            const sectionPhotos: LightboxPhoto[] = answers
              .filter(answer => Boolean(answer.evidence))
              .map(answer => ({
                src: answer.evidence!,
                item: answer.question,
                capturedAt: answer.evidenceCapturedAt,
                location: answer.evidenceLocation,
              }))

            return (
              <Card key={section} className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold">{section}</h2>
                  <span className="text-sm text-muted">
                    {answers.filter(a => !a.nonConformityId).length}/{answers.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {answers.map((answer, index) => {
                    // Photo for this single item
                    const itemPhoto: LightboxPhoto | null = answer.evidence
                      ? {
                          src: answer.evidence,
                          item: answer.question,
                          capturedAt: answer.evidenceCapturedAt,
                          location: answer.evidenceLocation,
                        }
                      : null

                    // Index of this item's photo within sectionPhotos (for navigation)
                    const photoIndexInSection = sectionPhotos.findIndex(p => p.src === answer.evidence)

                    return (
                      <div key={answer.id} className="rounded-fieldops border border-border bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">{index + 1}. {answer.question}</p>
                            <p className={answer.nonConformityId ? 'mt-2 text-sm font-semibold text-danger' : 'mt-2 text-sm font-semibold text-success-dark'}>
                              {answer.result}
                            </p>
                          </div>
                        </div>

                        {/* Thumbnail(s) for this item */}
                        {itemPhoto && (
                          <PhotoThumbnails
                            photos={[itemPhoto]}
                            onOpen={() => openLightbox(sectionPhotos, photoIndexInSection >= 0 ? photoIndexInSection : 0)}
                          />
                        )}

                        <p className="mt-3 text-sm text-muted">Observacao: {answer.observation}</p>

                        {answer.nonConformityId && (
                          <div className="mt-3 rounded-fieldops border border-warning/40 bg-amber-50 p-3 text-sm">
                            <p className="font-semibold text-warning-dark">Nao conformidade vinculada</p>
                            <p className="text-muted">{byId(nonConformities, answer.nonConformityId)?.title}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Open all photos of this section */}
                {sectionPhotos.length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" className="h-8 text-sm" onClick={() => openLightbox(sectionPhotos, 0)}>
                      Ver todas as fotos da secao ({sectionPhotos.length})
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {/* Non-conformities sidebar */}
        <Card className="h-fit p-5">
          <h2 className="text-base font-semibold">Nao conformidades</h2>
          <p className="mb-4 text-sm text-muted">4 registros encontrados nesta inspecao</p>
          <div className="space-y-3">
            {nonConformities.map(nc => (
              <div key={nc.id} className="rounded-fieldops border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{nc.title}</p>
                  <SeverityBadge severity={nc.severity} />
                </div>
                <p className="mt-1 text-xs text-muted">{nc.item}</p>
              </div>
            ))}
          </div>

          {/* Quick access: open all inspection photos */}
          {allPhotos.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium">Fotografias da inspecao</p>
              <PhotoThumbnails
                photos={allPhotos.slice(0, 6)}
                onOpen={index => openLightbox(allPhotos, index)}
              />
              {allPhotos.length > 6 && (
                <button
                  className="mt-2 text-xs font-semibold text-primary hover:underline"
                  onClick={() => openLightbox(allPhotos, 0)}
                >
                  +{allPhotos.length - 6} mais fotos
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Lightbox */}
      <Lightbox
        photos={lightboxPhotos}
        initialIndex={lightboxIndex}
        onClose={closeLightbox}
      />

      <ConfirmDialog
        open={approve}
        title="Aprovar inspecao?"
        description="Esta aprovacao e simulada e altera apenas o estado visual do prototipo."
        confirmLabel="Aprovar inspecao"
        onCancel={() => setApprove(false)}
        onConfirm={() => done('approved')}
      />

      <Modal
        open={reject}
        title="Reprovar inspecao"
        onClose={() => setReject(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReject(false)}>Cancelar</Button>
            <Button variant="danger" disabled={reason.length < 10} onClick={() => done('rejected')}>
              Confirmar Reprovacao
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea label="Motivo da reprovacao" id="reject-reason" value={reason} onChange={e => setReason(e.target.value)} />
          <div className="space-y-2">
            <p className="text-sm font-medium">Itens para correcao</p>
            {reviewAnswers.slice(0, 6).map(answer => (
              <label key={answer.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={Boolean(answer.nonConformityId)} />
                {answer.question}
              </label>
            ))}
          </div>
          {reason.length > 0 && reason.length < 10 && (
            <p className="text-xs text-danger">Informe pelo menos 10 caracteres.</p>
          )}
        </div>
      </Modal>

      <Toast show={toast} message="Decisao registrada no prototipo" />
    </div>
  )
}

function Summary({ label, value }: { label: string; value?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </Card>
  )
}
