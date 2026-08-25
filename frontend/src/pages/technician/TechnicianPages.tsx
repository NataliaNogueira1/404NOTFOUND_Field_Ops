import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, ClipboardCheck, FileWarning, MapPin, Play, Plus, RefreshCw, Upload, UserCircle } from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, PriorityBadge, SeverityBadge, StatusBadge } from '@/components/badges/Badge'
import { Modal } from '@/components/feedback/Modal'
import { Select, Textarea } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { mockSession } from '@/auth/mockSession'
import { inspectionTemplate, technicianAnswers, technicianEvidences, technicianNonConformities, technicianSyncOperations, technicianUser } from '@/mocks/technician'
import { inspectionStore } from '@/state/mockStores'
import { InspectionStatus, Priority, ResponseType, Severity, type ChecklistAnswer, type ChecklistValue, type Inspection, type TemplateItem } from '@/types/domain'

export function TechnicianHomePage() {
  const technicianInspections = useTechnicianInspections()
  const today = new Date().toISOString().slice(0, 10)
  const todayCount = technicianInspections.filter(item => item.dueDate === today).length
  const overdue = technicianInspections.filter(item => item.overdue).length
  const inProgress = technicianInspections.filter(item => item.status === InspectionStatus.IN_PROGRESS).length
  const pendingSync = technicianInspections.reduce((sum, item) => sum + (item.pendingSyncCount ?? 0), 0)
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Ola, Carlos</h1><p className="text-sm text-muted">Suas atividades de campo para hoje.</p></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><TechStat label="Hoje" value={todayCount} tone="primary" /><TechStat label="Atrasadas" value={overdue} tone="danger" /><TechStat label="Em andamento" value={inProgress} tone="warning" /><TechStat label="Pendencias de sync" value={pendingSync} tone="success" /></section><Card className="flex flex-col gap-4 border-primary-light/70 p-5 md:flex-row md:items-center md:justify-between"><div><p className="font-semibold">{pendingSync} operacoes pendentes</p><p className="text-sm text-muted">Ultima sincronizacao mockada: hoje, 11:20</p></div><Button variant="secondary"><RefreshCw size={17} />Sincronizar agora</Button></Card><section className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Proximas inspecoes</h2><Link className="text-sm font-semibold text-primary" to="/technician/inspections">Ver todas</Link></div><div className="grid gap-4 xl:grid-cols-2">{technicianInspections.slice(0, 4).map(inspection => <TechnicianInspectionCard key={inspection.id} inspection={inspection} />)}</div></section></div>
}

export function TechnicianInspectionsPage() {
  const technicianInspections = useTechnicianInspections()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [period, setPeriod] = useState('')
  const { today, weekEnd } = useMemo(() => {
    const current = new Date()
    const end = new Date(current)
    end.setDate(current.getDate() + 6)
    return { today: current.toISOString().slice(0, 10), weekEnd: end.toISOString().slice(0, 10) }
  }, [])
  const filtered = useMemo(() => technicianInspections.filter(inspection => {
    const haystack = `${inspection.title} ${inspection.clientName} ${inspection.equipmentName}`.toLowerCase()
    const matchesPeriod = !period || (period === 'today' && inspection.dueDate === today) || (period === 'week' && inspection.dueDate >= today && inspection.dueDate <= weekEnd)
    return haystack.includes(query.toLowerCase()) && (!status || inspection.status === status) && (!priority || inspection.priority === priority) && matchesPeriod
  }), [period, priority, query, status, technicianInspections, today, weekEnd])
  const hasFilters = Boolean(query || status || priority || period)
  function clearFilters() { setQuery(''); setStatus(''); setPriority(''); setPeriod('') }
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold">Minhas Inspecoes</h1><p className="text-sm text-muted">Busca, filtros e progresso das atividades atribuuidas.</p></div><Card className="grid gap-4 p-4 lg:grid-cols-4"><Input label="Buscar" id="tech-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Titulo, cliente ou equipamento" /><Select label="Status" id="tech-status" value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option><option value={InspectionStatus.ASSIGNED}>Atribuida</option><option value={InspectionStatus.IN_PROGRESS}>Em andamento</option><option value={InspectionStatus.REJECTED}>Reprovada</option><option value={InspectionStatus.SUBMITTED}>Enviada</option><option value={InspectionStatus.CANCELED}>Cancelada</option></Select><Select label="Prioridade" id="tech-priority" value={priority} onChange={event => setPriority(event.target.value)}><option value="">Todas</option>{Object.values(Priority).map(value => <option key={value} value={value}>{value}</option>)}</Select><Select label="Periodo" id="tech-period" value={period} onChange={event => setPeriod(event.target.value)}><option value="">Todos</option><option value="today">Hoje</option><option value="week">Esta semana</option></Select>{hasFilters && <div className="lg:col-span-4"><Button variant="ghost" onClick={clearFilters}>Limpar filtros</Button></div>}</Card><div className="grid gap-4 xl:grid-cols-2">{filtered.map(inspection => <TechnicianInspectionCard key={inspection.id} inspection={inspection} />)}</div>{filtered.length === 0 && <Card className="p-8 text-center text-sm text-muted">Nenhuma inspecao encontrada.</Card>}</div>
}

export function TechnicianInspectionDetailsPage() {
  const inspection = useInspection()
  const template = inspectionTemplate(inspection)
  const evidences = technicianEvidences.filter(evidence => evidence.inspectionId === inspection.id)
  const ncs = technicianNonConformities.filter(nc => nc.inspectionId === inspection.id)
  const action = inspection.status === InspectionStatus.IN_PROGRESS ? 'Continuar' : inspection.status === InspectionStatus.REJECTED ? 'Corrigir' : 'Iniciar inspecao'
  const isCanceled = inspection.status === InspectionStatus.CANCELED
  return <div className="space-y-6"><BackLink to="/technician/inspections" label="Minhas inspecoes" /><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h1 className="text-2xl font-semibold">{inspection.title}</h1><div className="mt-3 flex flex-wrap gap-2"><PriorityBadge priority={inspection.priority} /><StatusBadge status={inspection.status} /><SyncBadge status={inspection.syncStatus} /></div></div>{isCanceled ? <Button disabled><Play size={17} />Cancelada</Button> : <Link to={`/technician/inspections/${inspection.id}/start`}><Button><Play size={17} />{action}</Button></Link>}</div><section className="grid gap-4 lg:grid-cols-3"><InfoCard label="Cliente" value={inspection.clientName} icon={UserCircle} /><InfoCard label="Local" value={inspection.siteName} icon={MapPin} /><InfoCard label="Equipamento" value={inspection.equipmentName} icon={ClipboardCheck} /></section><div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]"><div className="space-y-4">{isCanceled && <Card className="border-danger-light/40 bg-danger-light/10 p-4 text-sm font-medium text-danger-dark">Esta inspecao foi cancelada pelo Admin/Supervisor e nao pode ser iniciada ou continuada.</Card>}<Card className="p-5"><h2 className="text-base font-semibold">Dados da inspecao</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Data" value={`${inspection.dueDate} ${inspection.dueTime ?? ''}`} /><Info label="Supervisora" value={inspection.supervisorName} /><Info label="Modelo" value={template.title} /><Info label="Progresso" value={`${inspection.progress}%`} /></div></Card><Card className="p-5"><h2 className="text-base font-semibold">Instrucoes</h2><p className="mt-2 text-sm text-muted">{inspection.supervisorInstructions}</p></Card><Card className="p-5"><h2 className="text-base font-semibold">Progresso</h2><Progress value={inspection.progress} /><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Nao conformidades" value={String(ncs.length)} /><Info label="Evidencias" value={String(evidences.length)} /></div></Card></div><Card className="h-fit p-5"><h2 className="text-base font-semibold">Nao conformidades</h2><div className="mt-4 space-y-3">{ncs.map(nc => <div key={nc.id} className="rounded-fieldops border border-border p-3"><div className="flex items-center justify-between gap-2"><p className="font-medium">{nc.title}</p><SeverityBadge severity={nc.severity} /></div><p className="mt-1 text-xs text-muted">{nc.item}</p></div>)}</div><Link className="mt-4 block" to={`/technician/inspections/${inspection.id}/non-conformities`}><Button variant="secondary" className="w-full"><FileWarning size={17} />Abrir NCs</Button></Link></Card></div></div>
}

export function TechnicianStartInspectionPage() {
  const inspection = useInspection()
  const navigate = useNavigate()
  const totalItems = inspectionTemplate(inspection).sections.reduce((sum, section) => sum + section.items.length, 0)
  return <div className="space-y-6"><BackLink to={`/technician/inspections/${inspection.id}`} label="Detalhes" /><h1 className="text-2xl font-semibold">Pronto para iniciar?</h1><div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]"><Card className="p-5"><h2 className="text-base font-semibold">{inspection.title}</h2><p className="mt-1 text-sm text-muted">{inspection.clientName} / {inspection.siteName}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Equipamento" value={inspection.equipmentName} /><Info label="Itens" value={String(totalItems)} /><Info label="Tempo estimado" value="45 min" /><Info label="Prioridade" value={inspection.priority} /></div></Card><Card className="p-5"><h2 className="text-base font-semibold">Permissoes mockadas</h2><div className="mt-4 space-y-3"><Permission label="Localizacao" value="Permitida" /><Permission label="Camera" value="Permitida" /><Permission label="Upload" value="Simulado" /></div></Card></div><div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => navigate(`/technician/inspections/${inspection.id}`)}>Cancelar</Button><Button onClick={() => navigate(`/technician/inspections/${inspection.id}/checklist`)}>Confirmar inicio</Button></div></div>
}

export function TechnicianChecklistPage() {
  const inspection = useInspection()
  const template = inspectionTemplate(inspection)
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>(technicianAnswers)
  const [evidenceItem, setEvidenceItem] = useState<TemplateItem | null>(null)
  const [ncItem, setNcItem] = useState<TemplateItem | null>(null)
  const items = template.sections.flatMap(section => section.items)
  const answered = items.filter(item => answers[item.id]).length
  const progress = Math.round((answered / items.length) * 100)
  function answer(itemId: string, value: ChecklistValue, observation?: string) {
    setAnswers(current => ({ ...current, [itemId]: { itemId, value, observation, savedAt: new Date().toISOString().slice(0, 10) } }))
  }
  return <div className="space-y-6"><BackLink to={`/technician/inspections/${inspection.id}`} label="Detalhes" /><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h1 className="text-2xl font-semibold">{template.title}</h1><p className="text-sm text-muted">{template.sections.length} secoes / {items.length} itens</p></div><div className="flex gap-2"><Link to={`/technician/inspections/${inspection.id}/summary`}><Button>Ver resumo</Button></Link><Link to={`/technician/inspections/${inspection.id}/non-conformities`}><Button variant="secondary">NCs</Button></Link></div></div><Card className="p-5"><Progress value={progress} /><p className="mt-2 text-sm text-muted">{answered} de {items.length} itens respondidos</p></Card><div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]"><Card className="h-fit p-4"><p className="text-sm font-semibold">Secoes</p><div className="mt-3 space-y-2">{template.sections.map(section => <a key={section.id} href={`#${section.id}`} className="block rounded-fieldops px-3 py-2 text-sm text-muted hover:bg-primary-light/25 hover:text-text">{section.title}</a>)}</div></Card><div className="space-y-5">{template.sections.map(section => <section key={section.id} id={section.id} className="space-y-3"><h2 className="text-lg font-semibold">{section.title}</h2>{section.items.map((item, index) => <ChecklistItem key={item.id} item={item} index={items.findIndex(candidate => candidate.id === item.id) + 1 || index + 1} answer={answers[item.id]} onAnswer={answer} onEvidence={() => setEvidenceItem(item)} onNc={() => setNcItem(item)} />)}</section>)}</div></div><EvidenceModal item={evidenceItem} onClose={() => setEvidenceItem(null)} /><NcModal item={ncItem} onClose={() => setNcItem(null)} /></div>
}

export function TechnicianNonConformitiesPage() {
  const inspection = useInspection()
  const [rows, setRows] = useState(technicianNonConformities.filter(nc => nc.inspectionId === inspection.id))
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<Severity>(Severity.MEDIUM)
  function add() {
    setRows(current => [{ id: `nc-${Date.now()}`, title: title || 'Nova nao conformidade', inspectionId: inspection.id, item: 'Item selecionado no checklist', clientId: inspection.clientId, severity, status: 'Aberta', date: new Date().toISOString().slice(0, 10) }, ...current])
    setOpen(false)
    setTitle('')
  }
  return <div className="space-y-6"><BackLink to={`/technician/inspections/${inspection.id}/checklist`} label="Checklist" /><div className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Nao conformidades</h1><p className="text-sm text-muted">{inspection.title}</p></div><Button onClick={() => setOpen(true)}><Plus size={17} />Adicionar NC</Button></div><div className="grid gap-4 xl:grid-cols-2">{rows.map(nc => <Card key={nc.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{nc.title}</p><p className="mt-1 text-sm text-muted">{nc.item}</p></div><SeverityBadge severity={nc.severity} /></div><p className="mt-3 text-sm text-muted">Status: {nc.status}</p></Card>)}</div><Modal open={open} title="Adicionar nao conformidade" onClose={() => setOpen(false)} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={add}>Salvar NC</Button></>}><div className="space-y-4"><Input label="Titulo" id="nc-title" value={title} onChange={event => setTitle(event.target.value)} /><Select label="Criticidade" id="nc-severity" value={severity} onChange={event => setSeverity(event.target.value as Severity)}>{Object.values(Severity).map(value => <option key={value}>{value}</option>)}</Select><Textarea label="Descricao" id="nc-desc" placeholder="Descricao mockada" /></div></Modal></div>
}

export function TechnicianSummaryPage() {
  const inspection = useInspection()
  const template = inspectionTemplate(inspection)
  const [confirm, setConfirm] = useState(false)
  const total = template.sections.reduce((sum, section) => sum + section.items.length, 0)
  const answered = Object.keys(technicianAnswers).length
  const conformes = Object.values(technicianAnswers).filter(answer => answer.value === 'CONFORME' || answer.value === true).length
  const naoConformes = Object.values(technicianAnswers).filter(answer => answer.value === 'NAO_CONFORME').length
  const ncs = technicianNonConformities.filter(nc => nc.inspectionId === inspection.id).length
  return <div className="space-y-6"><BackLink to={`/technician/inspections/${inspection.id}/checklist`} label="Checklist" /><h1 className="text-2xl font-semibold">Resumo / Conclusao</h1><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><TechStat label="Total de itens" value={total} tone="primary" /><TechStat label="Respondidos" value={answered} tone="success" /><TechStat label="Conformes" value={conformes} tone="success" /><TechStat label="Nao conformes" value={naoConformes} tone="danger" /></section><Card className="p-5"><div className="grid gap-3 sm:grid-cols-2"><Info label="Evidencias" value={String(technicianEvidences.length)} /><Info label="NCs" value={String(ncs)} /><Info label="Duracao" value="50 min" /><Info label="Status apos concluir" value="Pendente de sincronizacao" /></div></Card><div className="flex justify-end"><Button onClick={() => setConfirm(true)}><CheckCircle2 size={17} />Concluir inspecao</Button></div><Modal open={confirm} title="Concluir inspecao?" onClose={() => setConfirm(false)} footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Cancelar</Button><Link to="/technician/sync"><Button>Concluir</Button></Link></>}><p className="text-sm text-muted">A inspecao sera marcada como enviada no prototipo e ficara pendente de sincronizacao mockada.</p></Modal></div>
}

export function TechnicianSyncPage() {
  const [syncing, setSyncing] = useState(false)
  const hasPending = technicianSyncOperations.some(operation => operation.status === 'Pendente' || operation.status === 'Erro')
  function sync() {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 700)
  }
  return <div className="space-y-6"><h1 className="text-2xl font-semibold">Sincronizacao</h1><Card className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm text-muted">Status</p><p className="text-xl font-semibold">{hasPending ? 'Pendencias locais' : 'Sincronizado'}</p><p className="mt-1 text-sm text-muted">Ultima sync: hoje, 11:20</p></div><Button onClick={sync} disabled={syncing}><RefreshCw size={17} />{syncing ? 'Sincronizando...' : 'Sincronizar agora'}</Button></div></Card><section className="grid gap-4 xl:grid-cols-2">{technicianSyncOperations.map(operation => <Card key={operation.id} className="flex items-center justify-between gap-4 p-4"><div><p className="font-semibold">{operation.title}</p><p className="text-sm text-muted">{operation.status}</p></div><SyncBadge status={operation.status === 'Erro' ? 'error' : operation.status === 'Pendente' ? 'pending' : 'synced'} /></Card>)}</section><div className="grid gap-4 md:grid-cols-2"><Card className="p-5"><h2 className="text-base font-semibold">Download</h2><p className="mt-2 text-sm text-muted">Inspecoes atualizadas: 3</p></Card><Card className="p-5"><h2 className="text-base font-semibold">Dispositivo</h2><div className="mt-3 grid gap-2"><Info label="Espaco usado" value="128 MB" /><Info label="Fotos pendentes" value="5" /><Info label="Modo" value="Online" /></div></Card></div></div>
}

export function TechnicianProfilePage() {
  const navigate = useNavigate()
  function logout() {
    mockSession.logout()
    navigate('/login')
  }
  return <div className="mx-auto max-w-2xl space-y-6"><Card className="p-8 text-center"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-2xl font-semibold text-white">CH</div><h1 className="mt-4 text-2xl font-semibold">{technicianUser.name}</h1><p className="text-primary">Tecnico</p><p className="text-sm text-muted">{technicianUser.email}</p></Card><Card className="p-5"><Info label="Versao" value="1.0.0" /><div className="mt-3"><Info label="Experiencia" value="Portal web do tecnico" /></div></Card><div className="flex justify-end gap-3"><Button variant="secondary"><RefreshCw size={17} />Forcar sincronizacao</Button><Button variant="danger" onClick={logout}>Logout mockado</Button></div></div>
}

function TechnicianInspectionCard({ inspection }: { inspection: Inspection }) {
  const action = inspection.status === InspectionStatus.IN_PROGRESS ? 'Continuar' : inspection.status === InspectionStatus.REJECTED ? 'Corrigir' : 'Abrir'
  return <Card className="p-5"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><Link to={`/technician/inspections/${inspection.id}`} className="font-semibold text-primary">{inspection.title}</Link><p className="mt-1 text-sm text-muted">{inspection.clientName} - {inspection.siteName}</p><p className="text-sm text-muted">{inspection.equipmentName}</p></div><div className="flex flex-wrap gap-2"><PriorityBadge priority={inspection.priority} /><StatusBadge status={inspection.status} /></div></div><div className="mt-4"><Progress value={inspection.progress} /><div className="mt-2 flex items-center justify-between text-xs text-muted"><span>{inspection.dueDate} {inspection.dueTime}</span><SyncBadge status={inspection.syncStatus} /></div></div><div className="mt-4 flex justify-end"><Link to={`/technician/inspections/${inspection.id}`}><Button variant="secondary">{action}</Button></Link></div></Card>
}

function ChecklistItem({ item, index, answer, onAnswer, onEvidence, onNc }: { item: TemplateItem; index: number; answer?: ChecklistAnswer; onAnswer: (itemId: string, value: ChecklistValue, observation?: string) => void; onEvidence: () => void; onNc: () => void }) {
  const [observation, setObservation] = useState(answer?.observation ?? '')
  return <Card className="p-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><p className="font-semibold">{index}. {item.question}{item.required && ' *'}</p><div className="mt-2 flex flex-wrap gap-2"><Badge tone="primary">{item.responseType}</Badge>{item.requireObservationOnFailure && <Badge tone="warning">Obs. na falha</Badge>}{item.requireEvidenceOnFailure && <Badge tone="danger">Evidencia na falha</Badge>}</div></div><div className="flex gap-2"><Button variant="ghost" className="h-8 px-2" onClick={onEvidence}><Camera size={16} />Evidencia</Button><Button variant="ghost" className="h-8 px-2" onClick={onNc}><AlertTriangle size={16} />NC</Button></div></div><div className="mt-4">{responseControl(item, answer?.value, value => onAnswer(item.id, value, observation))}</div><Textarea label="Observacao" id={`obs-${item.id}`} value={observation} onChange={event => setObservation(event.target.value)} /><div className="mt-3 flex justify-end"><Button variant="secondary" onClick={() => onAnswer(item.id, answer?.value ?? '', observation)}>Salvar resposta</Button></div></Card>
}

function responseControl(item: TemplateItem, value: ChecklistValue | undefined, onChange: (value: ChecklistValue) => void) {
  if (item.responseType === ResponseType.CONFORMITY) return <div className="flex flex-wrap gap-2">{[['CONFORME', 'Conforme'], ['NAO_CONFORME', 'Nao conforme'], ['NA', 'N/A']].map(([option, label]) => <Button key={option} variant={value === option ? 'primary' : 'secondary'} onClick={() => onChange(option as ChecklistValue)}>{label}</Button>)}</div>
  if (item.responseType === ResponseType.BOOLEAN) return <div className="flex gap-2"><Button variant={value === true ? 'primary' : 'secondary'} onClick={() => onChange(true)}>Sim</Button><Button variant={value === false ? 'primary' : 'secondary'} onClick={() => onChange(false)}>Nao</Button></div>
  if (item.responseType === ResponseType.SINGLE_CHOICE) return <Select label="Resposta" id={`choice-${item.id}`} value={String(value ?? '')} onChange={event => onChange(event.target.value)}><option value="">Selecione</option>{(item.options ?? []).map(option => <option key={option}>{option}</option>)}</Select>
  if (item.responseType === ResponseType.NUMBER) return <Input label="Resposta numerica" id={`number-${item.id}`} type="number" value={String(value ?? '')} onChange={event => onChange(Number(event.target.value))} />
  if (item.responseType === ResponseType.DATE) return <Input label="Data" id={`date-${item.id}`} type="date" value={String(value ?? '')} onChange={event => onChange(event.target.value)} />
  if (item.responseType === ResponseType.TEXT_LONG) return <Textarea label="Resposta" id={`text-${item.id}`} value={String(value ?? '')} onChange={event => onChange(event.target.value)} />
  return <Input label="Resposta" id={`short-${item.id}`} value={String(value ?? '')} onChange={event => onChange(event.target.value)} />
}

function EvidenceModal({ item, onClose }: { item: TemplateItem | null; onClose: () => void }) {
  return <Modal open={Boolean(item)} title="Adicionar evidencia mockada" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={onClose}><Upload size={17} />Adicionar</Button></>}>{item && <div className="space-y-4"><p className="font-medium">{item.question}</p><div className="grid h-48 place-items-center rounded-card border border-dashed border-border bg-slate-50 text-muted"><Camera size={40} /></div><Textarea label="Descricao" id="evidence-desc" placeholder="Descricao da evidencia simulada" /></div>}</Modal>
}

function NcModal({ item, onClose }: { item: TemplateItem | null; onClose: () => void }) {
  return <Modal open={Boolean(item)} title="Criar nao conformidade mockada" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={onClose}>Criar NC</Button></>}>{item && <div className="space-y-4"><p className="font-medium">{item.question}</p><Input label="Titulo" id="quick-nc-title" defaultValue="Nao conformidade identificada" /><Select label="Criticidade" id="quick-nc-severity" defaultValue={Severity.MEDIUM}>{Object.values(Severity).map(value => <option key={value}>{value}</option>)}</Select><Textarea label="Descricao" id="quick-nc-desc" /></div>}</Modal>
}

function TechStat({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'danger' | 'warning' | 'success' }) {
  const toneClass = { primary: 'text-primary-dark bg-primary-light/45', danger: 'text-danger-dark bg-danger-light/20', warning: 'text-warning-dark bg-amber-100', success: 'text-success-dark bg-success-light/30' }[tone]
  return <Card className="relative overflow-hidden p-5"><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><span className={`absolute right-4 top-4 h-10 w-10 rounded-full ${toneClass}`} /></Card>
}

function InfoCard({ label, value, icon: Icon }: { label: string; value?: string; icon: typeof UserCircle }) {
  return <Card className="p-5"><div className="flex items-center gap-3"><span className="rounded-fieldops bg-primary-light/55 p-2 text-primary-dark"><Icon size={19} /></span><div><p className="text-xs font-medium text-muted">{label}</p><p className="text-sm font-semibold">{value}</p></div></div></Card>
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div><p className="text-xs font-medium text-muted">{label}</p><p className="text-sm font-semibold">{value || '-'}</p></div>
}

function Progress({ value }: { value: number }) {
  return <div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} /></div><p className="mt-1 text-xs text-muted">{value}% concluido</p></div>
}

function SyncBadge({ status }: { status?: 'synced' | 'pending' | 'error' }) {
  const label = status === 'error' ? 'Erro sync' : status === 'pending' ? 'Pendente sync' : 'Sincronizado'
  const tone = status === 'error' ? 'danger' : status === 'pending' ? 'warning' : 'success'
  return <Badge tone={tone}>{label}</Badge>
}

function Permission({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-t border-border pt-3"><span className="text-sm text-muted">{label}</span><span className="text-sm font-semibold text-success-dark">{value}</span></div>
}

function BackLink({ to, label }: { to: string; label: string }) {
  return <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to={to}><ArrowLeft size={16} />{label}</Link>
}

function useInspection() {
  const { id = 'ins-compressor' } = useParams()
  const technicianInspections = useTechnicianInspections()
  return technicianInspections.find(inspection => inspection.id === id) ?? technicianInspections[0]
}

function useTechnicianInspections() {
  return useSyncExternalStore(inspectionStore.subscribe, inspectionStore.technicianSnapshot, inspectionStore.technicianSnapshot)
}
