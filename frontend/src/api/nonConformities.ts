import { apiRequest } from '@/api/client'
import type { Severity } from '@/types/domain'

export type NonConformityStatus = 'OPEN' | 'CLOSED'
export interface NonConformityRecord { id: string; title: string; description: string; inspectionId: string; inspectionTitle: string; itemSnapshotId: string | null; itemTitle: string | null; clientId: string; clientName: string; severity: Severity; status: NonConformityStatus; createdAt: string; closedAt: string | null }
interface BackendRecord extends Omit<NonConformityRecord, 'id' | 'inspectionId' | 'itemSnapshotId' | 'clientId'> { id: number; inspectionId: number; itemSnapshotId: number | null; clientId: number }
interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number }
export const nonConformitiesApi = {
  async list(filters: { inspectionId?: string; clientId?: string; severity?: Severity | ''; status?: NonConformityStatus | ''; page: number; size: number }) {
    const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size) })
    if (filters.inspectionId) params.set('inspectionId', filters.inspectionId)
    if (filters.clientId) params.set('clientId', filters.clientId)
    if (filters.severity) params.set('severity', filters.severity)
    if (filters.status) params.set('status', filters.status)
    const page = await apiRequest<Page<BackendRecord>>(`/api/v1/non-conformities?${params}`)
    return { ...page, content: page.content.map(value => ({ ...value, id: String(value.id), inspectionId: String(value.inspectionId), itemSnapshotId: value.itemSnapshotId === null ? null : String(value.itemSnapshotId), clientId: String(value.clientId) })) }
  },
}
