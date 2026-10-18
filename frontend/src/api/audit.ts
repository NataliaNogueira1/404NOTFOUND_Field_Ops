import type { AuditTimelineEntry } from '@/types/domain'
import { httpClient } from './client'

/**
 * Shape bruta retornada pelo backend (AuditEventResponse).
 * `actorId` pode ser null quando o ator for o sistema.
 * `detail` é opcional no backend.
 */
interface BackendAuditEventResponse {
  id: number
  actorId: number | null
  action: string
  entityType: string
  entityId: number
  detail: string | null
  occurredAt: string
}

function normalize(entry: BackendAuditEventResponse): AuditTimelineEntry {
  return {
    id: entry.id,
    actorId: entry.actorId,
    // O backend garante que o valor é um membro válido de AuditAction — cast seguro.
    action: entry.action as AuditTimelineEntry['action'],
    entityType: entry.entityType,
    entityId: entry.entityId,
    detail: entry.detail,
    occurredAt: entry.occurredAt,
  }
}

export const auditApi = {
  /**
   * Retorna a timeline cronológica de auditoria de uma inspeção.
   * Endpoint: GET /api/v1/inspections/{id}/history
   * Restrito a ADMINISTRATOR e SUPERVISOR.
   */
  async getInspectionTimeline(inspectionId: string): Promise<AuditTimelineEntry[]> {
    const entries = await httpClient.get<BackendAuditEventResponse[]>(
      `/api/v1/inspections/${inspectionId}/history`,
    )
    return entries.map(normalize)
  },
}
