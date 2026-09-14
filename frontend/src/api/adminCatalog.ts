import { apiRequest } from '@/api/client'
import { InspectionStatus, Priority, ResponseType, type TemplateItem } from '@/types/domain'

export type TemplateListStatus = 'ACTIVE' | 'DRAFT'

// ── Schedule inspection ──────────────────────────────────────────────────────

/** Payload accepted by the backend to schedule an inspection from a published template version. */
export interface CreateInspectionRequest {
  title: string
  templateVersionId: number
  clientId: number
  siteId: number
  equipmentId: number
  technicianId: number
  priority: Priority
  dueDate: string        // ISO date: YYYY-MM-DD
  dueTime?: string       // ISO time: HH:mm:ss (optional)
  supervisorInstructions?: string
}

export interface CreatedInspection {
  id: string
  title: string
  status: InspectionStatus
  dueDate: string
  clientName: string
  equipmentName: string
  technicianName: string
}

export interface InspectionTemplateInput {
  title: string
  description: string
  category: string
}

export interface ManagedTemplateSection {
  id: string
  title: string
  description: string
  displayOrder: number
  items: TemplateItem[]
}

export interface TemplateSectionInput {
  title: string
  description: string
  displayOrder: number
}

export interface TemplateItemInput {
  title: string
  description: string
  responseType: ResponseType
  required: boolean
  observationRequiredOnFailure: boolean
  evidenceRequiredOnFailure: boolean
  optionsJson: string[] | null
  displayOrder: number
}

export interface ManagedInspectionTemplate extends InspectionTemplateInput {
  id: string
  status: TemplateListStatus
  currentVersion: number
  createdBy: string
  createdAt?: string
  updatedAt?: string
  version?: number
  sections: ManagedTemplateSection[]
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

export interface InspectionTemplateVersion {
  id: string
  versionNumber: number
  titleSnapshot: string
  descriptionSnapshot: string | null
  publishedAt: string
  publishedBy: string
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
interface BackendManagedTemplate extends Omit<ManagedInspectionTemplate, 'id' | 'createdBy' | 'sections'> {
  id: number
  createdBy: number
  sections?: BackendTemplateSection[]
}
interface BackendTemplateSection extends Omit<ManagedTemplateSection, 'id' | 'description' | 'items'> {
  id: number
  description: string | null
  items?: BackendTemplateItem[]
}
interface BackendTemplateItem extends Omit<TemplateItemInput, 'description'> {
  id: number
  description: string | null
}
interface BackendInspection extends Omit<AdminInspectionSummary, 'id' | 'technicianId'> {
  id: number
  technicianId: number
}
interface BackendCreatedInspection extends Omit<CreatedInspection, 'id'> {
  id: number
}
interface BackendTemplateVersion extends Omit<InspectionTemplateVersion, 'id' | 'publishedBy'> {
  id: number
  publishedBy: number
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

  async createTemplateSection(templateId: string, input: TemplateSectionInput) {
    const result = await apiRequest<BackendTemplateSection>(`/api/v1/inspection-templates/${templateId}/sections`, {
      method: 'POST', body: JSON.stringify(input),
    })
    return managedSection(result)
  },

  async updateTemplateSection(templateId: string, sectionId: string, input: TemplateSectionInput) {
    const result = await apiRequest<BackendTemplateSection>(`/api/v1/inspection-templates/${templateId}/sections/${sectionId}`, {
      method: 'PUT', body: JSON.stringify(input),
    })
    return managedSection(result)
  },

  async deleteTemplateSection(templateId: string, sectionId: string) {
    await apiRequest<void>(`/api/v1/inspection-templates/${templateId}/sections/${sectionId}`, { method: 'DELETE' })
  },

  async createTemplateItem(templateId: string, sectionId: string, input: TemplateItemInput) {
    const result = await apiRequest<BackendTemplateItem>(`/api/v1/inspection-templates/${templateId}/sections/${sectionId}/items`, {
      method: 'POST', body: JSON.stringify(input),
    })
    return managedItem(result)
  },

  async updateTemplateItem(templateId: string, sectionId: string, itemId: string, input: TemplateItemInput) {
    const result = await apiRequest<BackendTemplateItem>(`/api/v1/inspection-templates/${templateId}/sections/${sectionId}/items/${itemId}`, {
      method: 'PUT', body: JSON.stringify(input),
    })
    return managedItem(result)
  },

  async publishTemplate(templateId: string) {
    const version = await apiRequest<BackendTemplateVersion>(`/api/v1/inspection-templates/${templateId}/publish`, {
      method: 'POST',
    })
    return managedVersion(version)
  },

  async listTemplateVersions(templateId: string) {
    const versions = await apiRequest<BackendTemplateVersion[]>(`/api/v1/inspection-templates/${templateId}/versions`)
    return versions.map(managedVersion)
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

  /** Schedules a new inspection from a published template version. Returns HTTP 201 on success. */
  async createInspection(request: CreateInspectionRequest): Promise<CreatedInspection> {
    const result = await apiRequest<BackendCreatedInspection>('/api/v1/inspections', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return { ...result, id: String(result.id) }
  },
}

function managedTemplate(template: BackendManagedTemplate): ManagedInspectionTemplate {
  return {
    ...template,
    description: template.description ?? '',
    id: String(template.id),
    createdBy: String(template.createdBy),
    sections: (template.sections ?? []).map(managedSection).sort((a, b) => a.displayOrder - b.displayOrder),
  }
}

function managedSection(section: BackendTemplateSection): ManagedTemplateSection {
  return {
    ...section,
    id: String(section.id),
    description: section.description ?? '',
    items: (section.items ?? []).map(managedItem).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
  }
}

function managedItem(item: BackendTemplateItem): TemplateItem {
  return {
    id: String(item.id),
    question: item.title,
    description: item.description ?? '',
    responseType: item.responseType,
    required: item.required,
    options: item.optionsJson ?? undefined,
    displayOrder: item.displayOrder,
    requireObservationOnFailure: item.observationRequiredOnFailure ?? false,
    requireEvidenceOnFailure: item.evidenceRequiredOnFailure ?? false,
  }
}

function managedVersion(version: BackendTemplateVersion): InspectionTemplateVersion {
  return { ...version, id: String(version.id), publishedBy: String(version.publishedBy) }
}

function pageParams(page: number, size: number, sort: string) {
  return new URLSearchParams({ page: String(page), size: String(size), sort })
}
