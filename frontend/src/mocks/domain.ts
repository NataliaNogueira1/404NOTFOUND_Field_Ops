import { InspectionStatus, Priority, UserRole, type Client, type Equipment, type Inspection, type InspectionTemplate, type NonConformity, type Site, type User } from '@/types/domain'

export const users: User[] = [
  { id: 'usr-marina', name: 'Marina Silva', email: 'marina@fieldops.com', role: UserRole.SUPERVISOR },
  { id: 'usr-carlos', name: 'Carlos Henrique', email: 'carlos@fieldops.com', role: UserRole.TECHNICIAN },
]
export const clients: Client[] = [{ id: 'cli-1', name: 'Indústria Modelo', active: true }]
export const sites: Site[] = [{ id: 'site-1', name: 'Unidade Sorocaba', clientId: 'cli-1', city: 'Sorocaba', state: 'SP' }]
export const equipment: Equipment[] = [{ id: 'eq-1', name: 'Compressor XPTO 500', siteId: 'site-1', tag: 'CMP-500' }]
export const templates: InspectionTemplate[] = [{ id: 'tpl-1', name: 'Inspeção Preventiva de Compressor', equipmentType: 'Compressor', version: 1 }]
export const inspections: Inspection[] = [{ id: 'ins-1', templateId: 'tpl-1', equipmentId: 'eq-1', technicianId: 'usr-carlos', status: InspectionStatus.IN_PROGRESS, priority: Priority.HIGH, dueDate: '2026-08-20' }]
export const nonConformities: NonConformity[] = [{ id: 'nc-1', inspectionId: 'ins-1', title: 'Vazamento de óleo', priority: Priority.CRITICAL, resolved: false }]

export const dashboardStats = { total: 12, pending: 3, overdue: 5, critical: 2 }
export const inspectionsByStatus = [
  { name: 'Atribuídas', value: 4, fill: '#2563EB' }, { name: 'Em andamento', value: 3, fill: '#7C3AED' },
  { name: 'Enviadas', value: 3, fill: '#F59E0B' }, { name: 'Aprovadas', value: 2, fill: '#16A34A' },
]
export const nonConformitiesByPriority = [
  { label: 'Crítica', value: 2, color: 'bg-danger' }, { label: 'Alta', value: 5, color: 'bg-orange-500' },
  { label: 'Média', value: 8, color: 'bg-warning' }, { label: 'Baixa', value: 3, color: 'bg-slate-400' },
]
