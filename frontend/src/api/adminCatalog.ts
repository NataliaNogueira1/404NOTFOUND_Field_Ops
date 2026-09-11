import { apiRequest } from '@/api/client'
import { InspectionStatus, Priority } from '@/types/domain'

export type TemplateListStatus = 'ACTIVE' | 'DRAFT'

// ── Template versions ────────────────────────────────────────────────────────

export interface TemplateVersionSummary {
  templateId: string
  versionNumber: number
  activeForNewInspections: boolean
  publishedAt: string
}

// ── Schedule inspection ──────────────────────────────────────────────────────

export interface ScheduleInspectionRequest {
  templateId: number
  technicianId: number
  clientName: string
  siteName: string
  equipmentName: string
  priority: Priority
  dueDate: string        // ISO date: YYYY-MM-DD
  dueTime?: string       // ISO time: HH:mm:ss (optional)
  supervisorInstructions?: string
}

export interface ScheduleInspectionResponse {
  id: string
  title: string
  templateId: string
  templateTitle: string
  clientName: string
  siteName: string
  equipmentName: string
  technicianId: string
  technicianName: string
  supervisorId: string
  supervisorName: string
  priority: Priority
  dueDate: string
  dueTime?: string
  supervisorInstructions?: string
  status: InspectionStatus
  progress: number
  createdAt: string
}

export interface InspectionTemplateInput {
  title: string
  description: string
  category: string
}

export interface ManagedInspectionTemplate extends InspectionTemplateInput {
  id: string
  status: TemplateListStatus
  currentVersion: number
  createdBy: string
  createdAt?: string
  updatedAt?: string
  version?: number
}

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
interface BackendManagedTemplate extends Omit<ManagedInspectionTemplate, 'id' | 'createdBy'> {
  id: number
  createdBy: number
}
interface BackendInspection extends Omit<AdminInspectionSummary, 'id' | 'technicianId'> {
  id: number
  technicianId: number
}
interface BackendScheduleResponse extends Omit<ScheduleInspectionResponse, 'id' | 'templateId' | 'technicianId' | 'supervisorId'> {
  id: number
  templateId: number
  technicianId: number
  supervisorId: number
}
interface BackendTemplateVersion extends Omit<TemplateVersionSummary, 'templateId'> {
  templateId: number
}

export const adminCatalogApi = {
  async createTemplate(input: InspectionTemplateInput) {
    const result = await apiRequest<BackendManagedTemplate>('/api/v1/inspection-templates', {
      method: 'POST', body: JSON.stringify(input),
    })
    return managedTemplate(result)
  },

  async getTemplate(id: string) {
    return managedTemplate(await apiRequest<BackendManagedTemplate>(`/api/v1/inspection-templates/${id}`))
  },

  async updateTemplate(id: string, input: InspectionTemplateInput) {
    const result = await apiRequest<BackendManagedTemplate>(`/api/v1/inspection-templates/${id}`, {
      method: 'PUT', body: JSON.stringify(input),
    })
    return managedTemplate(result)
  },

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

  /** Fetches published versions of a template eligible for scheduling new inspections. */
  async listTemplateVersions(templateId: string): Promise<TemplateVersionSummary[]> {
    const result = await apiRequest<BackendTemplateVersion[]>(
      `/api/v1/inspection-templates/${templateId}/versions?activeForNewInspections=true`,
    )
    return result.map(v => ({ ...v, templateId: String(v.templateId) }))
  },

  /** Schedules a new inspection from a published template. Returns HTTP 201 on success. */
  async scheduleInspection(request: ScheduleInspectionRequest): Promise<ScheduleInspectionResponse> {
    const result = await apiRequest<BackendScheduleResponse>('/api/v1/inspections', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return {
      ...result,
      id: String(result.id),
      templateId: String(result.templateId),
      technicianId: String(result.technicianId),
      supervisorId: String(result.supervisorId),
    }
  },
}

function managedTemplate(template: BackendManagedTemplate): ManagedInspectionTemplate {
  return { ...template, id: String(template.id), createdBy: String(template.createdBy) }
}

function pageParams(page: number, size: number, sort: string) {
  return new URLSearchParams({ page: String(page), size: String(size), sort })
}
