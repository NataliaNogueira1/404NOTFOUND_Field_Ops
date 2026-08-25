import { clients, equipment, templates, users } from '@/mocks/domain'
import { InspectionStatus, Priority, Severity, type ChecklistAnswer, type Evidence, type Inspection, type NonConformity, type SyncOperation } from '@/types/domain'

const today = new Date()
const fmt = (date: Date) => date.toISOString().slice(0, 10)
const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export const technicianUser = users.find(user => user.id === 'usr-carlos') ?? users[1]
export const technicianTemplate = templates[0]

export const technicianInspections: Inspection[] = [
  {
    id: 'ins-tech-compressor',
    title: 'Inspecao Preventiva - Compressor XPTO 500',
    templateId: 'tpl-compressor',
    clientId: 'cli-industria',
    clientName: 'Industria Modelo',
    siteId: 'site-sorocaba',
    siteName: 'Unidade Sorocaba',
    equipmentId: 'eq-compressor',
    equipmentName: 'Compressor XPTO 500',
    technicianId: 'usr-carlos',
    supervisorId: 'usr-marina',
    supervisorName: 'Marina Silva',
    status: InspectionStatus.ASSIGNED,
    priority: Priority.HIGH,
    dueDate: fmt(today),
    dueTime: '09:00',
    createdAt: fmt(addDays(today, -3)),
    progress: 0,
    syncStatus: 'pending',
    pendingSyncCount: 3,
    supervisorInstructions: 'Verificar condicao da bateria com atencao especial. Ultimo relatorio indicou corrosao.',
  },
  {
    id: 'ins-tech-gerador',
    title: 'Inspecao Gerador Diesel',
    templateId: 'tpl-gerador',
    clientId: 'cli-logistica',
    clientName: 'Logistica ABC',
    siteId: 'site-campinas',
    siteName: 'CD Campinas',
    equipmentId: 'eq-gerador',
    equipmentName: 'Gerador Diesel GD-002',
    technicianId: 'usr-carlos',
    supervisorId: 'usr-marina',
    supervisorName: 'Marina Silva',
    status: InspectionStatus.ASSIGNED,
    priority: Priority.MEDIUM,
    dueDate: fmt(addDays(today, 1)),
    dueTime: '14:00',
    createdAt: fmt(addDays(today, -2)),
    progress: 0,
    syncStatus: 'synced',
    pendingSyncCount: 0,
    supervisorInstructions: 'Validar nivel de combustivel e resposta em carga.',
  },
  {
    id: 'ins-tech-extintor',
    title: 'Inspecao Extintor P12',
    templateId: 'tpl-extintor',
    clientId: 'cli-industria',
    clientName: 'Industria Modelo',
    siteId: 'site-sp',
    siteName: 'Unidade Sao Paulo',
    equipmentId: 'eq-extintor',
    equipmentName: 'Extintor P12',
    technicianId: 'usr-carlos',
    supervisorId: 'usr-marina',
    supervisorName: 'Marina Silva',
    status: InspectionStatus.REJECTED,
    priority: Priority.LOW,
    dueDate: fmt(addDays(today, -2)),
    dueTime: '11:30',
    createdAt: fmt(addDays(today, -5)),
    progress: 84,
    overdue: true,
    syncStatus: 'error',
    pendingSyncCount: 1,
    supervisorInstructions: 'Corrigir evidencia do lacre e reenviar.',
  },
  {
    id: 'ins-tech-empilhadeira',
    title: 'Inspecao Empilhadeira 01',
    templateId: 'tpl-compressor',
    clientId: 'cli-horizonte',
    clientName: 'Metalurgica Horizonte',
    siteId: 'site-jundiai',
    siteName: 'Centro Operacional Jundiai',
    equipmentId: 'eq-empilhadeira',
    equipmentName: 'Empilhadeira 01',
    technicianId: 'usr-carlos',
    supervisorId: 'usr-marina',
    supervisorName: 'Marina Silva',
    status: InspectionStatus.IN_PROGRESS,
    priority: Priority.CRITICAL,
    dueDate: fmt(addDays(today, 3)),
    dueTime: '16:00',
    createdAt: fmt(addDays(today, -1)),
    progress: 58,
    syncStatus: 'pending',
    pendingSyncCount: 2,
    supervisorInstructions: 'Priorizar verificacao de freio e sinais sonoros.',
  },
]

export const technicianAnswers: Record<string, ChecklistAnswer> = {
  'item-1': { itemId: 'item-1', value: 'CONFORME', observation: 'Placa legivel.', savedAt: fmt(today) },
  'item-2': { itemId: 'item-2', value: 'NAO_CONFORME', observation: 'Residuo de oleo na base.', savedAt: fmt(today) },
  'item-3': { itemId: 'item-3', value: true, savedAt: fmt(today) },
  'item-6': { itemId: 'item-6', value: 'Funcionando', savedAt: fmt(today) },
  'item-9': { itemId: 'item-9', value: 4.2, observation: 'Dentro da faixa.', savedAt: fmt(today) },
}

export const technicianEvidences: Evidence[] = [
  { id: 'ev-1', inspectionId: 'ins-tech-compressor', itemId: 'item-2', description: 'Foto mockada da base do compressor', capturedAt: `${fmt(today)} 09:18`, syncStatus: 'pending' },
  { id: 'ev-2', inspectionId: 'ins-tech-compressor', itemId: 'item-7', description: 'Foto mockada do cabo eletrico', capturedAt: `${fmt(today)} 09:31`, syncStatus: 'error' },
]

export const technicianNonConformities: NonConformity[] = [
  { id: 'nc-tech-oleo', title: 'Acumulo de oleo', inspectionId: 'ins-tech-compressor', item: 'Equipamento limpo e conservado?', clientId: 'cli-industria', severity: Severity.LOW, status: 'Aberta', date: fmt(today) },
  { id: 'nc-tech-cabo', title: 'Cabo eletrico danificado', inspectionId: 'ins-tech-compressor', item: 'Cabos eletricos integros?', clientId: 'cli-industria', severity: Severity.CRITICAL, status: 'Aberta', date: fmt(today) },
]

export const technicianSyncOperations: SyncOperation[] = [
  { id: 'sync-1', title: 'Resposta item 1', status: 'Enviada' },
  { id: 'sync-2', title: 'Foto item 2', status: 'Upload concluido' },
  { id: 'sync-3', title: 'Resposta item 5', status: 'Pendente' },
  { id: 'sync-4', title: 'Foto item 7', status: 'Erro' },
]

export function inspectionTemplate(inspection: Inspection) {
  return templates.find(template => template.id === inspection.templateId) ?? technicianTemplate
}

export function inspectionClient(inspection: Inspection) {
  return clients.find(client => client.id === inspection.clientId)
}

export function inspectionEquipment(inspection: Inspection) {
  return equipment.find(item => item.id === inspection.equipmentId)
}
