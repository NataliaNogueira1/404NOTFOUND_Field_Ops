import { afterEach, describe, expect, it, vi } from 'vitest'
import { nonConformitiesApi } from '@/api/nonConformities'
import { inspectionReviewApi, type InspectionReview } from '@/api/inspectionReview'
import { InspectionStatus, Priority } from '@/types/domain'

function reviewWithEvidences(): InspectionReview {
  return {
    id: '10',
    title: 'Inspecao de bomba',
    status: InspectionStatus.UNDER_REVIEW,
    priority: Priority.HIGH,
    clientName: 'ACME',
    siteName: 'Planta 1',
    equipmentName: 'Bomba 7',
    technicianName: 'Ana',
    dueDate: '2026-01-01',
    progress: 100,
    startLocation: null,
    endLocation: null,
    cancellation: null,
    nonConformities: [],
    sections: [
      {
        title: 'Seguranca',
        order: 1,
        items: [
          {
            snapshotId: '501',
            code: null,
            title: 'Vazamento no selo',
            description: null,
            responseType: 'CONFORMITY',
            required: true,
            answer: 'NON_CONFORMING',
            observation: null,
            answeredAt: null,
            answeredBy: null,
            evidences: [
              {
                id: '900',
                reference: 'ref-900',
                contentUrl: '/api/v1/inspection-evidences/900/content',
                description: 'Foto do selo',
                location: '-23,-46',
                capturedAt: '2026-01-01T10:00:00Z',
                uploadedBy: 'Ana',
                itemSnapshotId: '501',
              },
            ],
            nonConformities: [],
          },
          {
            snapshotId: '502',
            code: null,
            title: 'Outro item',
            description: null,
            responseType: 'CONFORMITY',
            required: true,
            answer: 'CONFORMING',
            observation: null,
            answeredAt: null,
            answeredBy: null,
            evidences: [],
            nonConformities: [],
          },
        ],
      },
    ],
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('nonConformitiesApi.loadEvidencePhotos', () => {
  it('maps the evidences of the matching item snapshot into lightbox photos', async () => {
    vi.spyOn(inspectionReviewApi, 'get').mockResolvedValue(reviewWithEvidences())

    const photos = await nonConformitiesApi.loadEvidencePhotos('10', '501')

    expect(photos).toHaveLength(1)
    expect(photos[0]).toMatchObject({
      src: '',
      contentUrl: '/api/v1/inspection-evidences/900/content',
      item: 'Vazamento no selo',
      capturedAt: '2026-01-01T10:00:00Z',
      location: '-23,-46',
      description: 'Foto do selo',
    })
  })

  it('returns an empty array when the item snapshot has no evidences', async () => {
    vi.spyOn(inspectionReviewApi, 'get').mockResolvedValue(reviewWithEvidences())

    const photos = await nonConformitiesApi.loadEvidencePhotos('10', '502')

    expect(photos).toEqual([])
  })

  it('returns an empty array without fetching when the NC has no item snapshot', async () => {
    const get = vi.spyOn(inspectionReviewApi, 'get')

    const photos = await nonConformitiesApi.loadEvidencePhotos('10', null)

    expect(photos).toEqual([])
    expect(get).not.toHaveBeenCalled()
  })
})
