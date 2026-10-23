import { ArrowLeft, Building2, Eye, MapPin, Pencil, Plus, Power, QrCode, Wrench } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { ClientStatus, type ClientInput, type ManagedClient, clientsApi } from '@/api/clients'
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
import { byId, clients as seedClients, equipment as seedEquipment, sites as seedSites } from '@/mocks/domain'
import type { Client, Equipment, Site } from '@/types/domain'

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
  const [notFound, setNotFound] = useState(false)
  const [editingClient, setEditingClient] = useState<ManagedClient | null>(null)
  const [editingSite, setEditingSite] = useState<ManagedInspectionSite | 'new' | null>(null)
  const [changingSiteStatus, setChangingSiteStatus] = useState<ManagedInspectionSite | null>(null)
  const [toast, setToast] = useState('')

  const loadClient = useCallback(async () => {
    setLoadingClient(true)
    setClientError('')
    setNotFound(false)
    try {
      const result = await clientsApi.get(clientId)
      setManagedClient(result)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) {
        setNotFound(true)
      } else {
        setClientError('Não foi possível carregar os dados do cliente.')
      }
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
      /* mantém lista vazia em caso de erro */
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
            <Eye size={16} />
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

  if (notFound) {
    return (
      <div className="space-y-6">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/clients">
          <ArrowLeft size={16} />
          Clientes
        </Link>
        <ErrorState message="Cliente não encontrado. Ele pode ter sido removido ou o endereço está incorreto." />
      </div>
    )
  }

  if (clientError) {
    return (
      <div className="space-y-6">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/clients">
          <ArrowLeft size={16} />
          Clientes
        </Link>
        <ErrorState message={clientError} onRetry={() => void loadClient()} />
      </div>
    )
  }

  if (!managedClient) return null

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
        key={editingClient?.id ?? 'client-edit-closed'}
        target={editingClient}
        onClose={() => setEditingClient(null)}
        onSave={saveClientEdit}
      />
      <InspectionSiteModal
        key={editingSite === 'new' ? 'new' : (editingSite?.id ?? 'site-closed')}
        target={editingSite}
        clientId={clientId}
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
  const { clientId = '', siteId = '' } = useParams()
  const [client, setClient] = useState<Client>(byId(seedClients, clientId) ?? seedClients[0])
  const sourceSite = byId(seedSites, siteId) ?? seedSites.find((site) => site.clientId === client.id) ?? seedSites[0]
  const [site, setSite] = useState<Site>(sourceSite)
  const [equipment, setEquipment] = useState(seedEquipment)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [qr, setQr] = useState<Equipment | null>(null)
  const [toast, setToast] = useState(false)
  const siteEquipment = useMemo(() => equipment.filter((item) => item.siteId === site.id), [equipment, site.id])

  useEffect(() => {
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(siteId)) return
    void sitesApi
      .get(siteId)
      .then((result) => {
        setSite({
          id: result.id,
          name: result.name,
          clientId: result.clientId,
          city: result.city,
          state: result.state,
          contact: result.contactName || result.contactPhone,
          active: result.status === 'ACTIVE',
        })
        setClient((current) => ({ ...current, id: result.clientId, name: result.clientName }))
      })
      .catch(() => {
        /* Keep the fallback view when the site cannot be loaded. */
      })
  }, [siteId])

  function saveSite(next: Site) {
    setSite(next)
    setEditingSite(null)
    showToast(setToast)
  }

  function saveEquipment(item: Equipment) {
    setEquipment((current) =>
      current.some((eq) => eq.id === item.id)
        ? current.map((eq) => (eq.id === item.id ? item : eq))
        : [item, ...current],
    )
    setEditingEquipment(null)
    showToast(setToast)
  }

  const equipmentColumns: Column<Equipment>[] = [
    { header: 'Nome', cell: (item) => <span className="font-medium">{item.name}</span> },
    { header: 'Patrimônio', cell: (item) => item.patrimony },
    { header: 'Número de série', cell: (item) => item.serialNumber },
    {
      header: 'QR Code',
      cell: (item) => (
        <Button variant="ghost" className="h-8 px-2" onClick={() => setQr(item)}>
          <QrCode size={16} />
          Ver
        </Button>
      ),
    },
    { header: 'Status', cell: (item) => <ActiveBadge active={item.active} /> },
    {
      header: 'Ações',
      cell: (item) => (
        <div className="flex gap-2">
          <Button variant="ghost" className="h-8 px-2" onClick={() => setEditingEquipment(item)}>
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-2"
            onClick={() =>
              setEquipment((current) => current.map((eq) => (eq.id === item.id ? { ...eq, active: !eq.active } : eq)))
            }
          >
            <Power size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          to={`/app/clients/${client.id}`}
        >
          <ArrowLeft size={16} />
          {client.name}
        </Link>
        <PageHeader
          title={site.name}
          description="Equipamentos vinculados ao local selecionado."
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
            <Info label="Cliente" value={client.name} />
            <Info label="Local" value={site.name} />
            <Info label="Cidade / UF" value={`${site.city} / ${site.state}`} />
            <Info label="Contato" value={site.contact} />
            <Info label="Status" value={site.active ? 'Ativo' : 'Inativo'} />
          </dl>
        </Card>
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wrench size={20} className="text-primary" />
            <h2 className="text-base font-semibold">Resumo do local</h2>
          </div>
          <Summary label="Equipamentos" value={siteEquipment.length} />
        </Card>
      </section>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Equipamentos</h2>
            <p className="text-sm text-muted">Patrimônio, série, status e QR mockado deste local.</p>
          </div>
          <Button
            onClick={() =>
              setEditingEquipment({
                id: `eq-${Date.now()}`,
                name: '',
                patrimony: '',
                serialNumber: '',
                siteId: site.id,
                qrCode: `FO-${Date.now()}`,
                active: true,
              })
            }
          >
            <Plus size={17} />
            Adicionar equipamento
          </Button>
        </div>
        <DataTable
          columns={equipmentColumns}
          rows={siteEquipment}
          empty="Nenhum equipamento cadastrado para este local."
        />
      </section>
      <SiteModal site={editingSite} clientId={client.id} onClose={() => setEditingSite(null)} onSave={saveSite} />
      <EquipmentModal
        item={editingEquipment}
        siteId={site.id}
        onClose={() => setEditingEquipment(null)}
        onSave={saveEquipment}
      />
      <QrModal item={qr} onClose={() => setQr(null)} />
      <Toast show={toast} message="Local salvo no protótipo" />
    </div>
  )
}

function showToast(setToast: (show: boolean) => void) {
  setToast(true)
  setTimeout(() => setToast(false), 1800)
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

function SiteModal({
  site,
  clientId,
  onClose,
  onSave,
}: {
  site: Site | null
  clientId: string
  onClose: () => void
  onSave: (site: Site) => void
}) {
  const [draft, setDraft] = useState<Site | null>(site)
  if (site && draft?.id !== site.id) setDraft(site)
  if (!draft) return null
  const error = !draft.name.trim()
    ? 'Informe o nome do local.'
    : !draft.city.trim()
      ? 'Informe a cidade.'
      : !draft.state.trim()
        ? 'Informe a UF.'
        : ''
  return (
    <Modal
      open={Boolean(site)}
      title="Local"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={Boolean(error)} onClick={() => onSave({ ...draft, clientId })}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome"
          id="s-name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <Input
          label="Cidade"
          id="s-city"
          value={draft.city}
          onChange={(event) => setDraft({ ...draft, city: event.target.value })}
        />
        <Input
          label="UF"
          id="s-state"
          value={draft.state}
          onChange={(event) => setDraft({ ...draft, state: event.target.value })}
        />
        <Input
          label="Contato"
          id="s-contact"
          value={draft.contact}
          onChange={(event) => setDraft({ ...draft, contact: event.target.value })}
        />
        <Select
          label="Status"
          id="s-status"
          value={String(draft.active)}
          onChange={(event) => setDraft({ ...draft, active: event.target.value === 'true' })}
        >
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </Select>
        {error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}
      </div>
    </Modal>
  )
}

function EquipmentModal({
  item,
  siteId,
  onClose,
  onSave,
}: {
  item: Equipment | null
  siteId: string
  onClose: () => void
  onSave: (item: Equipment) => void
}) {
  const [draft, setDraft] = useState<Equipment | null>(item)
  if (item && draft?.id !== item.id) setDraft(item)
  if (!draft) return null
  const error = !draft.name.trim()
    ? 'Informe o nome do equipamento.'
    : !draft.patrimony.trim()
      ? 'Informe o patrimônio.'
      : !draft.serialNumber.trim()
        ? 'Informe o número de série.'
        : !draft.qrCode.trim()
          ? 'Informe o QR Code.'
          : ''
  return (
    <Modal
      open={Boolean(item)}
      title="Equipamento"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={Boolean(error)} onClick={() => onSave({ ...draft, siteId })}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome"
          id="e-name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <Input
          label="Patrimônio"
          id="e-pat"
          value={draft.patrimony}
          onChange={(event) => setDraft({ ...draft, patrimony: event.target.value })}
        />
        <Input
          label="Número de série"
          id="e-sn"
          value={draft.serialNumber}
          onChange={(event) => setDraft({ ...draft, serialNumber: event.target.value })}
        />
        <Input
          label="QR Code"
          id="e-qr"
          value={draft.qrCode}
          onChange={(event) => setDraft({ ...draft, qrCode: event.target.value })}
        />
        <Select
          label="Status"
          id="e-status"
          value={String(draft.active)}
          onChange={(event) => setDraft({ ...draft, active: event.target.value === 'true' })}
        >
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </Select>
        {error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}
      </div>
    </Modal>
  )
}

function QrModal({ item, onClose }: { item: Equipment | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(item)} title="QR Code mockado" onClose={onClose}>
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
