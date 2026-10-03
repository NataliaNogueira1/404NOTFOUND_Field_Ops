import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { inspectionReviewApi, type InspectionReview, type ReviewEvidence } from '@/api/inspectionReview'
import { ApiError } from '@/api/client'
import { SeverityBadge, StatusBadge } from '@/components/badges/Badge'
import { ConfirmDialog, Modal } from '@/components/feedback/Modal'
import { Lightbox, PhotoThumbnails, type LightboxPhoto } from '@/components/feedback/Lightbox'
import { Toast } from '@/components/feedback/Toast'
import { Textarea } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'
import { AnswerHistoryTab } from './AnswerHistoryTab'

type State = { type: 'loading' } | { type: 'ready'; review: InspectionReview } | { type: 'not-found' } | { type: 'error' }

export function InspectionReviewPage() {
  const { id = '' } = useParams(); const navigate = useNavigate()
  const [state, setState] = useState<State>({ type: 'loading' }); const [tab, setTab] = useState<'review' | 'history'>('review')
  const [approveOpen, setApproveOpen] = useState(false); const [rejectOpen, setRejectOpen] = useState(false); const [reason, setReason] = useState(''); const [pending, setPending] = useState(false); const [toast, setToast] = useState('')
  const [photos, setPhotos] = useState<LightboxPhoto[]>([]); const [index, setIndex] = useState(-1)
  useEffect(() => () => { photos.forEach(photo => { if (photo.src.startsWith('blob:')) URL.revokeObjectURL(photo.src) }) }, [photos])
  const openEvidence = useCallback(async (values: LightboxPhoto[], selected: number) => {
    const loaded = await Promise.all(values.map(async value => {
      try { return { ...value, src: await inspectionReviewApi.loadEvidenceImage(value.contentUrl ?? '') } }
      catch { return { ...value, loadError: true } }
    }))
    setPhotos(loaded); setIndex(selected)
  }, [])
  const load = useCallback(async () => { setState({ type: 'loading' }); try { setState({ type: 'ready', review: await inspectionReviewApi.get(id) }) } catch (error) { setState(error instanceof ApiError && error.status === 404 ? { type: 'not-found' } : { type: 'error' }) } }, [id])
  useEffect(() => { const pendingLoad = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(pendingLoad) }, [load])
  if (state.type === 'loading') return <Card role="status" className="flex min-h-48 items-center justify-center gap-2 p-6 text-muted"><Loader2 className="animate-spin" size={18} />Carregando revisao...</Card>
  if (state.type === 'not-found') return <EmptyState icon={AlertCircle} title="Inspecao nao encontrada" description="A inspecao solicitada nao existe ou foi removida." />
  if (state.type === 'error') return <Card className="flex min-h-48 flex-col items-center justify-center gap-3 p-6"><p role="alert" className="text-danger">Nao foi possivel carregar a revisao.</p><Button variant="secondary" onClick={() => void load()}>Tentar novamente</Button></Card>
  const { review } = state; const allowed = review.status === 'UNDER_REVIEW'
  async function decide(action: 'approve' | 'reject') { if (pending) return; setPending(true); try { if (action === 'approve') await inspectionReviewApi.approve(id); else await inspectionReviewApi.reject(id, reason); setApproveOpen(false); setRejectOpen(false); setReason(''); setToast(action === 'approve' ? 'Inspecao aprovada.' : 'Inspecao reprovada.'); await load() } catch (error) { setToast(error instanceof ApiError ? error.message : 'Nao foi possivel registrar a decisao.') } finally { setPending(false) } }
  return <div className="space-y-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/inspections"><ArrowLeft size={16} />Inspecoes</Link><h1 className="text-2xl font-semibold">Revisao da inspecao</h1><p className="text-sm text-muted">{review.title}{review.equipmentName ? ` - ${review.equipmentName}` : ''}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => navigate(`/app/inspections/${id}/report`)}><FileText size={17} />Relatorio PDF</Button><Button disabled={!allowed || pending} onClick={() => setApproveOpen(true)}><CheckCircle2 size={17} />Aprovar</Button><Button variant="danger" disabled={!allowed || pending} onClick={() => setRejectOpen(true)}><XCircle size={17} />Reprovar</Button></div></div>{!allowed && <Card className="border-warning/40 bg-warning/10 p-4 text-sm text-warning-dark">Esta inspecao esta em {review.status} e nao pode receber uma nova decisao de revisao.</Card>}<div className="flex gap-1 border-b border-border" role="tablist"><Tab active={tab === 'review'} onClick={() => setTab('review')}>Revisao</Tab><Tab active={tab === 'history'} onClick={() => setTab('history')}>Historico de respostas</Tab></div>{tab === 'history' ? <AnswerHistoryTab inspectionId={id} /> : <Content review={review} onOpen={(list, selected) => void openEvidence(list, selected)} />}<Lightbox photos={photos} initialIndex={index} onClose={() => setIndex(-1)} /><ConfirmDialog open={approveOpen} title="Aprovar inspecao?" description="A decisao sera registrada e a inspecao passara para aprovada." confirmLabel={pending ? 'Aprovando...' : 'Aprovar inspecao'} confirmDisabled={pending} onCancel={() => setApproveOpen(false)} onConfirm={() => void decide('approve')} /><Modal open={rejectOpen} title="Reprovar inspecao" onClose={() => setRejectOpen(false)} footer={<><Button variant="secondary" disabled={pending} onClick={() => setRejectOpen(false)}>Cancelar</Button><Button variant="danger" disabled={pending || reason.trim().length < 10} onClick={() => void decide('reject')}>{pending ? 'Enviando...' : 'Confirmar reprovacao'}</Button></>}><Textarea label="Motivo da reprovacao" id="reject-reason" value={reason} error={reason.length > 0 && reason.trim().length < 10 ? 'Informe pelo menos 10 caracteres.' : undefined} onChange={event => setReason(event.target.value)} /></Modal><Toast show={Boolean(toast)} message={toast} /></div>
}

function Content({ review, onOpen }: { review: InspectionReview; onOpen: (photos: LightboxPhoto[], index: number) => void }) {
  const counts = useMemo(() => review.sections.flatMap(section => section.items).reduce((value, item) => ({ total: value.total + 1, answered: value.answered + Number(item.answer !== null) }), { total: 0, answered: 0 }), [review]); const allPhotos = review.sections.flatMap(section => section.items.flatMap(item => item.evidences.map(evidence => photo(evidence, item.title))))
  return <>
    <section className="grid gap-4 md:grid-cols-5"><Summary label="Tecnico" value={review.technicianName} /><Summary label="Cliente" value={review.clientName} /><Summary label="Local" value={review.siteName} /><Summary label="Prazo" value={review.dueDate} /><Summary label="Respostas" value={`${counts.answered}/${counts.total}`} /></section>
    {review.sections.length > 1 && <nav aria-label="Navegacao por secao" className="flex flex-wrap gap-2"><span className="self-center text-sm font-medium text-muted">Ir para:</span>{review.sections.map(section => <a key={`${section.order}-${section.title}`} href={`#review-section-${section.order}`} className="focus-ring rounded-fieldops border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-light/20">{section.title}</a>)}</nav>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]"><div className="space-y-4">
      {review.sections.map(section => <Card key={`${section.order}-${section.title}`} id={`review-section-${section.order}`} className="scroll-mt-24 p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">{section.title}</h2><span className="text-sm text-muted">{section.items.filter(item => item.answer !== null).length}/{section.items.length}</span></div>
        {section.items.length === 0 ? <p className="text-sm text-muted">Esta secao nao possui itens.</p> : <div className="space-y-4">{section.items.map((item, itemIndex) => {
          const itemPhotos = item.evidences.map(evidence => photo(evidence, item.title))
          const nonConforming = isNonConforming(item.answer)
          return <div key={item.snapshotId} className={cn('rounded-fieldops border p-4', nonConforming ? 'border-danger/50 bg-danger-light/10' : 'border-border bg-app-bg/60')}><p className="font-medium">{itemIndex + 1}. {item.title}</p><p className="mt-1 text-xs text-muted">Tipo: {item.responseType}</p>{item.answer === null ? <p className="mt-2 text-sm font-semibold text-warning-dark">Nao respondido</p> : <p className={cn('mt-2 text-sm font-semibold', nonConforming ? 'text-danger-dark' : 'text-success-dark')}>{nonConforming ? 'Resposta nao conforme' : 'Resposta'}: {item.answer}</p>}{item.observation && <p className="mt-3 text-sm text-muted">Observacao: {item.observation}</p>}{item.answeredBy && <p className="mt-1 text-xs text-muted">Respondido por {item.answeredBy}</p>}{itemPhotos.length ? <PhotoThumbnails photos={itemPhotos} onOpen={selected => onOpen(itemPhotos, selected)} /> : <p className="mt-3 text-xs text-muted">Sem evidencias associadas a este item.</p>}{item.nonConformities.map(nc => <div key={nc.id} className="mt-3 rounded-fieldops border border-warning/40 bg-warning/10 p-3 text-sm"><div className="flex justify-between gap-2"><p className="font-semibold text-warning-dark">Nao conformidade: {nc.title}</p><SeverityBadge severity={nc.severity} /></div><p className="mt-1 text-muted">{nc.description}</p></div>)}</div>
        })}</div>}</Card>)}
    </div><Card className="h-fit p-5"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">Nao conformidades</h2><StatusBadge status={review.status} /></div><p className="mb-4 text-sm text-muted">{review.nonConformities.length} registros encontrados</p>{review.nonConformities.length === 0 ? <p className="text-sm text-muted">Nenhuma nao conformidade relacionada.</p> : <div className="space-y-3">{review.nonConformities.map(nc => <div key={nc.id} className="rounded-fieldops border border-border p-3"><div className="flex justify-between gap-2"><p className="font-medium">{nc.title}</p><SeverityBadge severity={nc.severity} /></div><p className="mt-1 text-sm text-muted">{nc.description}</p></div>)}</div>}{allPhotos.length > 0 && <div className="mt-5 border-t border-border pt-4"><p className="mb-3 text-sm font-medium">Fotografias da inspecao</p><PhotoThumbnails photos={allPhotos.slice(0, 6)} onOpen={selected => onOpen(allPhotos, selected)} /></div>}</Card></div>
  </>
}
function photo(value: ReviewEvidence, item: string): LightboxPhoto { return { src: '', contentUrl: value.contentUrl, item, capturedAt: value.capturedAt, location: value.location ?? undefined, description: value.description ?? undefined } }
function isNonConforming(answer: string | null) { return answer?.trim().toUpperCase() === 'NON_CONFORMING' }
function Summary({ label, value }: { label: string; value: string }) { return <Card className="p-4"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></Card> }
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn('focus-ring -mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors', active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text')}>{children}</button> }
