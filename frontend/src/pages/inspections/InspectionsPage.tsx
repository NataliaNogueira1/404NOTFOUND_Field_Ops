import { Ban, Plus } from 'lucide-react'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type AdminInspectionSummary, adminCatalogApi } from '@/api/adminCatalog'
import { PriorityBadge, StatusBadge } from '@/components/badges/Badge'
import { Modal } from '@/components/feedback/Modal'
import { Toast } from '@/components/feedback/Toast'
import { Select, Textarea } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue, useListQuery } from '@/hooks/useListQuery'
import { byId, clients, equipment, users } from '@/mocks/domain'
import { inspectionStore } from '@/state/mockStores'
import { InspectionStatus, Priority, type Inspection } from '@/types/domain'

const cancelable = [InspectionStatus.DRAFT, InspectionStatus.ASSIGNED, InspectionStatus.IN_PROGRESS, InspectionStatus.SUBMITTED, InspectionStatus.UNDER_REVIEW]
const filterNames = ['name', 'status', 'technicianName', 'clientName', 'priority', 'dueDate', 'overdue', 'review']

export function InspectionsPage() {
  const navigate = useNavigate()
  const source = useSyncExternalStore(inspectionStore.subscribe, inspectionStore.adminSnapshot, inspectionStore.adminSnapshot)
  const list = useListQuery('dueDate,asc')
  const query = list.value('name')
  const debouncedQuery = useDebouncedValue(query)
  const status = list.value('status') as InspectionStatus | ''
  const technicianName = list.value('technicianName')
  const clientName = list.value('clientName')
  const priority = list.value('priority') as Priority | ''
  const dueDate = list.value('dueDate')
  const overdue = list.value('overdue') === 'true'
  const review = list.value('review') === 'true'
  const [rows, setRows] = useState<AdminInspectionSummary[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState<AdminInspectionSummary | null>(null)
  const [toast, setToast] = useState(false)
  const hasFilters = filterNames.some(name => Boolean(list.value(name)))

  const loadInspections = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminCatalogApi.listInspections({ name: debouncedQuery, status,
        technicianName, clientName, priority, dueDate, overdue, review,
        page: list.page, size: list.size, sort: list.sort })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch {
      const fallback = localInspections(source, { name: debouncedQuery, status, technicianName,
        clientName, priority, dueDate, overdue, review }, list.sort)
      setRows(fallback.slice(list.page * list.size, (list.page + 1) * list.size))
      setTotalElements(fallback.length)
      setTotalPages(Math.max(Math.ceil(fallback.length / list.size), 1))
    } finally {
      setLoading(false)
    }
  }, [clientName, debouncedQuery, dueDate, list.page, list.size, list.sort, overdue, priority, review, source, status, technicianName])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void loadInspections(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [loadInspections])

  function confirmCancel() {
    if (!canceling) return
    inspectionStore.cancel(canceling.id)
    setRows(current => current.map(item => item.id === canceling.id
      ? { ...item, status: InspectionStatus.CANCELED } : item))
    setCanceling(null)
    setToast(true)
    window.setTimeout(() => setToast(false), 1800)
  }

  const columns: Column<AdminInspectionSummary>[] = [
    { header: 'Inspecao', sortKey: 'title', cell: item => <button className="text-left font-medium text-primary" onClick={() => navigate(`/app/inspections/${item.id}/review`)}>{item.title}</button> },
    { header: 'Cliente', sortKey: 'clientName', cell: item => item.clientName },
    { header: 'Equipamento', sortKey: 'equipmentName', cell: item => item.equipmentName },
    { header: 'Tecnico', sortKey: 'technician.name', cell: item => item.technicianName },
    { header: 'Prioridade', sortKey: 'priority', cell: item => <PriorityBadge priority={item.priority} /> },
    { header: 'Data prevista', sortKey: 'dueDate', cell: item => <span className={item.overdue ? 'font-semibold text-danger' : ''}>{item.dueDate}</span> },
    { header: 'Estado', sortKey: 'status', cell: item => <StatusBadge status={item.status} /> },
    { header: 'Progresso', sortKey: 'progress', cell: item => <div className="w-28"><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${item.progress}%` }} /></div><span className="text-xs text-muted">{item.progress}%</span></div> },
    { header: 'Acoes', cell: item => <div className="flex flex-wrap gap-2"><Button variant="secondary" className="h-8" disabled={item.status === InspectionStatus.CANCELED} onClick={() => navigate(`/app/inspections/${item.id}/review`)}>{[InspectionStatus.SUBMITTED, InspectionStatus.UNDER_REVIEW].includes(item.status) ? 'Revisar' : 'Abrir'}</Button>{cancelable.includes(item.status) && <Button variant="ghost" className="h-8 px-2 text-danger" onClick={() => setCanceling(item)}><Ban size={16} />Cancelar</Button>}</div> },
  ]

  return <div className="space-y-6">
    <PageHeader title="Inspecoes" description="Acompanhe e gerencie as inspecoes de campo." action={<Link to="/app/inspections/new"><Button><Plus size={17} />Nova inspecao</Button></Link>} />
    <Card className="grid gap-4 p-4 xl:grid-cols-4">
      <Input label="Busca" id="inspection-search" value={query} onChange={event => list.update('name', event.target.value)} placeholder="Inspecao, cliente ou equipamento" />
      <Select label="Estado" id="inspection-status" value={status} onChange={event => list.update('status', event.target.value)}><option value="">Todos</option>{Object.values(InspectionStatus).map(value => <option key={value}>{value}</option>)}</Select>
      <Select label="Tecnico" id="inspection-tech" value={technicianName} onChange={event => list.update('technicianName', event.target.value)}><option value="">Todos</option>{users.map(user => <option key={user.id} value={user.name}>{user.name}</option>)}</Select>
      <Select label="Cliente" id="inspection-client" value={clientName} onChange={event => list.update('clientName', event.target.value)}><option value="">Todos</option>{clients.map(client => <option key={client.id} value={client.name}>{client.name}</option>)}</Select>
      <Select label="Prioridade" id="inspection-priority" value={priority} onChange={event => list.update('priority', event.target.value)}><option value="">Todas</option>{Object.values(Priority).map(value => <option key={value}>{value}</option>)}</Select>
      <Input label="Periodo" id="period" type="date" value={dueDate} onChange={event => list.update('dueDate', event.target.value)} />
      <label className="mt-7 flex items-center gap-2 text-sm"><input type="checkbox" checked={overdue} onChange={event => list.update('overdue', event.target.checked ? 'true' : '')} />Somente atrasadas</label>
      <label className="mt-7 flex items-center gap-2 text-sm"><input type="checkbox" checked={review} onChange={event => list.update('review', event.target.checked ? 'true' : '')} />Aguardando revisao</label>
      {hasFilters && <div className="xl:col-span-4"><Button variant="ghost" onClick={() => list.clear(filterNames)}>Limpar filtros</Button></div>}
    </Card>
    <DataTable columns={columns} rows={rows} loading={loading} loadingLabel="Carregando inspecoes..." page={list.page + 1} pageSize={list.size} totalRows={totalElements} totalPages={totalPages} sort={list.sort} onSortChange={list.toggleSort} onPageChange={next => list.setPage(next - 1)} onPageSizeChange={list.setSize} />
    <Modal open={Boolean(canceling)} title="Cancelar inspecao" onClose={() => setCanceling(null)} footer={<><Button variant="secondary" onClick={() => setCanceling(null)}>Voltar</Button><Button variant="danger" onClick={confirmCancel}>Confirmar cancelamento</Button></>}><div className="space-y-4"><p className="text-sm text-muted">Esta acao altera apenas o estado local do prototipo para Cancelada.</p><Textarea label="Motivo" id="cancel-reason" placeholder="Opcional no prototipo" /></div></Modal>
    <Toast show={toast} message="Inspecao cancelada no prototipo" />
  </div>
}

interface LocalFilters {
  name: string
  status: InspectionStatus | ''
  technicianName: string
  clientName: string
  priority: Priority | ''
  dueDate: string
  overdue: boolean
  review: boolean
}

function localInspections(source: Inspection[], filters: LocalFilters, sort: string) {
  const query = filters.name.toLowerCase()
  const rows = source.map(item => inspectionSummary(item)).filter(item => {
    const haystack = `${item.title} ${item.clientName} ${item.equipmentName}`.toLowerCase()
    return haystack.includes(query) && (!filters.status || item.status === filters.status)
      && (!filters.technicianName || item.technicianName === filters.technicianName)
      && (!filters.clientName || item.clientName === filters.clientName)
      && (!filters.priority || item.priority === filters.priority)
      && (!filters.dueDate || item.dueDate === filters.dueDate)
      && (!filters.overdue || item.overdue)
      && (!filters.review || [InspectionStatus.SUBMITTED, InspectionStatus.UNDER_REVIEW].includes(item.status))
  })
  const [key, direction] = sort.split(',')
  return rows.sort((left, right) => String(left[key as keyof AdminInspectionSummary] ?? '').localeCompare(String(right[key as keyof AdminInspectionSummary] ?? '')) * (direction === 'desc' ? -1 : 1))
}

function inspectionSummary(item: Inspection): AdminInspectionSummary {
  return { id: item.id, title: item.title, clientName: byId(clients, item.clientId)?.name ?? '',
    siteName: item.siteName ?? '', equipmentName: byId(equipment, item.equipmentId)?.name ?? '',
    technicianId: item.technicianId, technicianName: byId(users, item.technicianId)?.name ?? '',
    priority: item.priority, dueDate: item.dueDate, status: item.status,
    progress: item.progress, overdue: Boolean(item.overdue) }
}
