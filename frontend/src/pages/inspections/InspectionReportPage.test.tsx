/**
 * Tests for InspectionReportPage (Task 196 — integrar relatorio PDF de inspecao com a API).
 *
 * Strategy:
 * - Stub `fetch` globally so we control API responses without a real server.
 * - Each test restores stubs via `afterEach(cleanup) + vi.unstubAllGlobals()`.
 *
 * Covered scenarios:
 * 1. Loading state shown while the review API call is in-flight.
 * 2. Inspection data rendered from the API response (no mock data).
 * 3. Checklist sections and items rendered from API data.
 * 4. Non-conformities rendered from API data.
 * 5. Downloading the server PDF triggers fetch to the correct endpoint.
 * 6. Download error is displayed when the PDF API call fails.
 * 7. 404 response shows the "not found" empty state.
 * 8. Generic API error shows the retry card.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InspectionReportPage } from '@/pages/inspections/InspectionReportPage'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const review = {
  id: 42,
  title: 'Inspecao Preventiva Compressor',
  status: 'APPROVED',
  priority: 'HIGH',
  clientName: 'Industria Modelo',
  siteName: 'Unidade Sorocaba',
  equipmentName: 'Compressor XPTO 500',
  technicianName: 'Carlos Henrique',
  supervisorName: 'Marina Silva',
  dueDate: '2026-09-10',
  progress: 100,
  sections: [
    {
      title: 'Condicoes Gerais',
      order: 0,
      items: [
        {
          snapshotId: 1,
          code: null,
          title: 'Placa legivel?',
          description: null,
          responseType: 'CONFORMITY',
          required: true,
          answer: 'CONFORME',
          observation: 'Placa em bom estado.',
          answeredAt: '2026-09-10T09:00:00Z',
          answeredBy: 'Carlos Henrique',
          evidences: [],
          nonConformities: [],
        },
        {
          snapshotId: 2,
          code: null,
          title: 'Equipamento limpo?',
          description: null,
          responseType: 'CONFORMITY',
          required: true,
          answer: 'NON_CONFORMING',
          observation: 'Oleo na base.',
          answeredAt: '2026-09-10T09:05:00Z',
          answeredBy: 'Carlos Henrique',
          evidences: [],
          nonConformities: [],
        },
      ],
    },
    {
      title: 'Seguranca',
      order: 1,
      items: [
        {
          snapshotId: 3,
          code: null,
          title: 'Botao de emergencia funcionando?',
          description: null,
          responseType: 'CONFORMITY',
          required: true,
          answer: null,
          observation: null,
          answeredAt: null,
          answeredBy: null,
          evidences: [],
          nonConformities: [],
        },
      ],
    },
  ],
  nonConformities: [
    {
      id: 10,
      snapshotId: 2,
      title: 'Acumulo de oleo',
      description: 'Residuo de oleo detectado na base.',
      severity: 'LOW',
      status: 'Aberta',
      createdAt: '2026-09-10T09:05:00Z',
    },
  ],
}

function reviewResponse(status = 200) {
  return new Response(JSON.stringify(review), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Mock da API `fetch` com a assinatura real do browser. Tipar o mock com
// `(input, init?)` garante que `mock.calls` seja a tupla `[input, init?]`,
// permitindo desestruturar a URL (indice 0) e ler o `init` (indice 1) sem
// erros de tupla do TypeScript (TS2493/TS2339).
type FetchMock = ReturnType<typeof vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>>

function renderPage(fetchMock: FetchMock) {
  vi.stubGlobal('fetch', fetchMock)
  return render(
    <MemoryRouter initialEntries={['/app/inspections/42/report']}>
      <Routes>
        <Route path="/app/inspections/:id/report" element={<InspectionReportPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('InspectionReportPage — carregamento', () => {
  it('exibe indicador de carregamento enquanto a requisicao esta em andamento', () => {
    // fetch nunca resolve, portanto a pagina permanece no estado de loading
    renderPage(vi.fn(() => new Promise(() => {})))
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/carregando relatorio/i)).toBeInTheDocument()
  })

  it('exibe empty state para 404', async () => {
    const notFound = { status: 404, code: 'NOT_FOUND', message: 'Inspecao nao encontrada' }
    renderPage(
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(notFound), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )
    await screen.findByText(/inspecao nao encontrada/i)
  })

  it('exibe cartao de erro com botao de retry para falha generica', async () => {
    const error = { status: 500, code: 'INTERNAL', message: 'Erro interno do servidor' }
    renderPage(
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify(error), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        ),
      ),
    )
    await screen.findByText(/erro interno do servidor/i)
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })
})

describe('InspectionReportPage — dados da API (sem mocks)', () => {
  it('renderiza o titulo e metadados da inspecao vindos da API', async () => {
    renderPage(vi.fn(() => Promise.resolve(reviewResponse())))

    await screen.findByText('Inspecao Preventiva Compressor')
    expect(screen.getByText('Carlos Henrique')).toBeInTheDocument()
    expect(screen.getByText('Industria Modelo')).toBeInTheDocument()
    expect(screen.getByText('Unidade Sorocaba')).toBeInTheDocument()
    expect(screen.getByText('Compressor XPTO 500')).toBeInTheDocument()
  })

  it('renderiza as secoes e itens do checklist vindos da API', async () => {
    renderPage(vi.fn(() => Promise.resolve(reviewResponse())))

    await screen.findByText('Condicoes Gerais')
    expect(screen.getByText('Seguranca')).toBeInTheDocument()
    expect(screen.getByText('Placa legivel?')).toBeInTheDocument()
    expect(screen.getByText('Equipamento limpo?')).toBeInTheDocument()
    expect(screen.getByText('Botao de emergencia funcionando?')).toBeInTheDocument()
  })

  it('exibe o resultado correto para cada item (CONFORME, NAO CONFORME, Pendente)', async () => {
    renderPage(vi.fn(() => Promise.resolve(reviewResponse())))

    await screen.findByText('Condicoes Gerais')
    // item respondido como conforme
    expect(screen.getByText('CONFORME')).toBeInTheDocument()
    // item respondido como nao conforme
    expect(screen.getByText('NAO CONFORME')).toBeInTheDocument()
    // item sem resposta
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('renderiza a secao de nao conformidades com dados da API', async () => {
    renderPage(vi.fn(() => Promise.resolve(reviewResponse())))

    await screen.findByText(/nao conformidades/i)
    expect(screen.getByText('Acumulo de oleo')).toBeInTheDocument()
    expect(screen.getByText('Residuo de oleo detectado na base.')).toBeInTheDocument()
  })

  it('calcula as estatisticas de conformidade corretamente com base nos dados da API', async () => {
    renderPage(vi.fn(() => Promise.resolve(reviewResponse())))

    // 2 itens respondidos (dos 3 totais), 1 conforme, 1 nao conforme
    // conformidade = 1/2 = 50%
    await screen.findByText('Condicoes Gerais')
    // "2" = total respondidos
    expect(screen.getByText('2')).toBeInTheDocument()
    // "1" aparece duas vezes: conformes=1 e nao-conformes=1; usamos getAllByText
    expect(screen.getAllByText('1')).toHaveLength(2)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})

describe('InspectionReportPage — download do PDF via API', () => {
  beforeEach(() => {
    // jsdom nao suporta URL.createObjectURL; precisamos fazer stub
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('faz GET no endpoint correto ao clicar em Baixar PDF', async () => {
    const fetchMock: FetchMock = vi.fn((input) => {
      if (String(input).endsWith('/review')) return Promise.resolve(reviewResponse())
      if (String(input).endsWith('/report.pdf')) {
        return Promise.resolve(new Response(null, { status: 200 }))
      }
      return Promise.reject(new Error('unexpected url'))
    })

    renderPage(fetchMock)
    await screen.findByText('Inspecao Preventiva Compressor')

    await userEvent.click(screen.getByRole('button', { name: /baixar pdf/i }))

    await waitFor(() => {
      const pdfCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith('/report.pdf'),
      )
      expect(pdfCalls).toHaveLength(1)
      // Verifica que a URL contem o ID da inspecao
      expect(String(pdfCalls[0][0])).toMatch(/\/42\/report\.pdf$/)
    })
  })

  it('envia o header Authorization no download do PDF', async () => {
    // Simula token no localStorage
    window.localStorage.setItem('fieldops:access-token', 'test-jwt-token')

    const fetchMock: FetchMock = vi.fn((input) => {
      if (String(input).endsWith('/review')) return Promise.resolve(reviewResponse())
      if (String(input).endsWith('/report.pdf')) {
        return Promise.resolve(new Response(null, { status: 200 }))
      }
      return Promise.reject(new Error('unexpected url'))
    })

    renderPage(fetchMock)
    await screen.findByText('Inspecao Preventiva Compressor')

    await userEvent.click(screen.getByRole('button', { name: /baixar pdf/i }))

    await waitFor(() => {
      const pdfCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/report.pdf'))
      expect(pdfCall).toBeDefined()
      const headers = pdfCall![1]?.headers as Headers | undefined
      const authHeader =
        headers instanceof Headers
          ? headers.get('Authorization')
          : (headers as Record<string, string> | undefined)?.['Authorization']
      expect(authHeader).toBe('Bearer test-jwt-token')
    })

    window.localStorage.removeItem('fieldops:access-token')
  })

  it('desabilita o botao durante o download e o reabilita apos concluir', async () => {
    let resolvePdf!: (r: Response) => void
    const fetchMock: FetchMock = vi.fn((input) => {
      if (String(input).endsWith('/review')) return Promise.resolve(reviewResponse())
      // Deferred promise that we resolve manually to control timing
      return new Promise<Response>((resolve) => { resolvePdf = resolve })
    })

    renderPage(fetchMock)
    await screen.findByText('Inspecao Preventiva Compressor')

    await userEvent.click(screen.getByRole('button', { name: /baixar pdf/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /gerando pdf/i })).toBeDisabled(),
    )

    // Resolve with a plain OK response (blob() will return an empty Blob in jsdom)
    resolvePdf(new Response(null, { status: 200 }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /baixar pdf/i })).toBeEnabled(),
    )
  })

  it('exibe mensagem de erro quando o download do PDF falha', async () => {
    const fetchMock: FetchMock = vi.fn((input) => {
      if (String(input).endsWith('/review')) return Promise.resolve(reviewResponse())
      const err = { status: 500, code: 'REPORT_ERROR', message: 'Falha ao gerar o relatorio' }
      return Promise.resolve(
        new Response(JSON.stringify(err), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })

    renderPage(fetchMock)
    await screen.findByText('Inspecao Preventiva Compressor')

    await userEvent.click(screen.getByRole('button', { name: /baixar pdf/i }))

    await screen.findByText('Falha ao gerar o relatorio')
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

describe('InspectionReportPage — nao usa mais dados mock', () => {
  it('nao importa de @/mocks/domain nem de @/state/mockStores', async () => {
    // Se a pagina renderizar dados do fixture de mock (ids 'ins-compressor' etc.),
    // este teste falharia porque os dados sao diferentes dos enviados pela API.
    const fetchMock: FetchMock = vi.fn(() => Promise.resolve(reviewResponse()))
    renderPage(fetchMock)

    await screen.findByText('Inspecao Preventiva Compressor')

    // Dado que vem apenas do fixture de API acima — se viesse de mock seria outro titulo
    expect(screen.queryByText('Inspecao Preventiva - Compressor XPTO 500')).not.toBeInTheDocument()
  })

  it('chama a API de review com o ID correto da rota', async () => {
    const fetchMock: FetchMock = vi.fn(() => Promise.resolve(reviewResponse()))
    renderPage(fetchMock)

    await screen.findByText('Inspecao Preventiva Compressor')

    const reviewCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/api/v1/inspections/42/review'),
    )
    expect(reviewCalls).toHaveLength(1)
  })
})
