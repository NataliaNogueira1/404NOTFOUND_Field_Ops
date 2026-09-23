import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InspectionReviewPage } from '@/pages/inspections/InspectionReviewPage'
import { reviewAnswers } from '@/mocks/domain'

/**
 * Integration coverage for PBI-058: opening the lightbox from the review page.
 *
 * A unit test on Lightbox alone can pass even if the page wiring breaks, so this
 * test exercises the real thumbnail -> lightbox path with the page's mock data.
 */
function renderReviewPage() {
  return render(
    <MemoryRouter initialEntries={['/app/inspections/ins-compressor/review']}>
      <InspectionReviewPage />
    </MemoryRouter>,
  )
}

const firstWithEvidence = reviewAnswers.find(answer => Boolean(answer.evidence))!

afterEach(cleanup)

describe('InspectionReviewPage - photo lightbox integration', () => {
  it('renders photo thumbnails in the item cards', () => {
    renderReviewPage()

    expect(
      screen.getAllByRole('button', { name: new RegExp(`Abrir foto \\d+: ${firstWithEvidence.question}`) }).length,
    ).toBeGreaterThan(0)
  })

  it('opens the lightbox on the clicked photo and can be closed', async () => {
    renderReviewPage()

    const thumbnails = screen.getAllByRole('button', {
      name: new RegExp(`Abrir foto \\d+: ${firstWithEvidence.question}`),
    })
    await userEvent.click(thumbnails[0])

    const dialog = await screen.findByRole('dialog')
    // The opened photo shows its linked item (top bar + metadata bar).
    expect(within(dialog).getAllByText(firstWithEvidence.question).length).toBeGreaterThan(0)

    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar lightbox' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes the lightbox with the Escape key', async () => {
    renderReviewPage()

    const thumbnails = screen.getAllByRole('button', {
      name: new RegExp(`Abrir foto \\d+: ${firstWithEvidence.question}`),
    })
    await userEvent.click(thumbnails[0])

    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
