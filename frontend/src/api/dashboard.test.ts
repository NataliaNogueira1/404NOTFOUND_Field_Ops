import { afterEach, describe, expect, it, vi } from 'vitest'
import { dashboardApi } from '@/api/dashboard'
import { InspectionStatus, Priority } from '@/types/domain'

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }),
  )
}

type FetchMock = (input: string) => Promise<Response>

const sampleBody = {
  byStatus: { ASSIGNED: 2, APPROVED: 5 },
  byCriticality: { HIGH: 1 },
  openNonConformities: 3,
  overdue: 4,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dashboardApi.getSummary', () => {
  it('requests GET /api/v1/dashboard/summary without a query string when no filters are given', async () => {
    const fetchMock = vi.fn<FetchMock>(() => jsonResponse(sampleBody))
    vi.stubGlobal('fetch', fetchMock)

    await dashboardApi.getSummary()

    const url = fetchMock.mock.calls[0]?.[0]
    expect(url).toContain('/api/v1/dashboard/summary')
    expect(url).not.toContain('?')
  })

  it("sends from, to, the 'client' param and technicianId when filters are provided", async () => {
    const fetchMock = vi.fn<FetchMock>(() => jsonResponse(sampleBody))
    vi.stubGlobal('fetch', fetchMock)

    await dashboardApi.getSummary({ from: '2024-01-01', to: '2024-01-31', client: 'Cliente A', technicianId: 9 })

    const url = new URL(fetchMock.mock.calls[0]?.[0] ?? '', 'http://localhost')
    expect(url.pathname).toBe('/api/v1/dashboard/summary')
    expect(url.searchParams.get('from')).toBe('2024-01-01')
    expect(url.searchParams.get('to')).toBe('2024-01-31')
    expect(url.searchParams.get('client')).toBe('Cliente A')
    expect(url.searchParams.get('technicianId')).toBe('9')
    // The verified backend contract names the param 'client' — not clientName/clientId.
    expect(url.searchParams.has('clientName')).toBe(false)
    expect(url.searchParams.has('clientId')).toBe(false)
  })

  it('normalizes byStatus (8 keys) and byCriticality (4 keys), filling missing keys with 0', async () => {
    const fetchMock = vi.fn<FetchMock>(() => jsonResponse(sampleBody))
    vi.stubGlobal('fetch', fetchMock)

    const summary = await dashboardApi.getSummary()

    for (const status of Object.values(InspectionStatus)) {
      expect(summary.byStatus[status]).toBeTypeOf('number')
    }
    for (const priority of Object.values(Priority)) {
      expect(summary.byCriticality[priority]).toBeTypeOf('number')
    }
    expect(Object.keys(summary.byStatus)).toHaveLength(8)
    expect(Object.keys(summary.byCriticality)).toHaveLength(4)
    expect(summary.byStatus[InspectionStatus.ASSIGNED]).toBe(2)
    expect(summary.byStatus[InspectionStatus.APPROVED]).toBe(5)
    expect(summary.byStatus[InspectionStatus.DRAFT]).toBe(0)
    expect(summary.byCriticality[Priority.HIGH]).toBe(1)
    expect(summary.byCriticality[Priority.LOW]).toBe(0)
    expect(summary.openNonConformities).toBe(3)
    expect(summary.overdue).toBe(4)
  })
})
