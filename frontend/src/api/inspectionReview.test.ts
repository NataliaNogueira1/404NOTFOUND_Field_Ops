import { afterEach, describe, expect, it, vi } from 'vitest'
import { inspectionReviewApi } from '@/api/inspectionReview'

const CONTENT_PATH = '/api/v1/inspection-evidences/5/content'
const PRESIGNED_URL = 'https://fieldops-evidencias.s3.us-east-1.amazonaws.com/abc.png?X-Amz-Expires=300&X-Amz-Signature=sig'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('inspectionReviewApi.loadEvidenceImage', () => {
  it('returns the presigned URL as is and downloads nothing through the API', async () => {
    const fetchMock = vi.fn((input: string) => {
      void input
      return Promise.resolve(json({ url: PRESIGNED_URL, expiresAt: '2026-11-15T10:05:00Z', presigned: true }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const src = await inspectionReviewApi.loadEvidenceImage(CONTENT_PATH)

    expect(src).toBe(PRESIGNED_URL)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/inspection-evidences/5/download-url')
  })

  it('downloads the image through the authenticated content endpoint when the URL is not presigned', async () => {
    const fetchMock = vi.fn((input: string) =>
      Promise.resolve(input.includes('/download-url')
        ? json({ url: CONTENT_PATH, expiresAt: null, presigned: false })
        : new Response('real-image', { headers: { 'Content-Type': 'image/png' } })))
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:evidence')

    const src = await inspectionReviewApi.loadEvidenceImage(CONTENT_PATH)

    expect(src).toBe('blob:evidence')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][0]).toContain(CONTENT_PATH)
  })

  it('rejects when the API cannot provide the download location', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve(json({ status: 404, code: 'NOT_FOUND', message: 'Evidência não encontrada' }, 404))))

    await expect(inspectionReviewApi.loadEvidenceImage(CONTENT_PATH)).rejects.toMatchObject({ status: 404 })
  })
})
