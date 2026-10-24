import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, MapPin, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { inspectionReviewApi, type InspectionReview, type ReviewEvidence, type ReviewComment, type ReviewLocation } from '@/api/inspectionReview'
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
import { formatDate } from '@/utils/formatDate'
import { AuditTimeline } from '@/components/inspections/AuditTimeline'
import { AnswerHistoryTab } from './AnswerHistoryTab'

type State = { type: 'loading' } | { type: 'ready'; review: InspectionReview; comments: ReviewComment[] } | { type: 'not-found' } | { type: 'error' }

export function InspectionReviewPage() {
  const { id = '' } = useParams(); const navigate = useNavigate()
  const [state, setState] = useState<State>({ type: 'loading' }); const [tab, setTab] = useState<'review' | 'history' | 'audit'>('review')
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
  const load = useCallback(async () => { setState({ type: 'loading' }); try { const review = await inspectionReviewApi.get(id); setState({ type: 'ready', review, comments: [] }); void inspectionReviewApi.listComments(id).then(comments => setState({ type: 'ready', review, comments })).catch(() => undefined) } catch (error) { setState(error instanceof ApiError && error.status === 404 ? { type: 'not-found' } : { type: 'error' }) } }, [id])
  useEffect(() => { const pendingLoad = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(pendingLoad) }, [load])
  if (state.type === 'loading') return <Card role="status" className="flex min-h-48 items-center justify-center gap-2 p-6 text-muted"><Loader2 className="animate-spin" size={18} />Carregando revisão...</Card>
  if (state.type === 'not-found') return <EmptyState icon={AlertCircle} title="Inspeção não encontrada" description="A inspeção solicitada não existe ou foi removida." />
  if (state.type === 'error') return <Card className="flex min-h-48 flex-col items-center justify-center gap-3 p-6"><p role="alert" className="text-danger">Não foi possível carregar a revisão.</p><Button variant="secondary" onClick={() => void load()}>Tentar novamente</Button></Card>
  const { review } = state; const allowed = review.status === 'UNDER_REVIEW'; const canBeginReview = review.status === 'SUBMITTED'
  async function beginReview() { if (pending) return; setPending(true); try { await inspectionReviewApi.beginReview(id); setToast('Revisão iniciada.'); await load() } catch (error) { setToast(error instanceof ApiError ? error.message : 'Não foi possível iniciar a revisão.') } finally { setPending(false) } }
  async function decide(action: 'approve' | 'reject') { if (pending) return; setPending(true); try { if (action === 'approve') await inspectionReviewApi.approve(id); else await inspectionReviewApi.reject(id, reason); setApproveOpen(false); setRejectOpen(false); setReason(''); setToast(action === 'approve' ? 'Inspeção aprovada.' : 'Inspeção reprovada.'); await load() } catch (error) { setToast(error instanceof ApiError ? error.message : 'Não foi possível registrar a decisão.') } finally { setPending(false) } }
  return <div className="space-y-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/inspections"><ArrowLeft size={16} />Inspeções</Link><h1 className="text-2xl font-semibold">Revisão da inspeção</h1><p className="text-sm text-muted">{review.title}{review.equipmentName ? ` - ${review.equipmentName}` : ''}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => navigate(`/app/inspections/${id}/report`)}><FileText size={17} />Relatório PDF</Button>{canBeginReview && <Button disabled={pending} onClick={() => void beginReview()}>Iniciar revisão</Button>}<Button disabled={!allowed || pending} onClick={() => setApproveOpen(true)}><CheckCircle2 size={17} />Aprovar</Button><Button variant="danger" disabled={!allowed || pending} onClick={() => setRejectOpen(true)}><XCircle size={17} />Reprovar</Button></div></div>{!allowed && !canBeginReview && <Card className="border-warning/40 bg-warning/10 p-4 text-sm text-warning-dark">Esta inspeção está em {review.status} e não pode receber uma nova decisão de revisão.</Card>}<div className="flex gap-1 border-b border-border" role="tablist"><Tab active={tab === 'review'} onClick={() => setTab('review')}>Revisão</Tab><Tab active={tab === 'history'} onClick={() => setTab('history')}>Histórico de respostas</Tab><Tab active={tab === 'audit'} onClick={() => setTab('audit')}>Auditoria</Tab></div>{tab === 'history' ? <AnswerHistoryTab inspectionId={id} /> : tab === 'audit' ? <AuditTimeline inspectionId={id} /> : <Content review={review} comments={state.comments} inspectionId={id} onCommentsChanged={load} onOpen={(list, selected) => void openEvidence(list, selected)} />}<Lightbox photos={photos} initialIndex={index} onClose={() => setIndex(-1)} /><ConfirmDialog open={approveOpen} title="Aprovar inspeção?" description="A decisão será registrada e a inspeção passará para aprovada." confirmLabel={pending ? 'Aprovando...' : 'Aprovar inspeção'} confirmDisabled={pending} onCancel={() => setApproveOpen(false)} onConfirm={() => void decide('approve')} /><Modal open={rejectOpen} title="Reprovar inspeção" onClose={() => setRejectOpen(false)} footer={<><Button variant="secondary" disabled={pending} onClick={() => setRejectOpen(false)}>Cancelar</Button><Button variant="danger" disabled={pending || reason.trim().length < 10} onClick={() => void decide('reject')}>{pending ? 'Enviando...' : 'Confirmar reprovação'}</Button></>}><Textarea label="Motivo da reprovação" id="reject-reason" value={reason} error={reason.length > 0 && reason.trim().length < 10 ? 'Informe pelo menos 10 caracteres.' : undefined} onChange={event => setReason(event.target.value)} /></Modal><Toast show={Boolean(toast)} message={toast} /></div>
}

function Content({ review, comments, inspectionId, onCommentsChanged, onOpen }: { review: InspectionReview; comments: ReviewComment[]; inspectionId: string; onCommentsChanged: () => Promise<void>; onOpen: (photos: LightboxPhoto[], index: number) => void }) {
  const counts = useMemo(() => review.sections.flatMap(section => section.items).reduce((value, item) => ({ total: value.total + 1, answered: value.answered + Number(item.answer !== null) }), { total: 0, answered: 0 }), [review]); const allPhotos = review.sections.flatMap(section => section.items.flatMap(item => item.evidences.map(evidence => photo(evidence, item.title))))
  return <>
    <section className="grid gap-4 md:grid-cols-5"><Summary label="Técnico" value={review.technicianName} /><Summary label="Cliente" value={review.clientName} /><Summary label="Local" value={review.siteName} /><Summary label="Prazo" value={formatDate(review.dueDate)} /><Summary label="Respostas" value={`${counts.answered}/${counts.total}`} /></section>
    <section aria-label="Localização da inspeção" className="grid gap-4 md:grid-cols-2"><LocationCard label="Localização de início" location={review.startLocation} /><LocationCard label="Localização de conclusão" location={review.endLocation} /></section>
    {review.sections.length > 1 && <nav aria-label="Navegação por seção" className="flex flex-wrap gap-2"><span className="self-center text-sm font-medium text-muted">Ir para:</span>{review.sections.map(section => <a key={`${section.order}-${section.title}`} href={`#review-section-${section.order}`} className="focus-ring rounded-fieldops border border-border bg-surface px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-light/20">{section.title}</a>)}</nav>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]"><div className="space-y-4">
      {review.sections.map(section => <Card key={`${section.order}-${section.title}`} id={`review-section-${section.order}`} className="scroll-mt-24 p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">{section.title}</h2><span className="text-sm text-muted">{section.items.filter(item => item.answer !== null).length}/{section.items.length}</span></div>
        {section.items.length === 0 ? <p className="text-sm text-muted">Esta seção não possui itens.</p> : <div className="space-y-4">{section.items.map((item, itemIndex) => {
          const itemPhotos = item.evidences.map(evidence => photo(evidence, item.title))
          const nonConforming = isNonConforming(item.answer)
          return <div key={item.snapshotId} className={cn('rounded-fieldops border p-4', nonConforming ? 'border-danger/50 bg-danger-light/10' : 'border-border bg-app-bg/60')}><p className="font-medium">{itemIndex + 1}. {item.title}</p><p className="mt-1 text-xs text-muted">Tipo: {item.responseType}</p>{item.answer === null ? <p className="mt-2 text-sm font-semibold text-warning-dark">Não respondido</p> : <p className={cn('mt-2 text-sm font-semibold', nonConforming ? 'text-danger-dark' : 'text-success-dark')}>{nonConforming ? 'Resposta não conforme' : 'Resposta'}: {item.answer}</p>}{item.observation && <p className="mt-3 text-sm text-muted">Observação: {item.observation}</p>}{item.answeredBy && <p className="mt-1 text-xs text-muted">Respondido por {item.answeredBy}</p>}{itemPhotos.length ? <PhotoThumbnails photos={itemPhotos} onOpen={selected => onOpen(itemPhotos, selected)} /> : <p className="mt-3 text-xs text-muted">Sem evidências associadas a este item.</p>}{item.nonConformities.map(nc => <div key={nc.id} className="mt-3 rounded-fieldops border border-warning/40 bg-warning/10 p-3 text-sm"><div className="flex justify-between gap-2"><p className="font-semibold text-warning-dark">Não conformidade: {nc.title}</p><SeverityBadge severity={nc.severity} /></div><p className="mt-1 text-muted">{nc.description}</p></div>)}<ItemComments comments={comments.filter(comment => comment.itemSnapshotId === item.snapshotId)} inspectionId={inspectionId} itemId={item.snapshotId} onCreated={onCommentsChanged} /></div>
        })}</div>}</Card>)}
    </div><Card className="h-fit p-5"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">Não conformidades</h2><StatusBadge status={review.status} /></div><p className="mb-4 text-sm text-muted">{review.nonConformities.length} registros encontrados</p>{review.nonConformities.length === 0 ? <p className="text-sm text-muted">Nenhuma não conformidade relacionada.</p> : <div className="space-y-3">{review.nonConformities.map(nc => <div key={nc.id} className="rounded-fieldops border border-border p-3"><div className="flex justify-between gap-2"><p className="font-medium">{nc.title}</p><SeverityBadge severity={nc.severity} /></div><p className="mt-1 text-sm text-muted">{nc.description}</p></div>)}</div>}{allPhotos.length > 0 && <div className="mt-5 border-t border-border pt-4"><p className="mb-3 text-sm font-medium">Fotografias da inspeção</p><PhotoThumbnails photos={allPhotos.slice(0, 6)} onOpen={selected => onOpen(allPhotos, selected)} /></div>}</Card></div>
  </>
}
function photo(value: ReviewEvidence, item: string): LightboxPhoto { return { src: '', contentUrl: value.contentUrl, item, capturedAt: value.capturedAt, location: value.location ?? undefined, description: value.description ?? undefined } }
function ItemComments({ comments, inspectionId, itemId, onCreated }: { comments: ReviewComment[]; inspectionId: string; itemId: string; onCreated: () => Promise<void> }) {
  const [value, setValue] = useState(''); const [pending, setPending] = useState(false); const [error, setError] = useState('')
  async function submit() { const comment = value.trim(); if (!comment || pending) return; setPending(true); setError(''); try { await inspectionReviewApi.addComment(inspectionId, itemId, comment); setValue(''); await onCreated() } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível adicionar o comentário.') } finally { setPending(false) } }
  return <div className="mt-4 border-t border-border pt-3"><p className="text-sm font-semibold">Comentários de revisão</p>{comments.length > 0 && <div className="mt-2 space-y-2">{comments.map(comment => <div key={comment.id} className="rounded-fieldops bg-primary-light/10 p-2 text-sm"><p>{comment.comment}</p><p className="mt-1 text-xs text-muted">{comment.createdBy} · {new Date(comment.createdAt).toLocaleString()}</p></div>)}</div>}<div className="mt-3"><Textarea label="Adicionar comentário" id={`review-comment-${itemId}`} value={value} onChange={event => setValue(event.target.value)} /><div className="mt-2 flex items-center gap-3"><Button variant="secondary" disabled={!value.trim() || pending} onClick={() => void submit()}>{pending ? 'Enviando...' : 'Adicionar comentário'}</Button>{error && <p role="alert" className="text-sm text-danger">{error}</p>}</div></div></div>
}
function isNonConforming(answer: string | null) { return answer?.trim().toUpperCase() === 'NON_CONFORMING' }
function Summary({ label, value }: { label: string; value: string }) { return <Card className="p-4"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></Card> }
// Shows a one-shot GPS reading with its accuracy and a Google Maps link (PBI-045).
// Renders an explicit "not captured" state when the technician skipped or was
// denied the location permission (RN-059), so absence is never ambiguous.
function LocationCard({ label, location }: { label: string; location: ReviewLocation | null | undefined }) {
  return <Card className="p-4">
    <p className="text-xs font-medium text-muted">{label}</p>
    {!location
      ? <p className="mt-1 text-sm text-muted">Localização não registrada</p>
      : <div className="mt-1 space-y-1">
          <p className="text-sm font-semibold">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
          <p className="text-xs text-muted">{location.accuracy === null ? 'Precisão indisponível' : `Precisão: ${Math.round(location.accuracy)} m`}{location.capturedAt ? ` · ${formatDate(location.capturedAt)}` : ''}</p>
          <a className="focus-ring inline-flex items-center gap-1 text-sm font-semibold text-primary" href={mapsUrl(location)} target="_blank" rel="noreferrer" aria-label={`Ver ${label.toLowerCase()} no mapa`}><MapPin size={15} />Ver no mapa</a>
        </div>}
  </Card>
}
// Google Maps query URL for a captured coordinate pair (PBI-045).
function mapsUrl(location: ReviewLocation): string { return `https://www.google.com/maps?q=${location.latitude},${location.longitude}` }
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={cn('focus-ring -mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors', active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text')}>{children}</button> }
