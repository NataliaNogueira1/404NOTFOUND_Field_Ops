import { apiRequest } from '@/api/client'
import { inspectionReviewApi, type ReviewEvidence } from '@/api/inspectionReview'
import type { LightboxPhoto } from '@/components/feedback/Lightbox'
import { Severity } from '@/types/domain'

/**
 * Lifecycle status of a non-conformity, mirroring com.fieldops.nonconformity.model.NonConformityStatus.
 * The backend only models OPEN/CLOSED; the admin list surfaces them as Portuguese labels.
 */
export enum NonConformityStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

/**
 * Non-conformity as consumed by the admin list (PBI-228, GET /api/v1/non-conformities).
 * IDs are normalized to strings to match the rest of the frontend domain.
 */
export interface NonConformityListItem {
  id: string
  inspectionId: string
  clientName: string
  inspectionItemSnapshotId: string | null
  title: string
  description: string
  severity: Severity
  status: NonConformityStatus
  createdAt: string
  closedAt: string | null
}

interface BackendNonConformity {
  id: number
  inspectionId: number
  clientName: string | null
  inspectionItemSnapshotId: number | null
  title: string
  description: string | null
  severity: Severity
  status: NonConformityStatus
  createdAt: string
  closedAt: string | null
}

interface BackendPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface NonConformityFilters {
  inspectionId?: string
  client?: string
  severity?: Severity | ''
  status?: NonConformityStatus | ''
  page: number
  size: number
  sort?: string
}

function normalize(nonConformity: BackendNonConformity): NonConformityListItem {
  return {
    id: String(nonConformity.id),
    inspectionId: String(nonConformity.inspectionId),
    clientName: nonConformity.clientName ?? '',
    inspectionItemSnapshotId:
      nonConformity.inspectionItemSnapshotId === null ? null : String(nonConformity.inspectionItemSnapshotId),
    title: nonConformity.title,
    description: nonConformity.description ?? '',
    severity: nonConformity.severity,
    status: nonConformity.status,
    createdAt: nonConformity.createdAt,
    closedAt: nonConformity.closedAt,
  }
}

/**
 * Maps an inspection evidence to the lightbox photo contract (PBI-255). The
 * binary content is loaded lazily on open via inspectionReviewApi.loadEvidenceImage,
 * so `src` stays empty here and only `contentUrl` is carried.
 */
function evidencePhoto(evidence: ReviewEvidence, itemTitle: string): LightboxPhoto {
  return {
    src: '',
    contentUrl: evidence.contentUrl,
    item: itemTitle,
    capturedAt: evidence.capturedAt,
    location: evidence.location ?? undefined,
    description: evidence.description ?? undefined,
  }
}

export const nonConformitiesApi = {
  async list(filters: NonConformityFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      size: String(filters.size),
      sort: filters.sort ?? 'createdAt,desc',
    })
    if (filters.inspectionId?.trim()) params.set('inspectionId', filters.inspectionId.trim())
    if (filters.client?.trim()) params.set('client', filters.client.trim())
    if (filters.severity) params.set('severity', filters.severity)
    if (filters.status) params.set('status', filters.status)
    const result = await apiRequest<BackendPage<BackendNonConformity>>(`/api/v1/non-conformities?${params}`)
    return { ...result, content: result.content.map(normalize) }
  },

  /**
   * Resolve the equipment photos already linked to a non-conformity for the
   * supervisor/admin NC detail view (PBI-255). It reuses the inspection review
   * payload — the single place the backend exposes evidences per item snapshot —
   * and filters by the NC's `inspectionItemSnapshotId`. When the NC is not bound
   * to a specific item snapshot, there is no item to match, so no photos are
   * returned (empty state). The binary content download stays lazy and
   * authenticated via the existing lightbox flow.
   */
  async loadEvidencePhotos(
    inspectionId: string,
    inspectionItemSnapshotId: string | null,
  ): Promise<LightboxPhoto[]> {
    if (!inspectionItemSnapshotId) return []
    const review = await inspectionReviewApi.get(inspectionId)
    const items = review.sections.flatMap((section) => section.items)
    const matchingItem = items.find((item) => item.snapshotId === inspectionItemSnapshotId)
    if (!matchingItem) return []
    return matchingItem.evidences.map((evidence) => evidencePhoto(evidence, matchingItem.title))
  },
}
