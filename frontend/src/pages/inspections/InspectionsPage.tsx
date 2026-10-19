import { Ban, Download, Plus } from 'lucide-react'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type AdminInspectionSummary, adminCatalogApi } from '@/api/adminCatalog'
import { ClientStatus, type ManagedClient, clientsApi } from '@/api/clients'
import { usersApi } from '@/api/users'
import { authSession } from '@/auth/session'
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
import { InspectionStatus, Priority, UserRole, UserStatus } from '@/types/domain'
import { formatDate } from '@/utils/formatDate'

const cancelable = [
  InspectionStatus.DRAFT,
  InspectionStatus.ASSIGNED,
  InspectionStatus.IN_PROGRESS,
  InspectionStatus.SUBMITTED,
  InspectionStatus.UNDER_REVIEW,
]
const filterNames = ['name', 'status', 'technicianName', 'clientName', 'priority', 'dueDate', 'overdue', 'review']

export function InspectionsPage() {
  const navigate = useNavigate()
  const session = useSyncExternalStore(authSession.subscribe, authSession.snapshot, authSession.snapshot)
  // Hiding the button is a UX cue only; the backend enforces the ADMIN-only 403.
  const isAdmin = session.user?.role === UserRole.ADMIN
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

  // ── Lista principal ─────────────────────────────────────────────────────────
  const [rows, setRows] = useState<AdminInspectionSummary[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // ── Dados para os filtros ───────────────────────────────────────────────────
  const [technicianNames, setTechnicianNames] = useState<string[]>([])
  const [clients, setClients] = useState<ManagedClient[]>([])

  // ── Exportação CSV (PBI-092, apenas ADMIN) ──────────────────────────────────
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  // ── Cancelamento ────────────────────────────────────────────────────────────
  const [canceling, setCanceling] = useState<AdminInspectionSummary | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [toast, setToast] = useState(false)

  const hasFilters = filterNames.some((name) => Boolean(list.value(name)))

  // ── Carrega técnicos e clientes para os filtros ─────────────────────────────
  useEffect(() => {
    usersApi
      .list({ name: '', role: UserRole.TECHNICIAN, status: UserStatus.ACTIVE, page: 0, size: 200, sort: 'name,asc' })
      .then((result) => setTechnicianNames(result.content.map((u) => u.name)))
      .catch(() => { /* silently ignore — filters degrade gracefully */ })
  }, [])

  useEffect(() => {
    clientsApi
      .list({ name: '', status: ClientStatus.ACTIVE, page: 0, size: 200 })
      .then((result) => setClients(result.content))
      .catch(() => { /* silently ignore */ })
  }, [])

  // ── Carrega inspeções ───────────────────────────────────────────────────────
  const loadInspections = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminCatalogApi.listInspections({
        name: debouncedQuery,
        status,
        technicianName,
        clientName,
        priority,
        dueDate,
        overdue,
        review,
        page: list.page,
        size: list.size,
        sort: list.sort,
      })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [
    clientName,
    debouncedQuery,
    dueDate,
    list.page,
    list.size,
    list.sort,
    overdue,
    priority,
    review,
    status,
    technicianName,
  ])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void loadInspections(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [loadInspections])

  // ── Cancelamento ────────────────────────────────────────────────────────────
  function openCancelModal(item: AdminInspectionSummary) {
    setCanceling(item)
    setCancelReason('')
    setCancelError('')
  }

  function closeCancelModal() {
    if (cancelLoading) return
    setCanceling(null)
    setCancelReason('')
    setCancelError('')
  }

  async function confirmCancel() {
    if (!canceling) return
    const reason = cancelReason.trim()
    if (reason.length < 10) {
      setCancelError('Informe um motivo com pelo menos 10 caracteres.')
      return
    }
    setCancelLoading(true)
    setCancelError('')
    try {
      await adminCatalogApi.cancelInspection(canceling.id, reason)
      setCanceling(null)
      setCancelReason('')
      setToast(true)
      await loadInspections()
      window.setTimeout(() => setToast(false), 1800)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível cancelar a inspeção.'
      setCancelError(message)
    } finally {
      setCancelLoading(false)
    }
  }

  // ── Exportação CSV ──────────────────────────────────────────────────────────
  async function handleExport() {
    // Resolve o nome do cliente selecionado no filtro para o id numérico esperado pela API.
    const resolvedId = Number(clients.find((client) => client.name === clientName)?.id)
    const clientId = Number.isNaN(resolvedId) ? undefined : resolvedId
    setExporting(true)
    setExportError('')
    try {
      // O filtro de período usa uma única data; mapeamos para from e to.
      await adminCatalogApi.exportCsv({ status, from: dueDate, to: dueDate, clientId })
    } catch {
      setExportError('Nao foi possivel exportar o CSV das inspecoes.')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<AdminInspectionSummary>[] = [
    {
      header: 'Inspecao',
      sortKey: 'title',
      cell: (item) => (
        <button
          className="text-left font-medium text-primary"
          onClick={() => navigate(`/app/inspections/${item.id}/review`)}
        >
          {item.title}
        </button>
      ),
    },
    { header: 'Cliente', sortKey: 'clientName', cell: (item) => item.clientName },
    { header: 'Equipamento', sortKey: 'equipmentName', cell: (item) => item.equipmentName },
    { header: 'Tecnico', sortKey: 'technician.name', cell: (item) => item.technicianName },
    { header: 'Prioridade', sortKey: 'priority', cell: (item) => <PriorityBadge priority={item.priority} /> },
    {
      header: 'Data prevista',
      sortKey: 'dueDate',
      cell: (item) => <span className={item.overdue ? 'font-semibold text-danger' : ''}>{formatDate(item.dueDate)}</span>,
    },
    { header: 'Estado', sortKey: 'status', cell: (item) => <StatusBadge status={item.status} /> },
    {
      header: 'Progresso',
      sortKey: 'progress',
      cell: (item) => (
        <div className="w-28">
          <div className="h-2 rounded-full bg-app-bg">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
          </div>
          <span className="text-xs text-muted">{item.progress}%</span>
        </div>
      ),
    },
    {
      header: 'Acoes',
      cell: (item) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="h-8"
            disabled={item.status === InspectionStatus.CANCELED}
            onClick={() => navigate(`/app/inspections/${item.id}/review`)}
          >
            {[InspectionStatus.SUBMITTED, InspectionStatus.UNDER_REVIEW].includes(item.status) ? 'Revisar' : 'Abrir'}
          </Button>
          {cancelable.includes(item.status) && (
            <Button variant="ghost" className="h-8 px-2 text-danger" onClick={() => openCancelModal(item)}>
              <Ban size={16} />
              Cancelar
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inspecoes"
        description="Acompanhe e gerencie as inspecoes de campo."
        action={
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button variant="secondary" disabled={exporting} onClick={() => void handleExport()}>
                <Download size={16} aria-hidden />
                {exporting ? 'Exportando...' : 'Exportar CSV'}
              </Button>
            )}
            <Link to="/app/inspections/new">
              <Button>
                <Plus size={17} />
                Nova inspecao
              </Button>
            </Link>
          </div>
        }
      />
      {exportError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {exportError}
        </p>
      )}
      <Card className="grid gap-4 p-4 xl:grid-cols-4">
        <Input
          label="Busca"
          id="inspection-search"
          value={query}
          onChange={(event) => list.update('name', event.target.value)}
          placeholder="Inspecao, cliente ou equipamento"
        />
        <Select
          label="Estado"
          id="inspection-status"
          value={status}
          onChange={(event) => list.update('status', event.target.value)}
        >
          <option value="">Todos</option>
          {Object.values(InspectionStatus).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
        <Select
          label="Tecnico"
          id="inspection-tech"
          value={technicianName}
          onChange={(event) => list.update('technicianName', event.target.value)}
        >
          <option value="">Todos</option>
          {technicianNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Select
          label="Cliente"
          id="inspection-client"
          value={clientName}
          onChange={(event) => list.update('clientName', event.target.value)}
        >
          <option value="">Todos</option>
          {clients.map((client) => (
            <option key={client.id} value={client.name}>
              {client.name}
            </option>
          ))}
        </Select>
        <Select
          label="Prioridade"
          id="inspection-priority"
          value={priority}
          onChange={(event) => list.update('priority', event.target.value)}
        >
          <option value="">Todas</option>
          {Object.values(Priority).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </Select>
        <Input
          label="Periodo"
          id="period"
          type="date"
          value={dueDate}
          onChange={(event) => list.update('dueDate', event.target.value)}
        />
        <label className="mt-7 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(event) => list.update('overdue', event.target.checked ? 'true' : '')}
          />
          Somente atrasadas
        </label>
        <label className="mt-7 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={review}
            onChange={(event) => list.update('review', event.target.checked ? 'true' : '')}
          />
          Aguardando revisao
        </label>
        {hasFilters && (
          <div className="xl:col-span-4">
            <Button variant="ghost" onClick={() => list.clear(filterNames)}>
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        loadingLabel="Carregando inspecoes..."
        page={list.page + 1}
        pageSize={list.size}
        totalRows={totalElements}
        totalPages={totalPages}
        sort={list.sort}
        onSortChange={list.toggleSort}
        onPageChange={(next) => list.setPage(next - 1)}
        onPageSizeChange={list.setSize}
      />
      <Modal
        open={Boolean(canceling)}
        title="Cancelar inspecao"
        onClose={closeCancelModal}
        footer={
          <>
            <Button variant="secondary" disabled={cancelLoading} onClick={closeCancelModal}>
              Voltar
            </Button>
            <Button variant="danger" disabled={cancelLoading} onClick={() => void confirmCancel()}>
              {cancelLoading ? 'Cancelando...' : 'Confirmar cancelamento'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Informe a justificativa para cancelar esta inspeção.</p>
          <Textarea
            label="Motivo"
            id="cancel-reason"
            value={cancelReason}
            onChange={(event) => {
              setCancelReason(event.target.value)
              setCancelError('')
            }}
            placeholder="Descreva o motivo do cancelamento"
          />
          {cancelError && (
            <p role="alert" className="text-sm font-medium text-danger">
              {cancelError}
            </p>
          )}
        </div>
      </Modal>
      <Toast show={toast} message="Inspecao cancelada com sucesso" />
    </div>
  )
}
