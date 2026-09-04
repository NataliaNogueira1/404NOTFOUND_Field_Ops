import { Eye, Pencil, Plus, Power, QrCode, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { EquipmentStatus, type EquipmentInput, type ManagedEquipment, equipmentApi } from '@/api/equipment'
import { InspectionSiteStatus, type ManagedInspectionSite, sitesApi } from '@/api/sites'
import { Badge } from '@/components/badges/Badge'
import { ConfirmDialog, Modal } from '@/components/feedback/Modal'
import { Toast } from '@/components/feedback/Toast'
import { Select, Textarea } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export function EquipmentPage() {
  const { siteId: contextualSiteId = '' } = useParams()
  const [rows, setRows] = useState<ManagedEquipment[]>([])
  const [sites, setSites] = useState<ManagedInspectionSite[]>([])
  const [siteId, setSiteId] = useState(contextualSiteId)
  const [status, setStatus] = useState<EquipmentStatus | ''>('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<ManagedEquipment | 'new' | null>(null)
  const [changingStatus, setChangingStatus] = useState<ManagedEquipment | null>(null)
  const [qr, setQr] = useState<ManagedEquipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const loadEquipment = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await equipmentApi.list({ siteId, status, page, size })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch (cause) {
      setError(equipmentError(cause, 'Nao foi possivel carregar os equipamentos.'))
    } finally {
      setLoading(false)
    }
  }, [page, siteId, size, status])

  useEffect(() => {
    void sitesApi.list({ name: '', clientId: '', status: InspectionSiteStatus.ACTIVE, page: 0, size: 100 })
      .then(result => setSites(result.content))
      .catch(cause => setError(equipmentError(cause, 'Nao foi possivel carregar os locais ativos.')))
  }, [])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void loadEquipment(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [loadEquipment])

  async function save(input: EquipmentInput) {
    if (!editing) return
    const creating = editing === 'new'
    if (creating) await equipmentApi.create(input)
    else await equipmentApi.update(editing.id, input)
    setEditing(null)
    showToast(creating ? 'Equipamento criado com sucesso.' : 'Equipamento atualizado com sucesso.')
    await loadEquipment()
  }

  async function changeStatus() {
    if (!changingStatus) return
    const next = changingStatus.status === EquipmentStatus.ACTIVE
      ? EquipmentStatus.INACTIVE : EquipmentStatus.ACTIVE
    try {
      await equipmentApi.updateStatus(changingStatus.id, next)
      setChangingStatus(null)
      showToast(next === EquipmentStatus.ACTIVE ? 'Equipamento ativado com sucesso.' : 'Equipamento inativado com sucesso.')
      await loadEquipment()
    } catch (cause) {
      setError(equipmentError(cause, 'Nao foi possivel alterar o status do equipamento.'))
      setChangingStatus(null)
    }
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const columns: Column<ManagedEquipment>[] = [
    { header: 'Nome', cell: item => <span className="font-medium">{item.name}</span> },
    { header: 'Patrimonio', cell: item => item.assetNumber || '-' },
    { header: 'Local', cell: item => item.siteName },
    { header: 'QR Code', cell: item => <button className="inline-flex items-center gap-1 font-mono text-xs text-primary" onClick={() => setQr(item)}><QrCode size={15} />{item.qrCode}</button> },
    { header: 'Status', cell: item => <EquipmentStatusBadge status={item.status} /> },
    { header: 'Acoes', cell: item => <div className="flex flex-wrap gap-2">
      <Button aria-label={`Editar ${item.name}`} variant="ghost" className="h-8 px-2" onClick={() => setEditing(item)}><Pencil size={16} /></Button>
      <Button aria-label={`Ver QR Code de ${item.name}`} variant="ghost" className="h-8 px-2" onClick={() => setQr(item)}><Eye size={16} /></Button>
      <Button aria-label={`${item.status === EquipmentStatus.ACTIVE ? 'Inativar' : 'Ativar'} ${item.name}`} variant="ghost" className="h-8 px-2" onClick={() => setChangingStatus(item)}><Power size={16} /></Button>
    </div> },
  ]

  return <div className="space-y-6">
    <PageHeader title="Equipamentos" description={contextualSiteId ? 'Equipamentos vinculados ao local selecionado.' : 'Gerencie ativos, vinculos com locais e QR Codes unicos.'} action={<Button onClick={() => setEditing('new')} disabled={sites.length === 0 && !contextualSiteId}><Plus size={17} />Novo equipamento</Button>} />
    <Card className="grid gap-4 p-4 md:grid-cols-3">
      <Select label="Local" id="equipment-site" value={siteId} disabled={Boolean(contextualSiteId)} onChange={event => { setPage(0); setSiteId(event.target.value) }}><option value="">Todos</option>{sites.map(site => <option key={site.id} value={site.id}>{site.clientName} - {site.name}</option>)}</Select>
      <Select label="Status" id="equipment-status" value={status} onChange={event => { setPage(0); setStatus(event.target.value as EquipmentStatus | '') }}><option value="">Todos</option><option value={EquipmentStatus.ACTIVE}>Ativo</option><option value={EquipmentStatus.INACTIVE}>Inativo</option><option value={EquipmentStatus.DECOMMISSIONED}>Descomissionado</option></Select>
      <Select label="Por pagina" id="equipment-size" value={size} onChange={event => { setPage(0); setSize(Number(event.target.value)) }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></Select>
    </Card>
    {error && <div role="alert" className="rounded-fieldops border border-danger-light bg-danger-light/10 px-4 py-3 text-sm text-danger-dark">{error}</div>}
    {loading ? <Card className="p-8 text-center text-sm text-muted">Carregando equipamentos...</Card> : <DataTable columns={columns} rows={rows} page={page + 1} pageSize={size} totalRows={totalElements} totalPages={totalPages} onPageChange={next => setPage(next - 1)} empty="Nenhum equipamento encontrado." />}
    <EquipmentModal key={editing === 'new' ? 'new' : editing?.id ?? 'closed'} target={editing} sites={sites} initialSiteId={contextualSiteId || siteId} lockSite={Boolean(contextualSiteId)} onClose={() => setEditing(null)} onSave={save} />
    <ConfirmDialog open={Boolean(changingStatus)} title={changingStatus?.status === EquipmentStatus.ACTIVE ? 'Inativar equipamento' : 'Ativar equipamento'} description={changingStatus?.status === EquipmentStatus.ACTIVE ? `O equipamento ${changingStatus?.name} deixara de aparecer em novas inspecoes.` : `O equipamento ${changingStatus?.name} voltara a aparecer em novas inspecoes.`} confirmLabel={changingStatus?.status === EquipmentStatus.ACTIVE ? 'Inativar' : 'Ativar'} variant={changingStatus?.status === EquipmentStatus.ACTIVE ? 'danger' : 'primary'} onCancel={() => setChangingStatus(null)} onConfirm={() => void changeStatus()} />
    <QrModal item={qr} onClose={() => setQr(null)} />
    <Toast show={Boolean(toast)} message={toast} />
  </div>
}

function EquipmentModal({ target, sites, initialSiteId, lockSite, onClose, onSave }: {
  target: ManagedEquipment | 'new' | null
  sites: ManagedInspectionSite[]
  initialSiteId: string
  lockSite: boolean
  onClose: () => void
  onSave: (input: EquipmentInput) => Promise<void>
}) {
  const [draft, setDraft] = useState<EquipmentInput>(() => target && target !== 'new'
    ? equipmentInput(target)
    : { siteId: initialSiteId || sites[0]?.id || '', name: '', assetNumber: '', serialNumber: '', manufacturer: '', model: '', description: '', qrCode: '', status: EquipmentStatus.ACTIVE, installedAt: '' })
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  if (!target) return null

  const siteError = !draft.siteId ? 'Selecione um local ativo.' : ''
  const nameError = !draft.name.trim() ? 'Informe o nome do equipamento.' : draft.name.trim().length > 200 ? 'Use no maximo 200 caracteres.' : ''
  const qrError = !draft.qrCode.trim() ? 'Informe ou gere um QR Code.' : draft.qrCode.trim().length > 100 ? 'Use no maximo 100 caracteres.' : ''
  const formError = siteError || nameError || qrError

  async function submit() {
    if (formError) return
    setSaving(true)
    setSubmitError('')
    try {
      await onSave({ ...draft, name: draft.name.trim(), assetNumber: draft.assetNumber.trim(), serialNumber: draft.serialNumber.trim(), manufacturer: draft.manufacturer.trim(), model: draft.model.trim(), description: draft.description.trim(), qrCode: draft.qrCode.trim() })
    } catch (cause) {
      setSubmitError(equipmentError(cause, 'Nao foi possivel salvar o equipamento.'))
    } finally {
      setSaving(false)
    }
  }

  return <Modal open title={target === 'new' ? 'Novo equipamento' : 'Editar equipamento'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(formError) || saving} onClick={() => void submit()}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Select label="Local" id="equipment-form-site" value={draft.siteId} error={siteError} disabled={lockSite} onChange={event => setDraft({ ...draft, siteId: event.target.value })}><option value="">Selecione</option>{sites.map(site => <option key={site.id} value={site.id}>{site.clientName} - {site.name}</option>)}</Select>
      <Input label="Nome" id="equipment-form-name" maxLength={200} value={draft.name} error={nameError} onChange={event => setDraft({ ...draft, name: event.target.value })} />
      <Input label="Nº Patrimonio (opcional)" id="equipment-form-asset" maxLength={50} value={draft.assetNumber} onChange={event => setDraft({ ...draft, assetNumber: event.target.value })} />
      <Input label="Nº Serie (opcional)" id="equipment-form-serial" maxLength={100} value={draft.serialNumber} onChange={event => setDraft({ ...draft, serialNumber: event.target.value })} />
      <Input label="Fabricante (opcional)" id="equipment-form-manufacturer" maxLength={100} value={draft.manufacturer} onChange={event => setDraft({ ...draft, manufacturer: event.target.value })} />
      <Input label="Modelo (opcional)" id="equipment-form-model" maxLength={100} value={draft.model} onChange={event => setDraft({ ...draft, model: event.target.value })} />
      <div className="sm:col-span-2"><Textarea label="Descricao (opcional)" id="equipment-form-description" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></div>
      <div className="sm:col-span-2 grid grid-cols-[1fr_auto] items-end gap-2"><Input label="QR Code" id="equipment-form-qr" maxLength={100} value={draft.qrCode} error={qrError} onChange={event => setDraft({ ...draft, qrCode: event.target.value })} /><Button type="button" variant="secondary" onClick={() => setDraft({ ...draft, qrCode: generateQrCode() })}><RefreshCw size={16} />Gerar QR Code</Button></div>
      <Select label="Status" id="equipment-form-status" value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as EquipmentStatus })}><option value={EquipmentStatus.ACTIVE}>Ativo</option><option value={EquipmentStatus.INACTIVE}>Inativo</option><option value={EquipmentStatus.DECOMMISSIONED}>Descomissionado</option></Select>
      <Input label="Data de instalacao (opcional)" id="equipment-form-installed" type="date" value={draft.installedAt} onChange={event => setDraft({ ...draft, installedAt: event.target.value })} />
      {submitError && <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">{submitError}</p>}
    </div>
  </Modal>
}

function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const label = status === EquipmentStatus.ACTIVE ? 'Ativo' : status === EquipmentStatus.INACTIVE ? 'Inativo' : 'Descomissionado'
  const tone = status === EquipmentStatus.ACTIVE ? 'success' : status === EquipmentStatus.INACTIVE ? 'neutral' : 'danger'
  return <Badge tone={tone}>{label}</Badge>
}

function QrModal({ item, onClose }: { item: ManagedEquipment | null; onClose: () => void }) {
  return <Modal open={Boolean(item)} title="QR Code do equipamento" onClose={onClose}>{item && <div className="grid place-items-center gap-4"><div aria-label={`Representacao visual do QR Code ${item.qrCode}`} className="grid h-44 w-44 grid-cols-7 gap-1 rounded-card border border-border bg-white p-4">{Array.from({ length: 49 }, (_, index) => <span key={index} className={(index + item.qrCode.length) % 3 === 0 ? 'bg-text' : 'bg-primary-light'} />)}</div><div className="text-center"><p className="font-semibold">{item.name}</p><p className="font-mono text-sm text-muted">{item.qrCode}</p></div></div>}</Modal>
}

function equipmentInput(item: ManagedEquipment): EquipmentInput {
  return { siteId: item.siteId, name: item.name, assetNumber: item.assetNumber, serialNumber: item.serialNumber, manufacturer: item.manufacturer, model: item.model, description: item.description, qrCode: item.qrCode, status: item.status, installedAt: item.installedAt }
}

function generateQrCode() {
  return `FO-${globalThis.crypto.randomUUID()}`
}

function equipmentError(cause: unknown, fallback: string) {
  if (cause instanceof ApiError) {
    if (cause.status === 409) return 'Este QR Code ja esta vinculado a outro equipamento.'
    if (cause.fieldErrors.length) return cause.fieldErrors.map(error => error.message).join(' ')
  }
  return fallback
}
