import { ArrowLeft, Building2, Eye, MapPin, Pencil, Plus, Power, QrCode, Wrench } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { ClientStatus, type ClientInput, type ManagedClient, clientsApi } from '@/api/clients'
import { ActiveBadge } from '@/components/badges/Badge'
import { ConfirmDialog, Modal } from '@/components/feedback/Modal'
import { Toast } from '@/components/feedback/Toast'
import { Select } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { byId, clients as seedClients, equipment as seedEquipment, sites as seedSites } from '@/mocks/domain'
import type { Client, Equipment, Site } from '@/types/domain'

export function ClientsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<ManagedClient[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ClientStatus | ''>('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
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
      const result = await clientsApi.list({ name: query, status, page, size })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch (cause) {
      setError(clientError(cause, 'Nao foi possivel carregar os clientes.'))
    } finally {
      setLoading(false)
    }
  }, [page, query, size, status])

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
      setError(clientError(cause, 'Nao foi possivel alterar o status do cliente.'))
      setChangingStatus(null)
    }
  }

  function showClientToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const columns: Column<ManagedClient>[] = [
    { header: 'Nome', cell: client => <button className="text-left font-medium text-primary" onClick={() => navigate(`/app/clients/${client.id}`)}>{client.name}</button> },
    { header: 'Documento', cell: client => client.document || '-' },
    { header: 'E-mail', cell: client => client.email || '-' },
    { header: 'Locais', cell: client => client.activeSitesCount },
    { header: 'Status', cell: client => <ActiveBadge active={client.status === ClientStatus.ACTIVE} /> },
    { header: 'Acoes', cell: client => <div className="flex flex-wrap gap-2">
      <Button variant="ghost" className="h-8 px-2" onClick={() => navigate(`/app/clients/${client.id}`)}><Eye size={16} />Ver locais</Button>
      <Button aria-label={`Editar ${client.name}`} variant="ghost" className="h-8 px-2" onClick={() => setEditing(client)}><Pencil size={16} /></Button>
      <Button aria-label={`${client.status === ClientStatus.ACTIVE ? 'Inativar' : 'Ativar'} ${client.name}`} variant="ghost" className="h-8 px-2" onClick={() => setChangingStatus(client)}><Power size={16} /></Button>
    </div> },
  ]

  return <div className="space-y-6">
    <PageHeader title="Clientes" description="Ponto de entrada para dados gerais, locais e equipamentos do cliente." action={<Button onClick={() => setEditing('new')}><Plus size={17} />Novo cliente</Button>} />
    <Card className="grid gap-4 p-4 md:grid-cols-3">
      <Input label="Buscar" id="client-search" value={query} onChange={event => { setPage(0); setQuery(event.target.value) }} placeholder="Nome do cliente" />
      <Select label="Status" id="client-status" value={status} onChange={event => { setPage(0); setStatus(event.target.value as ClientStatus | '') }}><option value="">Todos</option><option value={ClientStatus.ACTIVE}>Ativo</option><option value={ClientStatus.INACTIVE}>Inativo</option></Select>
      <Select label="Por pagina" id="client-size" value={size} onChange={event => { setPage(0); setSize(Number(event.target.value)) }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></Select>
    </Card>
    {error && <div role="alert" className="rounded-fieldops border border-danger-light bg-danger-light/10 px-4 py-3 text-sm text-danger-dark">{error}</div>}
    {loading ? <Card className="p-8 text-center text-sm text-muted">Carregando clientes...</Card> : <DataTable columns={columns} rows={rows} page={page + 1} pageSize={size} totalRows={totalElements} totalPages={totalPages} onPageChange={next => setPage(next - 1)} />}
    <ManagedClientModal key={editing === 'new' ? 'new' : editing?.id ?? 'closed'} target={editing} onClose={() => setEditing(null)} onSave={save} />
    <ConfirmDialog open={Boolean(changingStatus)} title={changingStatus?.status === ClientStatus.ACTIVE ? 'Inativar cliente' : 'Ativar cliente'} description={changingStatus?.status === ClientStatus.ACTIVE ? `O cliente ${changingStatus?.name} deixara de aparecer em novos agendamentos.` : `O cliente ${changingStatus?.name} voltara a aparecer em novos agendamentos.`} confirmLabel={changingStatus?.status === ClientStatus.ACTIVE ? 'Inativar' : 'Ativar'} variant={changingStatus?.status === ClientStatus.ACTIVE ? 'danger' : 'primary'} onCancel={() => setChangingStatus(null)} onConfirm={() => void changeStatus()} />
    <Toast show={Boolean(toast)} message={toast} />
  </div>
}

function ManagedClientModal({ target, onClose, onSave }: { target: ManagedClient | 'new' | null; onClose: () => void; onSave: (input: ClientInput) => Promise<void> }) {
  const [draft, setDraft] = useState<ClientInput>(() => target && target !== 'new'
    ? { name: target.name, legalName: target.legalName, document: target.document, email: target.email, phone: target.phone }
    : { name: '', legalName: '', document: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  if (!target) return null

  const nameError = !draft.name.trim() ? 'Informe o nome do cliente.' : draft.name.trim().length > 200 ? 'Use no maximo 200 caracteres.' : ''
  const documentError = draft.document && !/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(draft.document) ? 'Use o formato XX.XXX.XXX/XXXX-XX.' : ''
  const emailError = draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) ? 'Informe um e-mail valido.' : ''
  const formError = nameError || documentError || emailError

  async function submit() {
    if (formError) return
    setSaving(true)
    setSubmitError('')
    try {
      await onSave({
        name: draft.name.trim(), legalName: draft.legalName.trim(), document: draft.document.trim(),
        email: draft.email.trim(), phone: draft.phone.trim(),
      })
    } catch (cause) {
      setSubmitError(clientError(cause, 'Nao foi possivel salvar o cliente.'))
    } finally {
      setSaving(false)
    }
  }

  return <Modal open title={target === 'new' ? 'Novo cliente' : 'Editar cliente'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(formError) || saving} onClick={() => void submit()}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Nome" id="client-name" maxLength={200} value={draft.name} error={nameError} onChange={event => setDraft({ ...draft, name: event.target.value })} />
      <Input label="Razao social (opcional)" id="client-legal-name" maxLength={200} value={draft.legalName} onChange={event => setDraft({ ...draft, legalName: event.target.value })} />
      <Input label="Documento (CNPJ)" id="client-document" placeholder="XX.XXX.XXX/XXXX-XX" maxLength={18} value={draft.document} error={documentError} onChange={event => setDraft({ ...draft, document: event.target.value })} />
      <Input label="E-mail (opcional)" id="client-email" type="email" maxLength={100} value={draft.email} error={emailError} onChange={event => setDraft({ ...draft, email: event.target.value })} />
      <Input label="Telefone (opcional)" id="client-phone" maxLength={20} value={draft.phone} onChange={event => setDraft({ ...draft, phone: event.target.value })} />
      {submitError && <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">{submitError}</p>}
    </div>
  </Modal>
}

function clientError(cause: unknown, fallback: string) {
  if (cause instanceof ApiError && cause.fieldErrors.length) {
    return cause.fieldErrors.map(error => error.message).join(' ')
  }
  return fallback
}

export function ClientDetailsPage() {
  const navigate = useNavigate()
  const { clientId = '' } = useParams()
  const source = byId(seedClients, clientId) ?? seedClients[0]
  const [client, setClient] = useState<Client>(source)
  const [managedClient, setManagedClient] = useState<ManagedClient | null>(null)
  const [sites, setSites] = useState(seedSites)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [toast, setToast] = useState(false)
  const clientSites = useMemo(() => sites.filter(site => site.clientId === client.id), [sites, client.id])

  useEffect(() => {
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(clientId)) return
    void clientsApi.get(clientId).then(result => {
      setManagedClient(result)
      setClient({ id: result.id, name: result.name, document: result.document,
        email: result.email, active: result.status === ClientStatus.ACTIVE, siteIds: [] })
    }).catch(() => { /* Keep the fallback view when the client cannot be loaded. */ })
  }, [clientId])

  function saveClient(next: Client) {
    setClient(next)
    setEditingClient(null)
    showToast(setToast)
  }

  function saveSite(site: Site) {
    setSites(current => current.some(item => item.id === site.id) ? current.map(item => item.id === site.id ? site : item) : [site, ...current])
    setEditingSite(null)
    showToast(setToast)
  }

  const siteColumns: Column<Site>[] = [
    { header: 'Local', cell: site => <button className="text-left font-medium text-primary" onClick={() => navigate(`/app/clients/${client.id}/sites/${site.id}`)}>{site.name}</button> },
    { header: 'Cidade / UF', cell: site => `${site.city} / ${site.state}` },
    { header: 'Contato', cell: site => site.contact },
    { header: 'Equipamentos', cell: site => seedEquipment.filter(item => item.siteId === site.id).length },
    { header: 'Status', cell: site => <ActiveBadge active={site.active} /> },
    { header: 'Acoes', cell: site => <div className="flex gap-2"><Button variant="ghost" className="h-8 px-2" onClick={() => navigate(`/app/clients/${client.id}/sites/${site.id}`)}><Eye size={16} />Abrir</Button><Button variant="ghost" className="h-8 px-2" onClick={() => setEditingSite(site)}><Pencil size={16} /></Button><Button variant="ghost" className="h-8 px-2" onClick={() => setSites(current => current.map(item => item.id === site.id ? { ...item, active: !item.active } : item))}><Power size={16} /></Button></div> },
  ]

  return <div className="space-y-6"><div><Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/clients"><ArrowLeft size={16} />Clientes</Link><PageHeader title={client.name} description="Estrutura de cadastro do cliente: dados gerais, locais e equipamentos vinculados." action={<Button variant="secondary" onClick={() => setEditingClient(client)}><Pencil size={17} />Editar cliente</Button>} /></div><section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><Card className="p-5"><div className="mb-4 flex items-center gap-2"><Building2 size={20} className="text-primary" /><h2 className="text-base font-semibold">Dados do cliente</h2></div><dl className="grid gap-4 sm:grid-cols-2"><Info label="Nome" value={client.name} /><Info label="Razao social" value={managedClient?.legalName} /><Info label="Documento" value={client.document} /><Info label="E-mail" value={client.email} /><Info label="Telefone" value={managedClient?.phone} /><Info label="Status" value={client.active ? 'Ativo' : 'Inativo'} /></dl></Card><Card className="p-5"><div className="mb-4 flex items-center gap-2"><MapPin size={20} className="text-primary" /><h2 className="text-base font-semibold">Resumo da estrutura</h2></div><div className="grid gap-3"><Summary label="Locais cadastrados" value={managedClient?.activeSitesCount ?? clientSites.length} /><Summary label="Equipamentos vinculados" value={equipmentByClient(client.id).length} /></div></Card></section><section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Locais</h2><p className="text-sm text-muted">Unidades e pontos de atendimento deste cliente.</p></div><Button onClick={() => setEditingSite({ id: `site-${Date.now()}`, name: '', clientId: client.id, city: '', state: 'SP', contact: '', active: true })}><Plus size={17} />Adicionar local</Button></div><DataTable columns={siteColumns} rows={clientSites} empty="Nenhum local cadastrado para este cliente." /></section><ClientModal client={editingClient} onClose={() => setEditingClient(null)} onSave={saveClient} /><SiteModal site={editingSite} clientId={client.id} onClose={() => setEditingSite(null)} onSave={saveSite} /><Toast show={toast} message="Estrutura do cliente salva no prototipo" /></div>
}

export function ClientSiteDetailsPage() {
  const { clientId = '', siteId = '' } = useParams()
  const client = byId(seedClients, clientId) ?? seedClients[0]
  const sourceSite = byId(seedSites, siteId) ?? seedSites.find(site => site.clientId === client.id) ?? seedSites[0]
  const [site, setSite] = useState<Site>(sourceSite)
  const [equipment, setEquipment] = useState(seedEquipment)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [qr, setQr] = useState<Equipment | null>(null)
  const [toast, setToast] = useState(false)
  const siteEquipment = useMemo(() => equipment.filter(item => item.siteId === site.id), [equipment, site.id])

  function saveSite(next: Site) {
    setSite(next)
    setEditingSite(null)
    showToast(setToast)
  }

  function saveEquipment(item: Equipment) {
    setEquipment(current => current.some(eq => eq.id === item.id) ? current.map(eq => eq.id === item.id ? item : eq) : [item, ...current])
    setEditingEquipment(null)
    showToast(setToast)
  }

  const equipmentColumns: Column<Equipment>[] = [
    { header: 'Nome', cell: item => <span className="font-medium">{item.name}</span> },
    { header: 'Patrimonio', cell: item => item.patrimony },
    { header: 'Numero de serie', cell: item => item.serialNumber },
    { header: 'QR Code', cell: item => <Button variant="ghost" className="h-8 px-2" onClick={() => setQr(item)}><QrCode size={16} />Ver</Button> },
    { header: 'Status', cell: item => <ActiveBadge active={item.active} /> },
    { header: 'Acoes', cell: item => <div className="flex gap-2"><Button variant="ghost" className="h-8 px-2" onClick={() => setEditingEquipment(item)}><Pencil size={16} /></Button><Button variant="ghost" className="h-8 px-2" onClick={() => setEquipment(current => current.map(eq => eq.id === item.id ? { ...eq, active: !eq.active } : eq))}><Power size={16} /></Button></div> },
  ]

  return <div className="space-y-6"><div><Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to={`/app/clients/${client.id}`}><ArrowLeft size={16} />{client.name}</Link><PageHeader title={site.name} description="Equipamentos vinculados ao local selecionado." action={<Button variant="secondary" onClick={() => setEditingSite(site)}><Pencil size={17} />Editar local</Button>} /></div><section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"><Card className="p-5"><div className="mb-4 flex items-center gap-2"><MapPin size={20} className="text-primary" /><h2 className="text-base font-semibold">Dados do local</h2></div><dl className="grid gap-4 sm:grid-cols-2"><Info label="Cliente" value={client.name} /><Info label="Local" value={site.name} /><Info label="Cidade / UF" value={`${site.city} / ${site.state}`} /><Info label="Contato" value={site.contact} /><Info label="Status" value={site.active ? 'Ativo' : 'Inativo'} /></dl></Card><Card className="p-5"><div className="mb-4 flex items-center gap-2"><Wrench size={20} className="text-primary" /><h2 className="text-base font-semibold">Resumo do local</h2></div><Summary label="Equipamentos" value={siteEquipment.length} /></Card></section><section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Equipamentos</h2><p className="text-sm text-muted">Patrimonio, serie, status e QR mockado deste local.</p></div><Button onClick={() => setEditingEquipment({ id: `eq-${Date.now()}`, name: '', patrimony: '', serialNumber: '', siteId: site.id, qrCode: `FO-${Date.now()}`, active: true })}><Plus size={17} />Adicionar equipamento</Button></div><DataTable columns={equipmentColumns} rows={siteEquipment} empty="Nenhum equipamento cadastrado para este local." /></section><SiteModal site={editingSite} clientId={client.id} onClose={() => setEditingSite(null)} onSave={saveSite} /><EquipmentModal item={editingEquipment} siteId={site.id} onClose={() => setEditingEquipment(null)} onSave={saveEquipment} /><QrModal item={qr} onClose={() => setQr(null)} /><Toast show={toast} message="Local salvo no prototipo" /></div>
}

function equipmentByClient(clientId: string) {
  const clientSiteIds = seedSites.filter(site => site.clientId === clientId).map(site => site.id)
  return seedEquipment.filter(item => clientSiteIds.includes(item.siteId))
}

function showToast(setToast: (show: boolean) => void) {
  setToast(true)
  setTimeout(() => setToast(false), 1800)
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div><dt className="text-xs font-medium text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold">{value || '-'}</dd></div>
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-fieldops border border-border p-3"><span className="text-sm text-muted">{label}</span><span className="text-lg font-semibold text-primary">{value}</span></div>
}

function ClientModal({ client, onClose, onSave }: { client: Client | null; onClose: () => void; onSave: (client: Client) => void }) {
  const [draft, setDraft] = useState<Client | null>(client)
  if (client && draft?.id !== client.id) setDraft(client)
  if (!draft) return null
  const error = !draft.name.trim() ? 'Informe o nome do cliente.' : !draft.document.trim() ? 'Informe o documento.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) ? 'Informe um e-mail valido.' : ''
  return <Modal open={Boolean(client)} title="Cliente" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(error)} onClick={() => onSave(draft)}>Salvar</Button></>}><div className="grid gap-4 sm:grid-cols-2"><Input label="Nome" id="c-name" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /><Input label="Documento" id="c-doc" value={draft.document} onChange={event => setDraft({ ...draft, document: event.target.value })} /><Input label="E-mail" id="c-email" value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} /><Select label="Status" id="c-status" value={String(draft.active)} onChange={event => setDraft({ ...draft, active: event.target.value === 'true' })}><option value="true">Ativo</option><option value="false">Inativo</option></Select>{error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}</div></Modal>
}

function SiteModal({ site, clientId, onClose, onSave }: { site: Site | null; clientId: string; onClose: () => void; onSave: (site: Site) => void }) {
  const [draft, setDraft] = useState<Site | null>(site)
  if (site && draft?.id !== site.id) setDraft(site)
  if (!draft) return null
  const error = !draft.name.trim() ? 'Informe o nome do local.' : !draft.city.trim() ? 'Informe a cidade.' : !draft.state.trim() ? 'Informe a UF.' : ''
  return <Modal open={Boolean(site)} title="Local" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(error)} onClick={() => onSave({ ...draft, clientId })}>Salvar</Button></>}><div className="grid gap-4 sm:grid-cols-2"><Input label="Nome" id="s-name" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /><Input label="Cidade" id="s-city" value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} /><Input label="UF" id="s-state" value={draft.state} onChange={event => setDraft({ ...draft, state: event.target.value })} /><Input label="Contato" id="s-contact" value={draft.contact} onChange={event => setDraft({ ...draft, contact: event.target.value })} /><Select label="Status" id="s-status" value={String(draft.active)} onChange={event => setDraft({ ...draft, active: event.target.value === 'true' })}><option value="true">Ativo</option><option value="false">Inativo</option></Select>{error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}</div></Modal>
}

function EquipmentModal({ item, siteId, onClose, onSave }: { item: Equipment | null; siteId: string; onClose: () => void; onSave: (item: Equipment) => void }) {
  const [draft, setDraft] = useState<Equipment | null>(item)
  if (item && draft?.id !== item.id) setDraft(item)
  if (!draft) return null
  const error = !draft.name.trim() ? 'Informe o nome do equipamento.' : !draft.patrimony.trim() ? 'Informe o patrimonio.' : !draft.serialNumber.trim() ? 'Informe o numero de serie.' : !draft.qrCode.trim() ? 'Informe o QR Code.' : ''
  return <Modal open={Boolean(item)} title="Equipamento" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(error)} onClick={() => onSave({ ...draft, siteId })}>Salvar</Button></>}><div className="grid gap-4 sm:grid-cols-2"><Input label="Nome" id="e-name" value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /><Input label="Patrimonio" id="e-pat" value={draft.patrimony} onChange={event => setDraft({ ...draft, patrimony: event.target.value })} /><Input label="Numero de serie" id="e-sn" value={draft.serialNumber} onChange={event => setDraft({ ...draft, serialNumber: event.target.value })} /><Input label="QR Code" id="e-qr" value={draft.qrCode} onChange={event => setDraft({ ...draft, qrCode: event.target.value })} /><Select label="Status" id="e-status" value={String(draft.active)} onChange={event => setDraft({ ...draft, active: event.target.value === 'true' })}><option value="true">Ativo</option><option value="false">Inativo</option></Select>{error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}</div></Modal>
}

function QrModal({ item, onClose }: { item: Equipment | null; onClose: () => void }) {
  return <Modal open={Boolean(item)} title="QR Code mockado" onClose={onClose}>{item && <div className="grid place-items-center gap-4"><div className="grid h-44 w-44 grid-cols-5 gap-1 rounded-card border border-border bg-white p-4">{Array.from({ length: 25 }, (_, index) => <span key={index} className={(index + item.qrCode.length) % 3 === 0 ? 'bg-text' : 'bg-primary-light'} />)}</div><div className="text-center"><p className="font-semibold">{item.name}</p><p className="text-sm text-muted">{item.qrCode}</p></div></div>}</Modal>
}
