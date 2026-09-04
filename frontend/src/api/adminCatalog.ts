import { apiRequest } from '@/api/client'
import { InspectionStatus, Priority } from '@/types/domain'

export type TemplateListStatus = 'ACTIVE' | 'DRAFT'

export interface TemplateSummary {
  id: string
  title: string
  category: string
  version: number
  sectionCount: number
  itemCount: number
  status: TemplateListStatus
}

export interface AdminInspectionSummary {
  id: string
  title: string
  clientName: string
  siteName: string
  equipmentName: string
  technicianId: string
  technicianName: string
  priority: Priority
  dueDate: string
  status: InspectionStatus
  progress: number
  overdue: boolean
}

interface BackendPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

interface BackendTemplate extends Omit<TemplateSummary, 'id'> { id: number }
interface BackendInspection extends Omit<AdminInspectionSummary, 'id' | 'technicianId'> {
  id: number
  technicianId: number
}

export const adminCatalogApi = {
  async listTemplates(filters: { name: string; status: TemplateListStatus | ''; page: number; size: number; sort: string }) {
    const params = pageParams(filters.page, filters.size, filters.sort)
    if (filters.name.trim()) params.set('name', filters.name.trim())
    if (filters.status) params.set('status', filters.status)
    const result = await apiRequest<BackendPage<BackendTemplate>>(`/api/v1/inspection-templates?${params}`)
    return { ...result, content: result.content.map(item => ({ ...item, id: String(item.id) })) }
  },

  async listInspections(filters: {
    name: string; status: InspectionStatus | ''; technicianName: string; clientName: string
    priority: Priority | ''; dueDate: string; overdue: boolean; review: boolean
    page: number; size: number; sort: string
  }) {
    const params = pageParams(filters.page, filters.size, filters.sort)
    if (filters.name.trim()) params.set('name', filters.name.trim())
    if (filters.status) params.set('status', filters.status)
    if (filters.technicianName) params.set('technicianName', filters.technicianName)
    if (filters.clientName) params.set('clientName', filters.clientName)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.dueDate) params.set('dueDate', filters.dueDate)
    if (filters.overdue) params.set('overdue', 'true')
    if (filters.review) params.set('review', 'true')
    const result = await apiRequest<BackendPage<BackendInspection>>(`/api/v1/inspections?${params}`)
    return { ...result, content: result.content.map(item => ({ ...item, id: String(item.id), technicianId: String(item.technicianId) })) }
  },
}

function pageParams(page: number, size: number, sort: string) {
  return new URLSearchParams({ page: String(page), size: String(size), sort })
}
