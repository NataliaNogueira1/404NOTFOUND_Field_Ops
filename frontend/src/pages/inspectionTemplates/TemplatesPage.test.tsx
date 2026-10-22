import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TemplatesPage } from '@/pages/inspectionTemplates/TemplatesPage'

const template = {
  id: 10,
  title: 'Checklist de Compressor',
  category: 'Manutencao',
  version: 2,
  sectionCount: 3,
  itemCount: 12,
  status: 'ACTIVE',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function templatePage() {
  return {
    content: [template],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 10,
    first: true,
    last: true,
  }
}

afterEach(cleanup)

describe('TemplatesPage', () => {
  it('loads a server page and reflects debounced filters and sorting in the URL', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            content: [template],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 10,
            first: true,
            last: true,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter>
        <TemplatesPage />
        <LocationProbe />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Checklist de Compressor')).not.toBeNull()
    expect(screen.getByText('Mostrando 1-1 de 1')).not.toBeNull()
    await userEvent.type(screen.getByLabelText('Buscar'), 'Compressor')
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'ACTIVE')

    expect(screen.getByTestId('template-location')).toHaveTextContent('name=Compressor')
    expect(screen.getByTestId('template-location')).toHaveTextContent('status=ACTIVE')
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.stringMatching(/inspection-templates\?.*name=Compressor.*status=ACTIVE/),
        expect.anything(),
      ),
    )

    await userEvent.click(screen.getByRole('button', { name: 'Título' }))
    expect(screen.getByTestId('template-location')).toHaveTextContent('sort=title%2Cdesc')
  })
})

describe('TemplatesPage - versions modal (PBI-246)', () => {
  /**
   * Routes fetch per URL: the template listing always resolves, while the
   * versions endpoint is driven by `versionsResponder` so each test controls
   * the ready/empty/error outcome.
   */
  function stubFetch(versionsResponder: () => Promise<Response>) {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/versions')) return versionsResponder()
      return Promise.resolve(jsonResponse(templatePage()))
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  async function openVersions() {
    render(
      <MemoryRouter>
        <TemplatesPage />
      </MemoryRouter>,
    )
    const trigger = await screen.findByRole('button', { name: /ver versões do modelo/i })
    await userEvent.click(trigger)
    return screen.getByRole('dialog')
  }

  it('opens a dialog listing the published versions when Versões is clicked', async () => {
    stubFetch(() =>
      Promise.resolve(
        jsonResponse([
          {
            id: 99,
            versionNumber: 2,
            titleSnapshot: 'Checklist de Compressor',
            descriptionSnapshot: 'Revisao anual',
            publishedAt: '2026-02-10T13:45:00Z',
            publishedBy: 7,
          },
        ]),
      ),
    )

    const dialog = await openVersions()

    expect(await within(dialog).findByText(/versão v2/i)).toBeInTheDocument()
    expect(within(dialog).getByText('Revisao anual')).toBeInTheDocument()
    expect(within(dialog).getByText('7')).toBeInTheDocument()
  })

  it('shows an empty state when the template has no published versions', async () => {
    stubFetch(() => Promise.resolve(jsonResponse([])))

    const dialog = await openVersions()

    expect(await within(dialog).findByText(/ainda não possui versões publicadas/i)).toBeInTheDocument()
  })

  it('shows an error state with retry and recovers on success', async () => {
    const fetchMock = stubFetch
    let call = 0
    const fetch = fetchMock(() => {
      call += 1
      if (call === 1) return Promise.resolve(jsonResponse({ message: 'boom' }, 500))
      return Promise.resolve(
        jsonResponse([
          {
            id: 1,
            versionNumber: 1,
            titleSnapshot: 'Checklist de Compressor',
            descriptionSnapshot: null,
            publishedAt: '2026-01-01T10:00:00Z',
            publishedBy: 3,
          },
        ]),
      )
    })

    const dialog = await openVersions()

    const retry = await within(dialog).findByRole('button', { name: /tentar novamente/i })
    await userEvent.click(retry)

    expect(await within(dialog).findByText(/versão v1/i)).toBeInTheDocument()
    // One listing call + two versions calls (initial failure + retry).
    expect(fetch.mock.calls.filter(([url]) => String(url).includes('/versions'))).toHaveLength(2)
  })
})

function LocationProbe() {
  return <span data-testid="template-location">{useLocation().search}</span>
}
