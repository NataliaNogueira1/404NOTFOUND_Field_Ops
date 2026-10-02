import type { AnswerHistoryEntry } from '@/types/domain'
import { httpClient } from './client'

/**
 * Backend shape of one answer-history entry (PBI-088). Mirrors AnswerHistoryResponse on the API.
 * itemId comes as a string already; ids are otherwise numeric on the backend.
 */
interface BackendAnswerHistoryEntry {
  itemId: string
  section: string
  sectionOrder: number | null
  itemTitle: string
  itemOrder: number | null
  responseType: string | null
  value: string | null
  observation: string | null
  answeredAt: string
  answeredBy: string | null
  answeredById: number | null
}

function normalize(entry: BackendAnswerHistoryEntry): AnswerHistoryEntry {
  return {
    itemId: entry.itemId,
    section: entry.section,
    sectionOrder: entry.sectionOrder ?? undefined,
    itemTitle: entry.itemTitle,
    itemOrder: entry.itemOrder ?? undefined,
    responseType: entry.responseType ?? undefined,
    value: entry.value,
    observation: entry.observation,
    answeredAt: entry.answeredAt,
    answeredBy: entry.answeredBy,
    answeredById: entry.answeredById ?? undefined,
  }
}

export const inspectionAnswersApi = {
  /**
   * Detailed answer history of an inspection, ordered by section, item and time.
   * Restricted to ADMINISTRATOR/SUPERVISOR on the API. Throws ApiError (e.g. status 404
   * for an unknown inspection) so callers can distinguish "not found" from "no history".
   */
  async getInspectionAnswersHistory(inspectionId: string): Promise<AnswerHistoryEntry[]> {
    const entries = await httpClient.get<BackendAnswerHistoryEntry[]>(
      `/api/v1/inspections/${inspectionId}/answers/history`,
    )
    return entries.map(normalize)
  },
}
