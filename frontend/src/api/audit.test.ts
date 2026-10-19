import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { auditApi } from '@/api/audit'
import { ApiError } from '@/api/client'
import { AuditAction } from '@/types/domain'

// Evento de auditoria válido conforme retornado pelo backend
const mockBackendEntry = {
  id: 1,
  actorId: 42,
  action: 'INSPECTION_CREATED',
  entityType: 'INSPECTION',
  entityId: 10,
  detail: 'Inspecao criada pelo sistema',
  occurredAt: '2026-08-10T09:15:00Z',
}

describe('auditApi.getInspectionTimeline', () => {
  beforeEach(() => {
    // Garante token para o httpClient não rejeitar antes de fazer fetch
    window.localStorage.setItem('fieldops:access-token', 'test-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normaliza corretamente uma entrada do backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify([mockBackendEntry])),
      }),
    )

    const entries = await auditApi.getInspectionTimeline('10')

    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry.id).toBe(1)
    expect(entry.actorId).toBe(42)
    expect(entry.action).toBe(AuditAction.INSPECTION_CREATED)
    expect(entry.entityType).toBe('INSPECTION')
    expect(entry.entityId).toBe(10)
    expect(entry.detail).toBe('Inspecao criada pelo sistema')
    expect(entry.occurredAt).toBe('2026-08-10T09:15:00Z')
  })

  it('aceita actorId null (evento de sistema)', async () => {
    const systemEntry = { ...mockBackendEntry, actorId: null, detail: null }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify([systemEntry])),
      }),
    )

    const entries = await auditApi.getInspectionTimeline('10')

    expect(entries[0].actorId).toBeNull()
    expect(entries[0].detail).toBeNull()
  })

  it('normaliza múltiplas entradas na ordem recebida', async () => {
    const secondEntry = {
      ...mockBackendEntry,
      id: 2,
      action: 'INSPECTION_APPROVED',
      occurredAt: '2026-08-10T14:30:00Z',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify([mockBackendEntry, secondEntry])),
      }),
    )

    const entries = await auditApi.getInspectionTimeline('10')

    expect(entries).toHaveLength(2)
    expect(entries[0].action).toBe(AuditAction.INSPECTION_CREATED)
    expect(entries[1].action).toBe(AuditAction.INSPECTION_APPROVED)
  })

  it('retorna lista vazia quando o backend retorna []', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('[]'),
      }),
    )

    const entries = await auditApi.getInspectionTimeline('10')

    expect(entries).toHaveLength(0)
  })

  it('lança ApiError com status 404 para inspeção inexistente', async () => {
    const notFoundResponse = {
      ok: false,
      status: 404,
      text: () =>
        Promise.resolve(
          JSON.stringify({ status: 404, code: 'NOT_FOUND', message: 'Inspection not found' }),
        ),
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(notFoundResponse),
    )

    await expect(auditApi.getInspectionTimeline('999')).rejects.toBeInstanceOf(ApiError)
    await expect(auditApi.getInspectionTimeline('999')).rejects.toMatchObject({ status: 404 })
  })

  it('lança ApiError com code NETWORK_ERROR em caso de falha de rede', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')),
    )

    await expect(auditApi.getInspectionTimeline('10')).rejects.toBeInstanceOf(ApiError)
    await expect(auditApi.getInspectionTimeline('10')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })

  it('chama o endpoint correto com o ID da inspeção', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('[]'),
    })
    vi.stubGlobal('fetch', fetchMock)

    await auditApi.getInspectionTimeline('42')

    const calledUrl: string = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('/api/v1/inspections/42/history')
  })
})
