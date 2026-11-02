import { Ban, Download, Plus } from 'lucide-react'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type AdminInspectionSummary, adminCatalogApi } from '@/api/adminCatalog'
import { ClientStatus, clientsApi, type ManagedClient } from '@/api/clients'
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
const filterNames = ['name', 'status', 'technicianName', 'clientName', 'priority', 'from', 'to', 'overdue', 'review']

export function InspectionsPage() {
  const navigate = useNavigate()
  const session = useSyncExternalStore(authSession.subscribe, authSession.snapshot, authSession.snapshot)
  const isAdmin = session.user?.role === UserRole.ADMIN
  const list = useListQuery('dueDate,asc')
  const query = list.value('name')
  const debouncedQuery = useDebouncedValue(query)
  const status = list.value('status') as InspectionStatus | ''
  const technicianName = list.value('technicianName')
  const clientName = list.value('clientName')
  const priority = list.value('priority') as Priority | ''
  const from = list.value('from')
  const to = list.value('to')
  const overdue = list.value('overdue') === 'true'
  const review = list.value('review') === 'true'

  // ── Lista principal ─────────────────────────────────────────────────────────
  const [rows, setRows] = useState<AdminInspectionSummary[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // ── Exportação CSV ──────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  // ── Dados para os filtros ───────────────────────────────────────────────────
  const [technicianNames, setTechnicianNames] = useState<string[]>([])
  // Guarda os clientes completos (id + nome) para popular o filtro por nome e
  // resolver nome → id na exportação CSV, que exige clientId numérico.
  const [clients, setClients] = useState<ManagedClient[]>([])

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
        from,
        to,
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
    from,
    list.page,
    list.size,
    list.sort,
    overdue,
    priority,
    review,
    status,
    technicianName,
    to,
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
    setExporting(true)
    setExportError('')
    try {
      // Resolve clientName → clientId: o endpoint de exportação aceita clientId
      // (numérico), não clientName. Busca na lista real de clientes já carregada.
      const matchedClient = clientName ? clients.find((c) => c.name === clientName) : undefined

      await adminCatalogApi.exportCsv({
        status,
        from,
        to,
        clientId: matchedClient ? Number(matchedClient.id) : undefined,
      })
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Erro ao exportar CSV.')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<AdminInspectionSummary>[] = [
    {
      header: 'Inspeção',
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
    { header: 'Técnico', sortKey: 'technician.name', cell: (item) => item.technicianName },
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
      header: 'Ações',
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
        title="Inspeções"
        description="Acompanhe e gerencie as inspeções de campo."
        action={
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button
                variant="secondary"
                disabled={exporting}
                onClick={() => void handleExport()}
                title="Exportar inspeções filtradas como CSV"
              >
                <Download size={17} aria-hidden="true" />
                {exporting ? 'Exportando...' : 'Exportar CSV'}
              </Button>
            )}
            <Link to="/app/inspections/new">
              <Button>
                <Plus size={17} aria-hidden="true" />
                Nova inspeção
              </Button>
            </Link>
          </div>
        }
      />
      <Card className="grid gap-4 p-4 xl:grid-cols-4">
        <Input
          label="Busca"
          id="inspection-search"
          value={query}
          onChange={(event) => list.update('name', event.target.value)}
          placeholder="Inspeção, cliente ou equipamento"
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
          label="Técnico"
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
          label="De"
          id="period-from"
          type="date"
          value={from}
          onChange={(event) => list.update('from', event.target.value)}
        />
        <Input
          label="Até"
          id="period-to"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => list.update('to', event.target.value)}
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
          Aguardando revisão
        </label>
        {hasFilters && (
          <div className="xl:col-span-4">
            <Button variant="ghost" onClick={() => list.clear(filterNames)}>
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>
      {exportError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {exportError}
        </p>
      )}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        loadingLabel="Carregando inspeções..."
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
        title="Cancelar inspeção"
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
      <Toast show={toast} message="Inspeção cancelada com sucesso" />
    </div>
  )
}
