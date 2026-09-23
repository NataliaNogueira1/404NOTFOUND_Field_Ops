import { apiRequest } from '@/api/client'

// ── Response type ─────────────────────────────────────────────────────────────

/**
 * Mirrors the backend `DashboardSummaryResponse` record.
 *
 * - `byStatus`       — inspection counts keyed by InspectionStatus name
 * - `byCriticality`  — non-terminal inspection counts keyed by Priority name
 * - `openNonConformities` — always 0 until backend NonConformity domain is implemented
 * - `overdue`        — inspections whose dueDate has passed and are not terminal
 */
export interface DashboardSummary {
  byStatus: Record<string, number>
  byCriticality: Record<string, number>
  openNonConformities: number
  overdue: number
}

export interface DashboardFilters {
  from?: string    // ISO date YYYY-MM-DD, optional
  to?: string      // ISO date YYYY-MM-DD, optional
  clientName?: string
}

// ── API call ──────────────────────────────────────────────────────────────────

export const dashboardApi = {
  /**
   * Fetches aggregated dashboard indicators from `GET /api/v1/dashboard/summary`.
   * All filters are optional.
   */
  async getSummary(filters: DashboardFilters = {}): Promise<DashboardSummary> {
    const params = new URLSearchParams()
    if (filters.from) params.set('from', filters.from)
    if (filters.to) params.set('to', filters.to)
    if (filters.clientName?.trim()) params.set('clientName', filters.clientName.trim())

    const query = params.toString()
    return apiRequest<DashboardSummary>(
      `/api/v1/dashboard/summary${query ? `?${query}` : ''}`,
    )
  },
}
