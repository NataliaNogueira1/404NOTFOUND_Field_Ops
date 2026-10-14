import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuditTimelineEntry } from '@/types/domain'
import { AuditAction } from '@/types/domain'

// --------------------------------------------------------------------------
// Mocks de módulos
// --------------------------------------------------------------------------

const mockGetInspectionTimeline = vi.fn()

vi.mock('@/api/audit', () => ({
  auditApi: {
    getInspectionTimeline: (...args: unknown[]) => mockGetInspectionTimeline(...args),
  },
}))

// Stub do ApiError para testes de erro (evita importar o módulo real)
class MockApiError extends Error {
  status: number
  code: string
  fieldErrors: never[]
  constructor(body: { status: number; code: string; message: string }) {
    super(body.message)
    this.name = 'ApiError'
    this.status = body.status
    this.code = body.code
    this.fieldErrors = []
  }
}

vi.mock('@/api/client', () => ({
  ApiError: MockApiError,
}))

// --------------------------------------------------------------------------
// Dados de exemplo
// --------------------------------------------------------------------------

const sampleEntries: AuditTimelineEntry[] = [
  {
    id: 1,
    actorId: 42,
    action: AuditAction.INSPECTION_CREATED,
    entityType: 'INSPECTION',
    entityId: 10,
    detail: null,
    occurredAt: '2026-08-10T09:15:00Z',
  },
  {
    id: 2,
    actorId: 55,
    action: AuditAction.INSPECTION_APPROVED,
    entityType: 'INSPECTION',
    entityId: 10,
    detail: 'Aprovado sem ressalvas',
    occurredAt: '2026-08-10T14:30:00Z',
  },
]

// --------------------------------------------------------------------------
// Setup / teardown
// --------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  cleanup()
})

afterEach(() => {
  cleanup()
})

// Importação lazy para garantir que os mocks já estejam registrados
async function renderTimeline(props: { inspectionId: string }) {
  const { AuditTimeline } = await import('./AuditTimeline')
  return render(<AuditTimeline inspectionId={props.inspectionId} />)
}

// --------------------------------------------------------------------------
// Testes
// --------------------------------------------------------------------------

describe('AuditTimeline', () => {
  it('exibe spinner enquanto carrega', async () => {
    // Nunca resolve para manter estado de loading
    mockGetInspectionTimeline.mockReturnValue(new Promise(() => {}))

    await renderTimeline({ inspectionId: '10' })

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/carregando timeline/i)).toBeInTheDocument()
  })

  it('renderiza os eventos após carregamento bem-sucedido', async () => {
    mockGetInspectionTimeline.mockResolvedValue(sampleEntries)

    await renderTimeline({ inspectionId: '10' })

    await waitFor(() => {
      expect(screen.getByText('Inspeção criada')).toBeInTheDocument()
      expect(screen.getByText('Inspeção aprovada')).toBeInTheDocument()
    })
  })

  it('exibe o detalhe quando presente', async () => {
    mockGetInspectionTimeline.mockResolvedValue(sampleEntries)

    await renderTimeline({ inspectionId: '10' })

    await waitFor(() => {
      expect(screen.getByText('Aprovado sem ressalvas')).toBeInTheDocument()
    })
  })

  it('exibe EmptyState quando lista está vazia', async () => {
    mockGetInspectionTimeline.mockResolvedValue([])

    await renderTimeline({ inspectionId: '10' })

    await waitFor(() => {
      expect(
        screen.getByText(/nenhum evento de auditoria encontrado/i),
      ).toBeInTheDocument()
    })
  })

  it('exibe mensagem de erro genérico e botão de retry', async () => {
    mockGetInspectionTimeline.mockRejectedValue(new Error('network error'))

    await renderTimeline({ inspectionId: '10' })

    await waitFor(() => {
      expect(
        screen.getByText(/não foi possível carregar a timeline/i),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
    })
  })

  it('exibe EmptyState de "não encontrado" para ApiError 404', async () => {
    mockGetInspectionTimeline.mockRejectedValue(
      new MockApiError({ status: 404, code: 'NOT_FOUND', message: 'Not found' }),
    )

    await renderTimeline({ inspectionId: '999' })

    await waitFor(() => {
      expect(screen.getByText(/inspeção não encontrada/i)).toBeInTheDocument()
    })
  })

  it('dispara nova chamada à API ao clicar em "Tentar novamente"', async () => {
    mockGetInspectionTimeline
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(sampleEntries)

    await renderTimeline({ inspectionId: '10' })

    const retryButton = await screen.findByRole('button', { name: /tentar novamente/i })
    await userEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Inspeção criada')).toBeInTheDocument()
    })

    expect(mockGetInspectionTimeline).toHaveBeenCalledTimes(2)
  })

  it('passa o inspectionId correto para a API', async () => {
    mockGetInspectionTimeline.mockResolvedValue([])

    await renderTimeline({ inspectionId: '42' })

    await waitFor(() => {
      expect(mockGetInspectionTimeline).toHaveBeenCalledWith('42')
    })
  })

  it('exibe a lista como ol com aria-label acessível', async () => {
    mockGetInspectionTimeline.mockResolvedValue(sampleEntries)

    await renderTimeline({ inspectionId: '10' })

    const list = await screen.findByRole('list', { name: /timeline de auditoria/i })
    expect(list).toBeInTheDocument()
  })
})
