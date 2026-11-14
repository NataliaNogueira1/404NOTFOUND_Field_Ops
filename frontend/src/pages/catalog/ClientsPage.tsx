import { ArrowLeft, Building2, Eye, MapPin, Pencil, Plus, Power, QrCode, Wrench } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { ClientStatus, type ClientInput, type ManagedClient, clientsApi } from '@/api/clients'
import { EquipmentStatus, type ManagedEquipment, equipmentApi } from '@/api/equipment'
import { InspectionSiteStatus, type InspectionSiteInput, type ManagedInspectionSite, sitesApi } from '@/api/sites'
import { ActiveBadge } from '@/components/badges/Badge'
import { ConfirmDialog, Modal } from '@/components/feedback/Modal'
import { Toast } from '@/components/feedback/Toast'
import { Select, Textarea } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { useDebouncedValue, useListQuery } from '@/hooks/useListQuery'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'

export function ClientsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<ManagedClient[]>([])
  const list = useListQuery()
  const query = list.value('name')
  const debouncedQuery = useDebouncedValue(query)
  const status = list.value('status') as ClientStatus | ''
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<ManagedClient | 'new' | null>(null)
  const [changingStatus, setChangingStatus] = useState<ManagedClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await clientsApi.list({
        name: debouncedQuery,
        status,
        page: list.page,
        size: list.size,
        sort: list.sort,
      })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch (cause) {
      setError(clientError(cause, 'Não foi possível carregar os clientes.'))
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, list.page, list.size, list.sort, status])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void loadClients(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [loadClients])

  async function save(input: ClientInput) {
    if (!editing) return
    const creating = editing === 'new'
    if (creating) await clientsApi.create(input)
    else await clientsApi.update(editing.id, input)
    setEditing(null)
    showClientToast(creating ? 'Cliente criado com sucesso.' : 'Cliente atualizado com sucesso.')
    await loadClients()
  }

  async function changeStatus() {
    if (!changingStatus) return
    const next = changingStatus.status === ClientStatus.ACTIVE ? ClientStatus.INACTIVE : ClientStatus.ACTIVE
    try {
      await clientsApi.updateStatus(changingStatus.id, next)
      setChangingStatus(null)
      showClientToast(next === ClientStatus.ACTIVE ? 'Cliente ativado com sucesso.' : 'Cliente inativado com sucesso.')
      await loadClients()
    } catch (cause) {
      setError(clientError(cause, 'Não foi possível alterar o status do cliente.'))
      setChangingStatus(null)
    }
  }

  function showClientToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const columns: Column<ManagedClient>[] = [
    {
      header: 'Nome',
      sortKey: 'name',
      cell: (client) => (
        <button className="text-left font-medium text-primary" onClick={() => navigate(`/app/clients/${client.id}`)}>
          {client.name}
        </button>
      ),
    },
    { header: 'Documento', sortKey: 'document', cell: (client) => client.document || '-' },
    { header: 'E-mail', sortKey: 'email', cell: (client) => client.email || '-' },
    { header: 'Locais', cell: (client) => client.activeSitesCount },
    {
      header: 'Status',
      sortKey: 'status',
      cell: (client) => <ActiveBadge active={client.status === ClientStatus.ACTIVE} />,
    },
    {
      header: 'Ações',
      cell: (client) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" className="h-8 px-2" onClick={() => navigate(`/app/clients/${client.id}/sites`)}>
            <Eye size={16} />
            Ver locais
          </Button>
          <Button
            aria-label={`Editar ${client.name}`}
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setEditing(client)}
          >
            <Pencil size={16} />
          </Button>
          <Button
            aria-label={`${client.status === ClientStatus.ACTIVE ? 'Inativar' : 'Ativar'} ${client.name}`}
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setChangingStatus(client)}
          >
            <Power size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Ponto de entrada para dados gerais, locais e equipamentos do cliente."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus size={17} />
            Novo cliente
          </Button>
        }
      />
      <Card className="grid gap-4 p-4 md:grid-cols-2">
        <Input
          label="Buscar"
          id="client-search"
          value={query}
          onChange={(event) => list.update('name', event.target.value)}
          placeholder="Nome do cliente"
        />
        <Select
          label="Status"
          id="client-status"
          value={status}
          onChange={(event) => list.update('status', event.target.value)}
        >
          <option value="">Todos</option>
          <option value={ClientStatus.ACTIVE}>Ativo</option>
          <option value={ClientStatus.INACTIVE}>Inativo</option>
        </Select>
      </Card>
      {error && <ErrorState message={error} onRetry={() => void loadClients()} />}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        loadingLabel="Carregando clientes..."
        page={list.page + 1}
        pageSize={list.size}
        totalRows={totalElements}
        totalPages={totalPages}
        sort={list.sort}
        onSortChange={list.toggleSort}
        onPageChange={(next) => list.setPage(next - 1)}
        onPageSizeChange={list.setSize}
      />
      <ManagedClientModal
        key={editing === 'new' ? 'new' : (editing?.id ?? 'closed')}
        target={editing}
        onClose={() => setEditing(null)}
        onSave={save}
      />
      <ConfirmDialog
        open={Boolean(changingStatus)}
        title={changingStatus?.status === ClientStatus.ACTIVE ? 'Inativar cliente' : 'Ativar cliente'}
        description={
          changingStatus?.status === ClientStatus.ACTIVE
            ? `O cliente ${changingStatus?.name} deixará de aparecer em novos agendamentos.`
            : `O cliente ${changingStatus?.name} voltará a aparecer em novos agendamentos.`
        }
        confirmLabel={changingStatus?.status === ClientStatus.ACTIVE ? 'Inativar' : 'Ativar'}
        variant={changingStatus?.status === ClientStatus.ACTIVE ? 'danger' : 'primary'}
        onCancel={() => setChangingStatus(null)}
        onConfirm={() => void changeStatus()}
      />
      <Toast show={Boolean(toast)} message={toast} />
    </div>
  )
}

function ManagedClientModal({
  target,
  onClose,
  onSave,
}: {
  target: ManagedClient | 'new' | null
  onClose: () => void
  onSave: (input: ClientInput) => Promise<void>
}) {
  const [draft, setDraft] = useState<ClientInput>(() =>
    target && target !== 'new'
      ? {
          name: target.name,
          legalName: target.legalName,
          document: target.document,
          email: target.email,
          phone: target.phone,
        }
      : { name: '', legalName: '', document: '', email: '', phone: '' },
  )
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  if (!target) return null

  const nameError = !draft.name.trim()
    ? 'Informe o nome do cliente.'
    : draft.name.trim().length > 200
      ? 'Use no máximo 200 caracteres.'
      : ''
  const documentError =
    draft.document && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(draft.document)
      ? 'Use o formato XX.XXX.XXX/XXXX-XX.'
      : ''
  const emailError = draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) ? 'Informe um e-mail válido.' : ''
  const formError = nameError || documentError || emailError

  async function submit() {
    if (formError) return
    setSaving(true)
    setSubmitError('')
    try {
      await onSave({
        name: draft.name.trim(),
        legalName: draft.legalName.trim(),
        document: draft.document.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
      })
    } catch (cause) {
      setSubmitError(clientError(cause, 'Não foi possível salvar o cliente.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={target === 'new' ? 'Novo cliente' : 'Editar cliente'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={Boolean(formError) || saving} onClick={() => void submit()}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome"
          id="client-name"
          maxLength={200}
          value={draft.name}
          error={nameError}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <Input
          label="Razão social (opcional)"
          id="client-legal-name"
          maxLength={200}
          value={draft.legalName}
          onChange={(event) => setDraft({ ...draft, legalName: event.target.value })}
        />
        <Input
          label="Documento (CNPJ)"
          id="client-document"
          placeholder="XX.XXX.XXX/XXXX-XX"
          maxLength={18}
          value={draft.document}
          error={documentError}
          onChange={(event) => setDraft({ ...draft, document: event.target.value })}
        />
        <Input
          label="E-mail (opcional)"
          id="client-email"
          type="email"
          maxLength={100}
          value={draft.email}
          error={emailError}
          onChange={(event) => setDraft({ ...draft, email: event.target.value })}
        />
        <Input
          label="Telefone (opcional)"
          id="client-phone"
          maxLength={20}
          value={draft.phone}
          onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
        />
        {submitError && (
          <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
            {submitError}
          </p>
        )}
      </div>
    </Modal>
  )
}

function clientError(cause: unknown, fallback: string) {
  if (cause instanceof ApiError && cause.fieldErrors.length) {
    return cause.fieldErrors.map((error) => error.message).join(' ')
  }
  return fallback
}

export function ClientDetailsPage() {
  const navigate = useNavigate()
  const { clientId = '' } = useParams()
  const [managedClient, setManagedClient] = useState<ManagedClient | null>(null)
  const [sites, setSites] = useState<ManagedInspectionSite[]>([])
  const [loadingClient, setLoadingClient] = useState(true)
  const [loadingSites, setLoadingSites] = useState(true)
  const [clientError, setClientError] = useState('')
  const [editingClient, setEditingClient] = useState<ManagedClient | null>(null)
  const [editingSite, setEditingSite] = useState<ManagedInspectionSite | 'new' | null>(null)
  const [changingSiteStatus, setChangingSiteStatus] = useState<ManagedInspectionSite | null>(null)
  const [toast, setToast] = useState('')

  const loadClient = useCallback(async () => {
    setLoadingClient(true)
    setClientError('')
    try {
      const result = await clientsApi.get(clientId)
      setManagedClient(result)
    } catch {
      setClientError('Não foi possível carregar os dados do cliente.')
    } finally {
      setLoadingClient(false)
    }
  }, [clientId])

  const loadSites = useCallback(async () => {
    setLoadingSites(true)
    try {
      const result = await sitesApi.listByClient(clientId)
      setSites(result)
    } catch {
      /* Mantém lista vazia em caso de erro; o erro do cliente principal já é exibido */
    } finally {
      setLoadingSites(false)
    }
  }, [clientId])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadClient()
      void loadSites()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadClient, loadSites])

  async function saveClientEdit(input: ClientInput) {
    if (!editingClient) return
    await clientsApi.update(editingClient.id, input)
    setEditingClient(null)
    showDetailToast('Cliente atualizado com sucesso.', setToast)
    await loadClient()
  }

  async function saveSite(input: InspectionSiteInput) {
    if (!editingSite) return
    const creating = editingSite === 'new'
    if (creating) await sitesApi.create(input)
    else await sitesApi.update(editingSite.id, input)
    setEditingSite(null)
    showDetailToast(creating ? 'Local criado com sucesso.' : 'Local atualizado com sucesso.', setToast)
    await loadSites()
  }

  async function changeSiteStatus() {
    if (!changingSiteStatus) return
    const next =
      changingSiteStatus.status === InspectionSiteStatus.ACTIVE
        ? InspectionSiteStatus.INACTIVE
        : InspectionSiteStatus.ACTIVE
    try {
      await sitesApi.updateStatus(changingSiteStatus.id, next)
      setChangingSiteStatus(null)
      showDetailToast(
        next === InspectionSiteStatus.ACTIVE ? 'Local ativado com sucesso.' : 'Local inativado com sucesso.',
        setToast,
      )
      await loadSites()
    } catch {
      setChangingSiteStatus(null)
    }
  }

  const siteColumns: Column<ManagedInspectionSite>[] = [
    {
      header: 'Local',
      cell: (site) => (
        <button
          className="text-left font-medium text-primary"
          onClick={() => navigate(`/app/clients/${clientId}/sites/${site.id}`)}
        >
          {site.name}
        </button>
      ),
    },
    { header: 'Cidade / UF', cell: (site) => [site.city, site.state].filter(Boolean).join(' / ') || '-' },
    { header: 'Contato', cell: (site) => site.contactName || site.contactPhone || '-' },
    { header: 'Equipamentos', cell: (site) => site.equipmentCount },
    { header: 'Status', cell: (site) => <ActiveBadge active={site.status === InspectionSiteStatus.ACTIVE} /> },
    {
      header: 'Ações',
      cell: (site) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="h-8 px-2"
            onClick={() => navigate(`/app/clients/${clientId}/sites/${site.id}`)}
          >
            <MapPin size={16} />
            Abrir
          </Button>
          <Button
            aria-label={`Editar ${site.name}`}
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setEditingSite(site)}
          >
            <Pencil size={16} />
          </Button>
          <Button
            aria-label={`${site.status === InspectionSiteStatus.ACTIVE ? 'Inativar' : 'Ativar'} ${site.name}`}
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setChangingSiteStatus(site)}
          >
            <Power size={16} />
          </Button>
        </div>
      ),
    },
  ]

  if (loadingClient) return <LoadingState label="Carregando dados do cliente..." />
  if (clientError) return <ErrorState message={clientError} onRetry={() => void loadClient()} />
  if (!managedClient) return <ErrorState message="Cliente não encontrado." />

  return (
    <div className="space-y-6">
      <div>
        <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/clients">
          <ArrowLeft size={16} />
          Clientes
        </Link>
        <PageHeader
          title={managedClient.name}
          description="Estrutura de cadastro do cliente: dados gerais, locais e equipamentos vinculados."
          action={
            <Button variant="secondary" onClick={() => setEditingClient(managedClient)}>
              <Pencil size={17} />
              Editar cliente
            </Button>
          }
        />
      </div>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-primary" />
            <h2 className="text-base font-semibold">Dados do cliente</h2>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Nome" value={managedClient.name} />
            <Info label="Razão social" value={managedClient.legalName} />
            <Info label="Documento" value={managedClient.document} />
            <Info label="E-mail" value={managedClient.email} />
            <Info label="Telefone" value={managedClient.phone} />
            <Info label="Status" value={managedClient.status === ClientStatus.ACTIVE ? 'Ativo' : 'Inativo'} />
          </dl>
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            <h2 className="text-base font-semibold">Resumo da estrutura</h2>
          </div>
          <div className="grid gap-3">
            <Summary label="Locais cadastrados" value={managedClient.activeSitesCount} />
          </div>
        </Card>
      </section>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Locais</h2>
            <p className="text-sm text-muted">Unidades e pontos de atendimento deste cliente.</p>
          </div>
          <Button onClick={() => setEditingSite('new')}>
            <Plus size={17} />
            Adicionar local
          </Button>
        </div>
        <DataTable
          columns={siteColumns}
          rows={sites}
          loading={loadingSites}
          loadingLabel="Carregando locais..."
          empty="Nenhum local cadastrado para este cliente."
        />
      </section>
      <ManagedClientModal
        key={editingClient?.id ?? 'closed'}
        target={editingClient}
        onClose={() => setEditingClient(null)}
        onSave={saveClientEdit}
      />
      <InspectionSiteModal
        key={editingSite === 'new' ? 'new' : (editingSite?.id ?? 'site-closed')}
        target={editingSite}
        clientId={clientId}
        lockClient
        onClose={() => setEditingSite(null)}
        onSave={saveSite}
      />
      <ConfirmDialog
        open={Boolean(changingSiteStatus)}
        title={changingSiteStatus?.status === InspectionSiteStatus.ACTIVE ? 'Inativar local' : 'Ativar local'}
        description={
          changingSiteStatus?.status === InspectionSiteStatus.ACTIVE
            ? `O local ${changingSiteStatus?.name} deixará de aparecer em novas inspeções.`
            : `O local ${changingSiteStatus?.name} voltará a aparecer em novas inspeções.`
        }
        confirmLabel={changingSiteStatus?.status === InspectionSiteStatus.ACTIVE ? 'Inativar' : 'Ativar'}
        variant={changingSiteStatus?.status === InspectionSiteStatus.ACTIVE ? 'danger' : 'primary'}
        onCancel={() => setChangingSiteStatus(null)}
        onConfirm={() => void changeSiteStatus()}
      />
      <Toast show={Boolean(toast)} message={toast} />
    </div>
  )
}

export function ClientSiteDetailsPage() {
  const navigate = useNavigate()
  const { clientId = '', siteId = '' } = useParams()
  const [site, setSite] = useState<ManagedInspectionSite | null>(null)
  const [equipment, setEquipment] = useState<ManagedEquipment[]>([])
  const [loadingSite, setLoadingSite] = useState(true)
  const [loadingEquipment, setLoadingEquipment] = useState(true)
  const [siteLoadError, setSiteLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [editingSite, setEditingSite] = useState<ManagedInspectionSite | null>(null)
  const [changingEquipmentStatus, setChangingEquipmentStatus] = useState<ManagedEquipment | null>(null)
  const [qr, setQr] = useState<ManagedEquipment | null>(null)
  const [toast, setToast] = useState('')

  const loadSite = useCallback(async () => {
    setLoadingSite(true)
    setSiteLoadError('')
    setNotFound(false)
    try {
      const result = await sitesApi.get(siteId)
      setSite(result)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
        setNotFound(true)
      } else {
        setSiteLoadError('Não foi possível carregar os dados do local.')
      }
    } finally {
      setLoadingSite(false)
    }
  }, [siteId])

  const loadEquipment = useCallback(async () => {
    setLoadingEquipment(true)
    try {
      const result = await equipmentApi.listBySite(siteId)
      setEquipment(result)
    } catch {
      /* Mantém lista vazia em caso de erro */
    } finally {
      setLoadingEquipment(false)
    }
  }, [siteId])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadSite()
      void loadEquipment()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadSite, loadEquipment])

  async function saveSiteEdit(input: InspectionSiteInput) {
    if (!site) return
    await sitesApi.update(site.id, input)
    setEditingSite(null)
    showDetailToast('Local atualizado com sucesso.', setToast)
    await loadSite()
  }

  async function changeEquipmentStatus() {
    if (!changingEquipmentStatus) return
    const next =
      changingEquipmentStatus.status === EquipmentStatus.ACTIVE ? EquipmentStatus.INACTIVE : EquipmentStatus.ACTIVE
    try {
      await equipmentApi.updateStatus(changingEquipmentStatus.id, next)
      setChangingEquipmentStatus(null)
      showDetailToast(
        next === EquipmentStatus.ACTIVE ? 'Equipamento ativado com sucesso.' : 'Equipamento inativado com sucesso.',
        setToast,
      )
      await loadEquipment()
    } catch {
      setChangingEquipmentStatus(null)
    }
  }

  const equipmentColumns: Column<ManagedEquipment>[] = [
    {
      header: 'Nome',
      cell: (item) => <span className="font-medium">{item.name}</span>,
    },
    { header: 'Patrimônio', cell: (item) => item.assetNumber || '-' },
    { header: 'Número de série', cell: (item) => item.serialNumber || '-' },
    { header: 'Fabricante', cell: (item) => item.manufacturer || '-' },
    {
      header: 'QR Code',
      cell: (item) => (
        <Button variant="ghost" className="h-8 px-2" onClick={() => setQr(item)}>
          <QrCode size={16} />
          Ver
        </Button>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <ActiveBadge active={item.status === EquipmentStatus.ACTIVE} />,
    },
    {
      header: 'Ações',
      cell: (item) => (
        <div className="flex gap-2">
          <Button
            aria-label={`${item.status === EquipmentStatus.ACTIVE ? 'Inativar' : 'Ativar'} ${item.name}`}
            variant="ghost"
            className="h-8 px-2"
            onClick={() => setChangingEquipmentStatus(item)}
          >
            <Power size={16} />
          </Button>
        </div>
      ),
    },
  ]

  if (loadingSite) return <LoadingState label="Carregando dados do local..." />
  if (notFound) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            to={`/app/clients/${clientId}`}
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>
        <ErrorState message="Local não encontrado. Ele pode ter sido removido ou o endereço está incorreto." />
      </div>
    )
  }
  if (siteLoadError) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
            to={`/app/clients/${clientId}`}
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </div>
        <ErrorState message={siteLoadError} onRetry={() => void loadSite()} />
      </div>
    )
  }
  if (!site) return null

  const backLabel = site.clientName || 'Cliente'

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          to={`/app/clients/${site.clientId}`}
        >
          <ArrowLeft size={16} />
          {backLabel}
        </Link>
        <PageHeader
          title={site.name}
          description="Equipamentos e dados do local selecionado."
          action={
            <Button variant="secondary" onClick={() => setEditingSite(site)}>
              <Pencil size={17} />
              Editar local
            </Button>
          }
        />
      </div>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-primary" />
            <h2 className="text-base font-semibold">Dados do local</h2>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Cliente" value={site.clientName} />
            <Info label="Nome" value={site.name} />
            <Info label="Endereço" value={site.address} />
            <Info label="Cidade / UF" value={[site.city, site.state].filter(Boolean).join(' / ') || undefined} />
            <Info label="CEP" value={site.zipCode} />
            <Info label="Contato — nome" value={site.contactName} />
            <Info label="Contato — telefone" value={site.contactPhone} />
            {site.latitude !== null && site.longitude !== null && (
              <Info label="Coordenadas" value={`${site.latitude}, ${site.longitude}`} />
            )}
            <Info label="Status" value={site.status === InspectionSiteStatus.ACTIVE ? 'Ativo' : 'Inativo'} />
            {site.description && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted">Descrição</dt>
                <dd className="mt-1 text-sm font-semibold">{site.description}</dd>
              </div>
            )}
          </dl>
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wrench size={20} className="text-primary" />
            <h2 className="text-base font-semibold">Resumo do local</h2>
          </div>
          <Summary label="Equipamentos" value={site.equipmentCount} />
        </Card>
      </section>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Equipamentos</h2>
            <p className="text-sm text-muted">Patrimônio, série, status e QR Code deste local.</p>
          </div>
          <Button onClick={() => navigate(`/app/sites/${siteId}/equipment`)}>
            <Wrench size={17} />
            Gerenciar equipamentos
          </Button>
        </div>
        <DataTable
          columns={equipmentColumns}
          rows={equipment}
          loading={loadingEquipment}
          loadingLabel="Carregando equipamentos..."
          empty="Nenhum equipamento cadastrado para este local."
        />
      </section>
      <InspectionSiteModal
        key={editingSite?.id ?? 'site-edit-closed'}
        target={editingSite}
        clientId={site.clientId}
        lockClient
        onClose={() => setEditingSite(null)}
        onSave={saveSiteEdit}
      />
      <ConfirmDialog
        open={Boolean(changingEquipmentStatus)}
        title={
          changingEquipmentStatus?.status === EquipmentStatus.ACTIVE ? 'Inativar equipamento' : 'Ativar equipamento'
        }
        description={
          changingEquipmentStatus?.status === EquipmentStatus.ACTIVE
            ? `O equipamento ${changingEquipmentStatus?.name} será inativado.`
            : `O equipamento ${changingEquipmentStatus?.name} será ativado.`
        }
        confirmLabel={changingEquipmentStatus?.status === EquipmentStatus.ACTIVE ? 'Inativar' : 'Ativar'}
        variant={changingEquipmentStatus?.status === EquipmentStatus.ACTIVE ? 'danger' : 'primary'}
        onCancel={() => setChangingEquipmentStatus(null)}
        onConfirm={() => void changeEquipmentStatus()}
      />
      <ManagedEquipmentQrModal item={qr} onClose={() => setQr(null)} />
      <Toast show={Boolean(toast)} message={toast} />
    </div>
  )
}

function showDetailToast(message: string, setToast: (msg: string) => void) {
  setToast(message)
  window.setTimeout(() => setToast(''), 2200)
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{value || '-'}</dd>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-fieldops border border-border p-3">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-lg font-semibold text-primary">{value}</span>
    </div>
  )
}


const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

function InspectionSiteModal({
  target,
  clientId,
  onClose,
  onSave,
}: {
  target: ManagedInspectionSite | 'new' | null
  clientId: string
  lockClient?: boolean
  onClose: () => void
  onSave: (input: InspectionSiteInput) => Promise<void>
}) {
  const [draft, setDraft] = useState<InspectionSiteInput>(() =>
    target && target !== 'new'
      ? {
          clientId: target.clientId,
          name: target.name,
          description: target.description,
          address: target.address,
          city: target.city,
          state: target.state,
          zipCode: target.zipCode,
          latitude: target.latitude,
          longitude: target.longitude,
          contactName: target.contactName,
          contactPhone: target.contactPhone,
        }
      : {
          clientId,
          name: '',
          description: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          latitude: null,
          longitude: null,
          contactName: '',
          contactPhone: '',
        },
  )
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  if (!target) return null

  const nameError = !draft.name.trim()
    ? 'Informe o nome do local.'
    : draft.name.trim().length > 200
      ? 'Use no máximo 200 caracteres.'
      : ''
  const zipError = draft.zipCode && !/^\d{5}-\d{3}$/.test(draft.zipCode) ? 'Use o formato XXXXX-XXX.' : ''
  const latitudeError =
    draft.latitude !== null && (draft.latitude < -90 || draft.latitude > 90) ? 'Use um valor entre -90 e 90.' : ''
  const longitudeError =
    draft.longitude !== null && (draft.longitude < -180 || draft.longitude > 180)
      ? 'Use um valor entre -180 e 180.'
      : ''
  const formError = nameError || zipError || latitudeError || longitudeError

  async function submit() {
    if (formError) return
    setSaving(true)
    setSubmitError('')
    try {
      await onSave({
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
        address: draft.address.trim(),
        city: draft.city.trim(),
        zipCode: draft.zipCode.trim(),
        contactName: draft.contactName.trim(),
        contactPhone: draft.contactPhone.trim(),
      })
    } catch (cause) {
      setSubmitError(
        cause instanceof ApiError && cause.fieldErrors.length
          ? cause.fieldErrors.map((e) => e.message).join(' ')
          : 'Não foi possível salvar o local.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title={target === 'new' ? 'Novo local' : 'Editar local'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={Boolean(formError) || saving} onClick={() => void submit()}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome"
          id="site-form-name"
          maxLength={200}
          value={draft.name}
          error={nameError}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <div className="sm:col-span-2">
          <Textarea
            label="Descrição (opcional)"
            id="site-form-description"
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </div>
        <Input
          label="Endereço (opcional)"
          id="site-form-address"
          maxLength={255}
          value={draft.address}
          onChange={(event) => setDraft({ ...draft, address: event.target.value })}
        />
        <Input
          label="Cidade (opcional)"
          id="site-form-city"
          maxLength={100}
          value={draft.city}
          onChange={(event) => setDraft({ ...draft, city: event.target.value })}
        />
        <Select
          label="Estado (UF)"
          id="site-form-state"
          value={draft.state}
          onChange={(event) => setDraft({ ...draft, state: event.target.value })}
        >
          <option value="">Selecione</option>
          {STATES.map((st) => (
            <option key={st}>{st}</option>
          ))}
        </Select>
        <Input
          label="CEP (opcional)"
          id="site-form-zip"
          placeholder="XXXXX-XXX"
          maxLength={9}
          value={draft.zipCode}
          error={zipError}
          onChange={(event) => setDraft({ ...draft, zipCode: event.target.value })}
        />
        <Input
          label="Latitude (opcional)"
          id="site-form-latitude"
          type="number"
          step="any"
          value={draft.latitude ?? ''}
          error={latitudeError}
          onChange={(event) =>
            setDraft({ ...draft, latitude: event.target.value === '' ? null : Number(event.target.value) })
          }
        />
        <Input
          label="Longitude (opcional)"
          id="site-form-longitude"
          type="number"
          step="any"
          value={draft.longitude ?? ''}
          error={longitudeError}
          onChange={(event) =>
            setDraft({ ...draft, longitude: event.target.value === '' ? null : Number(event.target.value) })
          }
        />
        <Input
          label="Contato — nome (opcional)"
          id="site-form-contact-name"
          maxLength={100}
          value={draft.contactName}
          onChange={(event) => setDraft({ ...draft, contactName: event.target.value })}
        />
        <Input
          label="Contato — telefone (opcional)"
          id="site-form-contact-phone"
          maxLength={20}
          value={draft.contactPhone}
          onChange={(event) => setDraft({ ...draft, contactPhone: event.target.value })}
        />
        {submitError && (
          <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
            {submitError}
          </p>
        )}
      </div>
    </Modal>
  )
}

function ManagedEquipmentQrModal({ item, onClose }: { item: ManagedEquipment | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(item)} title="QR Code do equipamento" onClose={onClose}>
      {item && (
        <div className="grid place-items-center gap-4">
          <div className="grid h-44 w-44 grid-cols-5 gap-1 rounded-card border border-border bg-surface p-4">
            {Array.from({ length: 25 }, (_, index) => (
              <span key={index} className={(index + item.qrCode.length) % 3 === 0 ? 'bg-text' : 'bg-primary-light'} />
            ))}
          </div>
          <div className="text-center">
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm text-muted">{item.qrCode}</p>
          </div>
        </div>
      )}
    </Modal>
  )
}
