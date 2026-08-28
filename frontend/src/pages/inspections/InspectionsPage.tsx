import { Ban, Plus } from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PriorityBadge, StatusBadge } from '@/components/badges/Badge'
import { Modal } from '@/components/feedback/Modal'
import { Toast } from '@/components/feedback/Toast'
import { Select, Textarea } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { byId, clients, equipment, users } from '@/mocks/domain'
import { inspectionStore } from '@/state/mockStores'
import { InspectionStatus, Priority, type Inspection } from '@/types/domain'

const cancelable = [InspectionStatus.DRAFT, InspectionStatus.ASSIGNED, InspectionStatus.IN_PROGRESS, InspectionStatus.SUBMITTED, InspectionStatus.UNDER_REVIEW]

export function InspectionsPage() {
  const navigate = useNavigate()
  const rows = useSyncExternalStore(inspectionStore.subscribe, inspectionStore.adminSnapshot, inspectionStore.adminSnapshot)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [tech, setTech] = useState('')
  const [client, setClient] = useState('')
  const [priority, setPriority] = useState('')
  const [period, setPeriod] = useState('')
  const [overdue, setOverdue] = useState(false)
  const [review, setReview] = useState(false)
  const [page, setPage] = useState(1)
  const [canceling, setCanceling] = useState<Inspection | null>(null)
  const [toast, setToast] = useState(false)
  const hasFilters = Boolean(query || status || tech || client || priority || period || overdue || review)

  const filtered = useMemo(() => rows.filter(item => {
    const clientName = byId(clients, item.clientId)?.name ?? ''
    const equipmentName = byId(equipment, item.equipmentId)?.name ?? ''
    const haystack = `${item.title} ${clientName} ${equipmentName}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) &&
      (!status || item.status === status) &&
      (!tech || item.technicianId === tech) &&
      (!client || item.clientId === client) &&
      (!priority || item.priority === priority) &&
      (!period || item.dueDate === period) &&
      (!overdue || item.overdue) &&
      (!review || ([InspectionStatus.SUBMITTED, InspectionStatus.UNDER_REVIEW].includes(item.status) && item.status !== InspectionStatus.CANCELED))
  }), [rows, query, status, tech, client, priority, period, overdue, review])

  function clearFilters() {
    setQuery('')
    setStatus('')
    setTech('')
    setClient('')
    setPriority('')
    setPeriod('')
    setOverdue(false)
    setReview(false)
  }

  function confirmCancel() {
    if (!canceling) return
    inspectionStore.cancel(canceling.id)
    setCanceling(null)
    setToast(true)
    setTimeout(() => setToast(false), 1800)
  }

  const columns: Column<Inspection>[] = [
    { header: 'Inspecao', cell: i => <button className="text-left font-medium text-primary" onClick={() => navigate(`/app/inspections/${i.id}/review`)}>{i.title}</button> },
    { header: 'Cliente', cell: i => byId(clients, i.clientId)?.name },
    { header: 'Equipamento', cell: i => byId(equipment, i.equipmentId)?.name },
    { header: 'Tecnico', cell: i => byId(users, i.technicianId)?.name },
    { header: 'Prioridade', cell: i => <PriorityBadge priority={i.priority} /> },
    { header: 'Data prevista', cell: i => <span className={i.overdue ? 'font-semibold text-danger' : ''}>{i.dueDate}</span> },
    { header: 'Estado', cell: i => <StatusBadge status={i.status} /> },
    { header: 'Progresso', cell: i => <div className="w-28"><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${i.progress}%` }} /></div><span className="text-xs text-muted">{i.progress}%</span></div> },
    { header: 'Acoes', cell: i => <div className="flex flex-wrap gap-2"><Button variant="secondary" className="h-8" disabled={i.status === InspectionStatus.CANCELED} onClick={() => navigate(`/app/inspections/${i.id}/review`)}>{[InspectionStatus.SUBMITTED, InspectionStatus.UNDER_REVIEW].includes(i.status) ? 'Revisar' : 'Abrir'}</Button>{cancelable.includes(i.status) && <Button variant="ghost" className="h-8 px-2 text-danger" onClick={() => setCanceling(i)}><Ban size={16} />Cancelar</Button>}</div> },
  ]

  return <div className="space-y-6"><PageHeader title="Inspecoes" description="Acompanhe e gerencie as inspecoes de campo." action={<Link to="/app/inspections/new"><Button><Plus size={17} />Nova inspecao</Button></Link>} /><Card className="grid gap-4 p-4 xl:grid-cols-4"><Input label="Busca" id="inspection-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Inspecao, cliente ou equipamento" /><Select label="Estado" id="inspection-status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos</option>{Object.values(InspectionStatus).map(value => <option key={value}>{value}</option>)}</Select><Select label="Tecnico" id="inspection-tech" value={tech} onChange={e => setTech(e.target.value)}><option value="">Todos</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</Select><Select label="Cliente" id="inspection-client" value={client} onChange={e => setClient(e.target.value)}><option value="">Todos</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Select label="Prioridade" id="inspection-priority" value={priority} onChange={e => setPriority(e.target.value)}><option value="">Todas</option>{Object.values(Priority).map(value => <option key={value}>{value}</option>)}</Select><Input label="Periodo" id="period" type="date" value={period} onChange={e => setPeriod(e.target.value)} /><label className="mt-7 flex items-center gap-2 text-sm"><input type="checkbox" checked={overdue} onChange={e => setOverdue(e.target.checked)} />Somente atrasadas</label><label className="mt-7 flex items-center gap-2 text-sm"><input type="checkbox" checked={review} onChange={e => setReview(e.target.checked)} />Aguardando revisao</label>{hasFilters && <div className="xl:col-span-4"><Button variant="ghost" onClick={clearFilters}>Limpar filtros</Button></div>}</Card><DataTable columns={columns} rows={filtered} page={page} pageSize={4} onPageChange={setPage} empty="Nenhuma inspecao encontrada." /><Modal open={Boolean(canceling)} title="Cancelar inspecao" onClose={() => setCanceling(null)} footer={<><Button variant="secondary" onClick={() => setCanceling(null)}>Voltar</Button><Button variant="danger" onClick={confirmCancel}>Confirmar cancelamento</Button></>}><div className="space-y-4"><p className="text-sm text-muted">Esta acao altera apenas o estado local do prototipo para Cancelada.</p><Textarea label="Motivo" id="cancel-reason" placeholder="Opcional no prototipo" /></div></Modal><Toast show={toast} message="Inspecao cancelada no prototipo" /></div>
}
