import { apiRequestBlob, httpClient } from '@/api/client'
import type { InspectionStatus, Priority, Severity } from '@/types/domain'

export interface ReviewEvidence { id: string; reference: string; contentUrl: string; description: string | null; location: string | null; capturedAt: string; uploadedBy: string; itemSnapshotId: string }
export interface ReviewNonConformity { id: string; snapshotId: string | null; title: string; description: string; severity: Severity; status: string; createdAt: string }
export interface ReviewItem { snapshotId: string; code: string | null; title: string; description: string | null; responseType: string; required: boolean; answer: string | null; observation: string | null; answeredAt: string | null; answeredBy: string | null; evidences: ReviewEvidence[]; nonConformities: ReviewNonConformity[] }
export interface InspectionReview { id: string; title: string; status: InspectionStatus; priority: Priority; clientName: string; siteName: string; equipmentName: string | null; technicianName: string; dueDate: string; progress: number; sections: { title: string; order: number; items: ReviewItem[] }[]; nonConformities: ReviewNonConformity[] }
interface BackendReview extends Omit<InspectionReview, 'id' | 'sections' | 'nonConformities'> { id: number; sections: BackendSection[]; nonConformities: BackendNonConformity[] }
interface BackendSection { title: string; order: number; items: BackendItem[] }
interface BackendItem extends Omit<ReviewItem, 'snapshotId' | 'evidences' | 'nonConformities'> { snapshotId: number; evidences: BackendEvidence[]; nonConformities: BackendNonConformity[] }
interface BackendEvidence extends Omit<ReviewEvidence, 'id' | 'itemSnapshotId'> { id: number; itemSnapshotId: number }
interface BackendNonConformity extends Omit<ReviewNonConformity, 'id' | 'snapshotId'> { id: number; snapshotId: number | null }
interface Decision { id: number; status: InspectionStatus; reviewedAt: string; reviewedBy: number; comment: string | null; rejectionReason: string | null }
function nc(value: BackendNonConformity): ReviewNonConformity { return { ...value, id: String(value.id), snapshotId: value.snapshotId === null ? null : String(value.snapshotId) } }
function item(value: BackendItem): ReviewItem { return { ...value, snapshotId: String(value.snapshotId), evidences: value.evidences.map(evidence => ({ ...evidence, id: String(evidence.id), itemSnapshotId: String(evidence.itemSnapshotId) })), nonConformities: value.nonConformities.map(nc) } }
export const inspectionReviewApi = {
  async get(id: string): Promise<InspectionReview> { const value = await httpClient.get<BackendReview>(`/api/v1/inspections/${id}/review`); return { ...value, id: String(value.id), sections: value.sections.map(section => ({ ...section, items: section.items.map(item) })), nonConformities: value.nonConformities.map(nc) } },
  async loadEvidenceImage(contentUrl: string) { return URL.createObjectURL(await apiRequestBlob(contentUrl)) },
  approve: (id: string) => httpClient.post<Decision>(`/api/v1/inspections/${id}/approve`),
  reject: (id: string, reason: string) => httpClient.post<Decision>(`/api/v1/inspections/${id}/reject`, { reason: reason.trim() }),
}
