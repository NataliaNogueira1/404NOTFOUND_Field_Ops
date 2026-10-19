import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminCatalogApi } from '@/api/adminCatalog'
import { tokenStorage } from '@/api/client'
import { InspectionStatus } from '@/types/domain'

type FetchMock = (input: string, init?: RequestInit) => Promise<Response>

describe('adminCatalogApi.exportCsv', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    tokenStorage.clear()
  })

  function csvResponse(status = 200) {
    return new Response('id,title\n1,Inspecao', {
      status,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="inspections.csv"',
      },
    })
  }

  function stubDownloadEnvironment() {
    const createObjectURL = vi.fn(() => 'blob:mock')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    return { createObjectURL, revokeObjectURL, click }
  }

  it('requests the export endpoint with the API prefix and only the present filters', async () => {
    tokenStorage.set('tkn')
    stubDownloadEnvironment()
    const fetchMock = vi.fn<FetchMock>(() => Promise.resolve(csvResponse()))
    vi.stubGlobal('fetch', fetchMock)

    await adminCatalogApi.exportCsv({
      status: InspectionStatus.ASSIGNED,
      from: '2026-01-10',
      to: '2026-01-10',
      clientId: 7,
    })

    const calledUrl = String(fetchMock.mock.calls[0]?.[0])
    const apiUrl = import.meta.env.VITE_API_URL ?? ''
    expect(calledUrl.startsWith(`${apiUrl}/api/v1/inspections/export.csv`)).toBe(true)
    expect(calledUrl).toContain('status=ASSIGNED')
    expect(calledUrl).toContain('from=2026-01-10')
    expect(calledUrl).toContain('to=2026-01-10')
    expect(calledUrl).toContain('clientId=7')
  })

  it('omits empty filters from the query string', async () => {
    tokenStorage.set('tkn')
    stubDownloadEnvironment()
    const fetchMock = vi.fn<FetchMock>(() => Promise.resolve(csvResponse()))
    vi.stubGlobal('fetch', fetchMock)

    await adminCatalogApi.exportCsv({ status: '', from: '', to: '' })

    const calledUrl = String(fetchMock.mock.calls[0]?.[0])
    expect(calledUrl).not.toContain('status=')
    expect(calledUrl).not.toContain('from=')
    expect(calledUrl).not.toContain('to=')
    expect(calledUrl).not.toContain('clientId=')
  })

  it('sends the Authorization and Accept headers', async () => {
    tokenStorage.set('tkn')
    stubDownloadEnvironment()
    const fetchMock = vi.fn<FetchMock>(() => Promise.resolve(csvResponse()))
    vi.stubGlobal('fetch', fetchMock)

    await adminCatalogApi.exportCsv({ status: '', from: '', to: '' })

    const init = fetchMock.mock.calls[0]?.[1]
    const headers = (init?.headers ?? {}) as Record<string, string>
    expect(headers.Authorization).toBe('Bearer tkn')
    expect(headers.Accept).toBe('text/csv')
  })

  it('rejects with a Portuguese error message when the response is not ok', async () => {
    tokenStorage.set('tkn')
    stubDownloadEnvironment()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(csvResponse(500))),
    )

    await expect(adminCatalogApi.exportCsv({ status: '', from: '', to: '' })).rejects.toThrow(
      'Nao foi possivel exportar o CSV das inspecoes.',
    )
  })
})
