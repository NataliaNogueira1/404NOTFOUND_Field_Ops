import { Eye, Pencil, Plus, Power } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { ClientStatus, type ManagedClient, clientsApi } from '@/api/clients'
import { InspectionSiteStatus, type InspectionSiteInput, type ManagedInspectionSite, sitesApi } from '@/api/sites'
import { ActiveBadge } from '@/components/badges/Badge'
import { ConfirmDialog, Modal } from '@/components/feedback/Modal'
import { Toast } from '@/components/feedback/Toast'
import { Select, Textarea } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

const STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export function SitesPage() {
  const navigate = useNavigate()
  const { clientId: routeClientId = '' } = useParams()
  const [rows, setRows] = useState<ManagedInspectionSite[]>([])
  const [clients, setClients] = useState<ManagedClient[]>([])
  const [query, setQuery] = useState('')
  const [clientId, setClientId] = useState(routeClientId)
  const [status, setStatus] = useState<InspectionSiteStatus | ''>('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<ManagedInspectionSite | 'new' | null>(null)
  const [changingStatus, setChangingStatus] = useState<ManagedInspectionSite | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const loadSites = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await sitesApi.list({ name: query, clientId, status, page, size })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch (cause) {
      setError(siteError(cause, 'Nao foi possivel carregar os locais.'))
    } finally {
      setLoading(false)
    }
  }, [clientId, page, query, size, status])

  useEffect(() => {
    void clientsApi.list({ name: '', status: ClientStatus.ACTIVE, page: 0, size: 100 })
      .then(result => setClients(result.content))
      .catch(cause => setError(siteError(cause, 'Nao foi possivel carregar os clientes ativos.')))
  }, [])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void loadSites(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [loadSites])

  async function save(input: InspectionSiteInput) {
    if (!editing) return
    const creating = editing === 'new'
    if (creating) await sitesApi.create(input)
    else await sitesApi.update(editing.id, input)
    setEditing(null)
    showToast(creating ? 'Local criado com sucesso.' : 'Local atualizado com sucesso.')
    await loadSites()
  }

  async function changeStatus() {
    if (!changingStatus) return
    const next = changingStatus.status === InspectionSiteStatus.ACTIVE
      ? InspectionSiteStatus.INACTIVE : InspectionSiteStatus.ACTIVE
    try {
      await sitesApi.updateStatus(changingStatus.id, next)
      setChangingStatus(null)
      showToast(next === InspectionSiteStatus.ACTIVE ? 'Local ativado com sucesso.' : 'Local inativado com sucesso.')
      await loadSites()
    } catch (cause) {
      setError(siteError(cause, 'Nao foi possivel alterar o status do local.'))
      setChangingStatus(null)
    }
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const columns: Column<ManagedInspectionSite>[] = [
    { header: 'Nome', cell: site => <span className="font-medium">{site.name}</span> },
    { header: 'Cliente', cell: site => site.clientName },
    { header: 'Cidade / UF', cell: site => [site.city, site.state].filter(Boolean).join(' / ') || '-' },
    { header: 'Equipamentos', cell: site => site.equipmentCount },
    { header: 'Status', cell: site => <ActiveBadge active={site.status === InspectionSiteStatus.ACTIVE} /> },
    { header: 'Acoes', cell: site => <div className="flex flex-wrap gap-2">
      <Button variant="ghost" className="h-8 px-2" onClick={() => navigate(`/app/clients/${site.clientId}/sites/${site.id}`)}><Eye size={16} />Equipamentos</Button>
      <Button aria-label={`Editar ${site.name}`} variant="ghost" className="h-8 px-2" onClick={() => setEditing(site)}><Pencil size={16} /></Button>
      <Button aria-label={`${site.status === InspectionSiteStatus.ACTIVE ? 'Inativar' : 'Ativar'} ${site.name}`} variant="ghost" className="h-8 px-2" onClick={() => setChangingStatus(site)}><Power size={16} /></Button>
    </div> },
  ]

  return <div className="space-y-6">
    <PageHeader title="Locais" description={routeClientId ? 'Locais vinculados ao cliente selecionado.' : 'Gerencie unidades, CDs e pontos de atendimento.'} action={<Button onClick={() => setEditing('new')} disabled={clients.length === 0 || Boolean(routeClientId && !clients.some(client => client.id === routeClientId))}><Plus size={17} />Novo local</Button>} />
    <Card className="grid gap-4 p-4 md:grid-cols-4">
      <Input label="Buscar" id="site-search" value={query} onChange={event => { setPage(0); setQuery(event.target.value) }} placeholder="Nome do local" />
      <Select label="Cliente" id="site-client" value={clientId} disabled={Boolean(routeClientId)} onChange={event => { setPage(0); setClientId(event.target.value) }}><option value="">Todos</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</Select>
      <Select label="Status" id="site-status" value={status} onChange={event => { setPage(0); setStatus(event.target.value as InspectionSiteStatus | '') }}><option value="">Todos</option><option value={InspectionSiteStatus.ACTIVE}>Ativo</option><option value={InspectionSiteStatus.INACTIVE}>Inativo</option></Select>
      <Select label="Por pagina" id="site-size" value={size} onChange={event => { setPage(0); setSize(Number(event.target.value)) }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></Select>
    </Card>
    {error && <div role="alert" className="rounded-fieldops border border-danger-light bg-danger-light/10 px-4 py-3 text-sm text-danger-dark">{error}</div>}
    {loading ? <Card className="p-8 text-center text-sm text-muted">Carregando locais...</Card> : <DataTable columns={columns} rows={rows} page={page + 1} pageSize={size} totalRows={totalElements} totalPages={totalPages} onPageChange={next => setPage(next - 1)} empty="Nenhum local encontrado." />}
    <InspectionSiteModal key={editing === 'new' ? 'new' : editing?.id ?? 'closed'} target={editing} clients={clients} initialClientId={routeClientId || clientId} lockClient={Boolean(routeClientId)} onClose={() => setEditing(null)} onSave={save} />
    <ConfirmDialog open={Boolean(changingStatus)} title={changingStatus?.status === InspectionSiteStatus.ACTIVE ? 'Inativar local' : 'Ativar local'} description={changingStatus?.status === InspectionSiteStatus.ACTIVE ? `O local ${changingStatus?.name} deixara de aparecer em novas inspecoes.` : `O local ${changingStatus?.name} voltara a aparecer em novas inspecoes.`} confirmLabel={changingStatus?.status === InspectionSiteStatus.ACTIVE ? 'Inativar' : 'Ativar'} variant={changingStatus?.status === InspectionSiteStatus.ACTIVE ? 'danger' : 'primary'} onCancel={() => setChangingStatus(null)} onConfirm={() => void changeStatus()} />
    <Toast show={Boolean(toast)} message={toast} />
  </div>
}

function InspectionSiteModal({ target, clients, initialClientId, lockClient, onClose, onSave }: {
  target: ManagedInspectionSite | 'new' | null
  clients: ManagedClient[]
  initialClientId: string
  lockClient: boolean
  onClose: () => void
  onSave: (input: InspectionSiteInput) => Promise<void>
}) {
  const [draft, setDraft] = useState<InspectionSiteInput>(() => target && target !== 'new'
    ? siteInput(target)
    : { clientId: initialClientId || clients[0]?.id || '', name: '', description: '', address: '', city: '', state: '', zipCode: '', latitude: null, longitude: null, contactName: '', contactPhone: '' })
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  if (!target) return null

  const clientError = !draft.clientId ? 'Selecione um cliente ativo.' : ''
  const nameError = !draft.name.trim() ? 'Informe o nome do local.' : draft.name.trim().length > 200 ? 'Use no maximo 200 caracteres.' : ''
  const zipError = draft.zipCode && !/^\d{5}-\d{3}$/.test(draft.zipCode) ? 'Use o formato XXXXX-XXX.' : ''
  const latitudeError = draft.latitude !== null && (draft.latitude < -90 || draft.latitude > 90) ? 'Use um valor entre -90 e 90.' : ''
  const longitudeError = draft.longitude !== null && (draft.longitude < -180 || draft.longitude > 180) ? 'Use um valor entre -180 e 180.' : ''
  const formError = clientError || nameError || zipError || latitudeError || longitudeError

  async function submit() {
    if (formError) return
    setSaving(true)
    setSubmitError('')
    try {
      await onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim(), address: draft.address.trim(), city: draft.city.trim(), zipCode: draft.zipCode.trim(), contactName: draft.contactName.trim(), contactPhone: draft.contactPhone.trim() })
    } catch (cause) {
      setSubmitError(siteError(cause, 'Nao foi possivel salvar o local.'))
    } finally {
      setSaving(false)
    }
  }

  return <Modal open title={target === 'new' ? 'Novo local' : 'Editar local'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(formError) || saving} onClick={() => void submit()}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Select label="Cliente" id="site-form-client" value={draft.clientId} error={clientError} disabled={lockClient} onChange={event => setDraft({ ...draft, clientId: event.target.value })}><option value="">Selecione</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</Select>
      <Input label="Nome" id="site-form-name" maxLength={200} value={draft.name} error={nameError} onChange={event => setDraft({ ...draft, name: event.target.value })} />
      <div className="sm:col-span-2"><Textarea label="Descricao (opcional)" id="site-form-description" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></div>
      <Input label="Endereco (opcional)" id="site-form-address" maxLength={255} value={draft.address} onChange={event => setDraft({ ...draft, address: event.target.value })} />
      <Input label="Cidade (opcional)" id="site-form-city" maxLength={100} value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} />
      <Select label="Estado (UF)" id="site-form-state" value={draft.state} onChange={event => setDraft({ ...draft, state: event.target.value })}><option value="">Selecione</option>{STATES.map(state => <option key={state}>{state}</option>)}</Select>
      <Input label="CEP (opcional)" id="site-form-zip" placeholder="XXXXX-XXX" maxLength={9} value={draft.zipCode} error={zipError} onChange={event => setDraft({ ...draft, zipCode: event.target.value })} />
      <Input label="Latitude (opcional)" id="site-form-latitude" type="number" step="any" value={draft.latitude ?? ''} error={latitudeError} onChange={event => setDraft({ ...draft, latitude: event.target.value === '' ? null : Number(event.target.value) })} />
      <Input label="Longitude (opcional)" id="site-form-longitude" type="number" step="any" value={draft.longitude ?? ''} error={longitudeError} onChange={event => setDraft({ ...draft, longitude: event.target.value === '' ? null : Number(event.target.value) })} />
      <Input label="Contato - nome (opcional)" id="site-form-contact-name" maxLength={100} value={draft.contactName} onChange={event => setDraft({ ...draft, contactName: event.target.value })} />
      <Input label="Contato - telefone (opcional)" id="site-form-contact-phone" maxLength={20} value={draft.contactPhone} onChange={event => setDraft({ ...draft, contactPhone: event.target.value })} />
      {submitError && <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">{submitError}</p>}
    </div>
  </Modal>
}

function siteInput(site: ManagedInspectionSite): InspectionSiteInput {
  return {
    clientId: site.clientId, name: site.name, description: site.description, address: site.address,
    city: site.city, state: site.state, zipCode: site.zipCode, latitude: site.latitude,
    longitude: site.longitude, contactName: site.contactName, contactPhone: site.contactPhone,
  }
}

function siteError(cause: unknown, fallback: string) {
  if (cause instanceof ApiError && cause.fieldErrors.length) {
    return cause.fieldErrors.map(error => error.message).join(' ')
  }
  return fallback
}
