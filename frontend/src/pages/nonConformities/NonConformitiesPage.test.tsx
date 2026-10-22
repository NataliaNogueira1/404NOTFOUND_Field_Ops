import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NonConformitiesPage } from '@/pages/nonConformities/NonConformitiesPage'
import { nonConformitiesApi, NonConformityStatus, type NonConformityListItem } from '@/api/nonConformities'
import { inspectionReviewApi } from '@/api/inspectionReview'
import type { LightboxPhoto } from '@/components/feedback/Lightbox'
import { Severity } from '@/types/domain'

function nonConformity(overrides: Partial<NonConformityListItem> = {}): NonConformityListItem {
  return {
    id: '1',
    inspectionId: '10',
    clientName: 'ACME',
    inspectionItemSnapshotId: '501',
    title: 'Vazamento no selo',
    description: 'Selo com vazamento visivel',
    severity: Severity.HIGH,
    status: NonConformityStatus.OPEN,
    createdAt: '2026-01-01T10:00:00Z',
    closedAt: null,
    ...overrides,
  }
}

function photo(overrides: Partial<LightboxPhoto> = {}): LightboxPhoto {
  return {
    src: '',
    contentUrl: '/api/v1/inspection-evidences/900/content',
    item: 'Vazamento no selo',
    capturedAt: '2026-01-01T10:00:00Z',
    location: '-23,-46',
    description: 'Foto do selo',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <NonConformitiesPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.spyOn(nonConformitiesApi, 'list').mockResolvedValue({
    content: [nonConformity()],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function openDetail() {
  const user = userEvent.setup()
  renderPage()
  const detailsButton = await screen.findByRole('button', { name: /ver detalhes da nao conformidade/i })
  await user.click(detailsButton)
  return user
}

describe('NonConformitiesPage - evidence photos (PBI-255)', () => {
  it('shows the photo thumbnails linked to the non-conformity in the detail modal', async () => {
    vi.spyOn(nonConformitiesApi, 'loadEvidencePhotos').mockResolvedValue([photo()])

    await openDetail()

    const section = await screen.findByRole('region', { name: /evidencias fotograficas/i })
    expect(await within(section).findByRole('button', { name: /abrir foto 1/i })).toBeInTheDocument()
  })

  it('shows an empty state when the non-conformity has no photos', async () => {
    vi.spyOn(nonConformitiesApi, 'loadEvidencePhotos').mockResolvedValue([])

    await openDetail()

    expect(await screen.findByText(/sem fotos para esta nao conformidade/i)).toBeInTheDocument()
  })

  it('shows an error state with retry when loading photos fails', async () => {
    const loadPhotos = vi
      .spyOn(nonConformitiesApi, 'loadEvidencePhotos')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([photo()])
    const user = await openDetail()

    const retry = await screen.findByRole('button', { name: /tentar novamente/i })
    await user.click(retry)

    expect(await screen.findByRole('button', { name: /abrir foto 1/i })).toBeInTheDocument()
    expect(loadPhotos).toHaveBeenCalledTimes(2)
  })

  it('opens the lightbox with the authenticated image when a thumbnail is clicked', async () => {
    vi.spyOn(nonConformitiesApi, 'loadEvidencePhotos').mockResolvedValue([photo()])
    vi.spyOn(inspectionReviewApi, 'loadEvidenceImage').mockResolvedValue('blob:evidence-900')
    const user = await openDetail()

    const thumbnail = await screen.findByRole('button', { name: /abrir foto 1/i })
    await user.click(thumbnail)

    const lightbox = await screen.findByRole('dialog', { name: /visualizador de fotografias/i })
    await waitFor(() => {
      expect(within(lightbox).getByRole('img', { name: /vazamento no selo/i })).toHaveAttribute(
        'src',
        'blob:evidence-900',
      )
    })
    expect(inspectionReviewApi.loadEvidenceImage).toHaveBeenCalledWith(
      '/api/v1/inspection-evidences/900/content',
    )
  })
})
