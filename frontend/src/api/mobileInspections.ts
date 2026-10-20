import { httpClient } from '@/api/client'
import {
  InspectionStatus,
  Priority,
  ResponseType,
  type Inspection,
  type InspectionTemplate,
  type TemplateItem,
  type TemplateSection,
} from '@/types/domain'

/**
 * A technician inspection enriched with the immutable template snapshot that the
 * mobile pull endpoint already returns. The portal reads/accompanies the assigned
 * inspections; writing answers/evidence stays in the mobile sync flow (PBI-051).
 */
export interface TechnicianInspection extends Inspection {
  template: InspectionTemplate
  equipmentQrCode?: string
  rejectionReason?: string
}

/** Raw item of the template snapshot as returned by {@code MobileInspectionResponse.ItemDto}. */
interface BackendTemplateItem {
  id: string
  question: string
  description: string | null
  responseType: string
  required: boolean
  requireObservationOnFailure: boolean
  requireEvidenceOnFailure: boolean
  options: string[] | null
}

interface BackendTemplateSection {
  id: string
  title: string
  items: BackendTemplateItem[]
}

interface BackendTemplate {
  id: string
  title: string
  category: string | null
  version: number | null
  sections: BackendTemplateSection[]
}

/** Raw inspection as returned by {@code GET /api/v1/mobile/inspections} ({@code MobileInspectionResponse}). */
interface BackendMobileInspection {
  id: string
  title: string
  templateId: string
  clientId: string
  clientName: string | null
  siteId: string
  siteName: string | null
  equipmentId: string | null
  equipmentName: string | null
  equipmentQrCode: string | null
  technicianId: string
  supervisorId: string | null
  supervisorName: string | null
  status: string
  priority: string
  dueDate: string | null
  dueTime: string | null
  createdAt: string | null
  startedAt: string | null
  progress: number | null
  supervisorInstructions: string | null
  rejectionReason: string | null
  version: number | null
  template: BackendTemplate | null
}

function toResponseType(value: string): ResponseType {
  return Object.values(ResponseType).includes(value as ResponseType)
    ? (value as ResponseType)
    : ResponseType.TEXT_SHORT
}

function toInspectionStatus(value: string): InspectionStatus {
  return Object.values(InspectionStatus).includes(value as InspectionStatus)
    ? (value as InspectionStatus)
    : InspectionStatus.ASSIGNED
}

function toPriority(value: string): Priority {
  return Object.values(Priority).includes(value as Priority) ? (value as Priority) : Priority.MEDIUM
}

function normalizeItem(item: BackendTemplateItem): TemplateItem {
  return {
    id: item.id,
    question: item.question,
    description: item.description ?? undefined,
    responseType: toResponseType(item.responseType),
    required: item.required,
    requireObservationOnFailure: item.requireObservationOnFailure,
    requireEvidenceOnFailure: item.requireEvidenceOnFailure,
    options: item.options ?? undefined,
  }
}

function normalizeSection(section: BackendTemplateSection): TemplateSection {
  return {
    id: section.id,
    title: section.title,
    items: section.items.map(normalizeItem),
  }
}

function normalizeTemplate(template: BackendTemplate | null, fallbackId: string): InspectionTemplate {
  return {
    id: template?.id ?? fallbackId,
    title: template?.title ?? 'Modelo de inspecao',
    category: template?.category ?? '',
    description: '',
    version: template?.version ?? 1,
    status: 'Ativa',
    sections: (template?.sections ?? []).map(normalizeSection),
  }
}

function isOverdue(status: InspectionStatus, dueDate: string | null): boolean {
  if (!dueDate) return false
  const open = status === InspectionStatus.ASSIGNED || status === InspectionStatus.IN_PROGRESS
  return open && dueDate < new Date().toISOString().slice(0, 10)
}

function normalize(inspection: BackendMobileInspection): TechnicianInspection {
  const status = toInspectionStatus(inspection.status)
  const dueDate = inspection.dueDate ?? ''
  return {
    id: inspection.id,
    title: inspection.title,
    templateId: inspection.templateId,
    clientId: inspection.clientId,
    clientName: inspection.clientName ?? '',
    siteId: inspection.siteId,
    siteName: inspection.siteName ?? '',
    equipmentId: inspection.equipmentId ?? '',
    equipmentName: inspection.equipmentName ?? '',
    equipmentQrCode: inspection.equipmentQrCode ?? undefined,
    technicianId: inspection.technicianId,
    supervisorId: inspection.supervisorId ?? undefined,
    supervisorName: inspection.supervisorName ?? '',
    status,
    priority: toPriority(inspection.priority),
    dueDate,
    dueTime: inspection.dueTime ?? undefined,
    createdAt: inspection.createdAt ?? undefined,
    startedAt: inspection.startedAt ?? undefined,
    progress: inspection.progress ?? 0,
    overdue: isOverdue(status, inspection.dueDate),
    supervisorInstructions: inspection.supervisorInstructions ?? undefined,
    rejectionReason: inspection.rejectionReason ?? undefined,
    template: normalizeTemplate(inspection.template, inspection.templateId),
  }
}

export const mobileInspectionsApi = {
  /**
   * Lists the inspections assigned to the authenticated technician, including the
   * immutable template snapshot. Restricted to TECHNICIAN on the API; throws
   * {@link ApiError} on transport/authorization failures so callers can react.
   */
  async list(): Promise<TechnicianInspection[]> {
    const inspections = await httpClient.get<BackendMobileInspection[]>('/api/v1/mobile/inspections')
    return inspections.map(normalize)
  },
}
