import { apiRequest } from '@/api/client'
import { InspectionStatus, Priority } from '@/types/domain'

/**
 * Raw payload returned by GET /api/v1/dashboard/summary (PBI-083).
 * Modeled separately from the UI model: the backend only emits the status and
 * criticality keys that have a non-zero count, so these maps may be sparse.
 */
export interface DashboardSummaryPayload {
  byStatus: Record<string, number>
  byCriticality: Record<string, number>
  openNonConformities: number
  overdue: number
}

/**
 * Normalized UI model: every InspectionStatus and Priority key is always
 * present (missing backend keys become 0), so components never branch on
 * undefined counts.
 */
export interface DashboardSummary {
  byStatus: Record<InspectionStatus, number>
  byCriticality: Record<Priority, number>
  openNonConformities: number
  overdue: number
}

export interface DashboardFilters {
  from?: string
  to?: string
  client?: string
  technicianId?: number
}

function normalize(payload: DashboardSummaryPayload): DashboardSummary {
  const byStatus = {} as Record<InspectionStatus, number>
  for (const status of Object.values(InspectionStatus)) {
    byStatus[status] = payload.byStatus[status] ?? 0
  }
  const byCriticality = {} as Record<Priority, number>
  for (const priority of Object.values(Priority)) {
    byCriticality[priority] = payload.byCriticality[priority] ?? 0
  }
  return {
    byStatus,
    byCriticality,
    openNonConformities: payload.openNonConformities,
    overdue: payload.overdue,
  }
}

export const dashboardApi = {
  async getSummary(filters: DashboardFilters = {}): Promise<DashboardSummary> {
    const params = new URLSearchParams()
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    // The verified backend contract names this query param 'client' (a free-text
    // client name). The stale feat/pbi-083 branch used 'clientName', which is
    // wrong for the current develop — do not reintroduce it.
    if (filters.client?.trim()) params.set('client', filters.client.trim())
    if (filters.technicianId !== undefined) params.set('technicianId', String(filters.technicianId))
    const query = params.toString()
    const payload = await apiRequest<DashboardSummaryPayload>(
      `/api/v1/dashboard/summary${query ? `?${query}` : ''}`,
    )
    return normalize(payload)
  },
}
