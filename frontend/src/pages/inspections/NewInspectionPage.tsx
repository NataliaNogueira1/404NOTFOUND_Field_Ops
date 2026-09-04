import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClientStatus, clientsApi } from '@/api/clients'
import { EquipmentStatus, equipmentApi } from '@/api/equipment'
import { InspectionSiteStatus, sitesApi } from '@/api/sites'
import { Toast } from '@/components/feedback/Toast'
import { Select, Textarea } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { clients, equipment, sites, templates, users } from '@/mocks/domain'
import { inspectionStore } from '@/state/mockStores'
import { InspectionStatus, Priority, UserRole, type Inspection } from '@/types/domain'

export function NewInspectionPage() {
  const navigate = useNavigate()
  const [templateId, setTemplateId] = useState(templates[0].id)
  const [clientId, setClientId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [technicianId, setTechnicianId] = useState(users.find(user => user.role === UserRole.TECHNICIAN)?.id ?? '')
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM)
  const [dueDate, setDueDate] = useState('2026-08-14')
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState(false)
  const [selectableClients, setSelectableClients] = useState(
    clients.filter(client => client.active).map(client => ({ id: client.id, name: client.name })),
  )
  const [availableSites, setAvailableSites] = useState<{ id: string; clientId: string; name: string }[]>([])
  const [availableEquipment, setAvailableEquipment] = useState<{ id: string; siteId: string; name: string }[]>([])
  const technicians = users.filter(user => user.role === UserRole.TECHNICIAN && user.active)

  useEffect(() => {
    void clientsApi.list({ name: '', status: ClientStatus.ACTIVE, page: 0, size: 100 })
      .then(result => setSelectableClients(result.content.map(client => ({ id: client.id, name: client.name }))))
      .catch(() => { /* Keep the local prototype options while the API is unavailable. */ })
  }, [])

  useEffect(() => {
    if (!clientId) return
    void sitesApi.list({ name: '', clientId, status: InspectionSiteStatus.ACTIVE, page: 0, size: 100 })
      .then(result => setAvailableSites(result.content.map(site => ({ id: site.id, clientId: site.clientId, name: site.name }))))
      .catch(() => setAvailableSites(sites.filter(site => site.active && site.clientId === clientId)))
  }, [clientId])

  useEffect(() => {
    if (!siteId) return
    void equipmentApi.list({ siteId, status: EquipmentStatus.ACTIVE, page: 0, size: 100 })
      .then(result => setAvailableEquipment(result.content.map(item => ({ id: item.id, siteId: item.siteId, name: item.name }))))
      .catch(() => setAvailableEquipment(equipment.filter(item => item.active && item.siteId === siteId)
        .map(item => ({ id: item.id, siteId: item.siteId, name: item.name }))))
  }, [siteId])

  function submit() {
    if (!templateId || !clientId || !siteId || !equipmentId || !technicianId || !dueDate) {
      setError('Preencha modelo, cliente, local, equipamento, tecnico e data prevista.')
      return
    }
    const selectedEquipment = availableEquipment.find(item => item.id === equipmentId)
    const inspection: Inspection = {
      id: `ins-${Date.now()}`,
      title: `Inspecao - ${selectedEquipment?.name ?? 'Equipamento'}`,
      templateId,
      clientId,
      siteId,
      equipmentId,
      technicianId,
      status: InspectionStatus.ASSIGNED,
      priority,
      dueDate,
      progress: 0,
      supervisorInstructions: instructions,
    }
    inspectionStore.addAdmin(inspection)
    setToast(true)
    setTimeout(() => navigate('/app/inspections'), 700)
  }

  return <div className="space-y-6"><PageHeader title="Nova inspecao" description="Agende uma atividade para execucao em campo." /><form className="space-y-5" onSubmit={e => { e.preventDefault(); submit() }}><Card className="grid gap-4 p-5 md:grid-cols-2"><h2 className="md:col-span-2 text-base font-semibold">Modelo</h2><Select label="Modelo de inspecao" id="new-template" value={templateId} onChange={e => setTemplateId(e.target.value)}>{templates.map(template => <option key={template.id} value={template.id}>{template.title}</option>)}</Select><Select label="Versao" id="new-version"><option>v{templates.find(template => template.id === templateId)?.version ?? 1}</option></Select></Card><Card className="grid gap-4 p-5 md:grid-cols-3"><h2 className="md:col-span-3 text-base font-semibold">Local</h2><Select label="Cliente" id="new-client" value={clientId} onChange={e => { setClientId(e.target.value); setSiteId(''); setEquipmentId(''); setError('') }}><option value="">Selecione</option>{selectableClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Select label="Local" id="new-site" value={siteId} onChange={e => { setSiteId(e.target.value); setEquipmentId(''); setError('') }} disabled={!clientId}><option value="">Selecione</option>{availableSites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}</Select><Select label="Equipamento" id="new-equipment" value={equipmentId} onChange={e => { setEquipmentId(e.target.value); setError('') }} disabled={!siteId}><option value="">Selecione</option>{availableEquipment.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Card><Card className="grid gap-4 p-5 md:grid-cols-3"><h2 className="md:col-span-3 text-base font-semibold">Atribuicao</h2><Select label="Tecnico" id="new-tech" value={technicianId} onChange={e => setTechnicianId(e.target.value)}><option value="">Selecione</option>{technicians.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</Select><Select label="Prioridade" id="new-priority" value={priority} onChange={e => setPriority(e.target.value as Priority)}>{Object.values(Priority).map(value => <option key={value}>{value}</option>)}</Select><Input label="Data prevista" id="new-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></Card><Card className="p-5"><Textarea label="Instrucoes do supervisor" id="instructions" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Orientacoes para o tecnico" /></Card>{error && <p className="text-sm font-medium text-danger">{error}</p>}<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => navigate('/app/inspections')}>Cancelar</Button><Button type="submit">Agendar inspecao</Button></div></form><Toast show={toast} message="Inspecao agendada no prototipo" /></div>
}
