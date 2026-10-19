import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NewInspectionPage } from '@/pages/inspections/NewInspectionPage'

// --------------------------------------------------------------------------
// Helpers para montar respostas de fetch
// --------------------------------------------------------------------------

function pageOf(content: unknown[]) {
  return Promise.resolve(
    new Response(
      JSON.stringify({
        content,
        totalElements: content.length,
        totalPages: 1,
        number: 0,
        size: 100,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  )
}

function versionsResponse() {
  return Promise.resolve(
    new Response(
      JSON.stringify([
        {
          id: '11',
          versionNumber: 1,
          titleSnapshot: 'Preventiva',
          descriptionSnapshot: null,
          publishedAt: '2026-09-01T00:00:00Z',
          publishedBy: 1,
        },
      ]),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  )
}

/** Monta um fetchMock completo com os dados de cada endpoint */
function buildFetchMock(overrides: {
  clients?: unknown[]
  sites?: unknown[]
  equipment?: unknown[]
  users?: unknown[]
  templates?: unknown[]
  postInspection?: Record<string, unknown>
} = {}) {
  const clients = overrides.clients ?? [
    { id: 'cli-industria', name: 'Industria Modelo' },
    { id: 'cli-logistica', name: 'Logistica ABC' },
  ]
  const sites = overrides.sites ?? [
    { id: 'site-sorocaba', clientId: 'cli-industria', name: 'Unidade Sorocaba', status: 'ACTIVE' },
  ]
  const equipment = overrides.equipment ?? [
    { id: 'eq-api', siteId: 'site-sorocaba', name: 'Compressor API', status: 'ACTIVE' },
  ]
  const users = overrides.users ?? [
    { id: 3, name: 'Carlos Henrique', email: 'carlos@example.com', role: 'TECHNICIAN', status: 'ACTIVE' },
  ]
  const templates = overrides.templates ?? [
    { id: 'tpl-1', title: 'Preventiva', category: 'Geral', version: 1, sectionCount: 1, itemCount: 1, status: 'ACTIVE' },
  ]

  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.endsWith('/api/v1/inspections') && init?.method === 'POST') {
      const created = overrides.postInspection ?? {
        id: 99, title: 'Preventiva - Unidade Sorocaba', status: 'ASSIGNED',
        dueDate: '2026-09-30', clientName: 'Industria Modelo',
        equipmentName: null, technicianName: 'Carlos Henrique',
      }
      return Promise.resolve(
        new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } }),
      )
    }
    if (url.includes('/versions')) return versionsResponse()
    if (url.includes('/api/v1/equipment?')) return pageOf(equipment)
    if (url.includes('/api/v1/sites?')) return pageOf(sites)
    if (url.includes('/api/v1/clients?')) return pageOf(clients)
    if (url.includes('/api/v1/users?')) return pageOf(users)
    return pageOf(templates)
  })
}

// --------------------------------------------------------------------------
// Suite de testes
// --------------------------------------------------------------------------

describe('NewInspectionPage', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('inicia com cliente, local e equipamento desabilitados enquanto carrega', () => {
    // Nunca resolve para manter estado de loading
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    render(
      <MemoryRouter>
        <NewInspectionPage />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/^local$/i)).toHaveProperty('disabled', true)
    expect(screen.getByLabelText(/equipamento/i)).toHaveProperty('disabled', true)
  })

  it('não exibe clientes mockados no estado inicial (sem fallback)', async () => {
    // API retorna vazio
    vi.stubGlobal('fetch', vi.fn(() => pageOf([])))

    render(
      <MemoryRouter>
        <NewInspectionPage />
      </MemoryRouter>,
    )

    // Aguarda carregamento terminar
    await waitFor(() => {
      expect(screen.queryByText(/carregando clientes/i)).toBeNull()
    })

    // Não deve haver clientes hardcoded do mock
    expect(screen.queryByRole('option', { name: /metalurgica horizonte/i })).toBeNull()
    expect(screen.queryByRole('option', { name: /industria modelo/i })).toBeNull()
  })

  it('filtra locais por cliente e equipamentos por local via API', async () => {
    const fetchMock = buildFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter>
        <NewInspectionPage />
      </MemoryRouter>,
    )

    const siteSelect = screen.getByLabelText(/^local$/i)
    const equipmentSelect = screen.getByLabelText(/equipamento/i)

    expect(siteSelect).toHaveProperty('disabled', true)
    expect(equipmentSelect).toHaveProperty('disabled', true)
    // Sem clientes mockados
    expect(screen.queryByRole('option', { name: /metalurgica horizonte/i })).toBeNull()
    // API com status=ACTIVE deve ser chamada
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('status=ACTIVE'), expect.anything())

    await screen.findByRole('option', { name: /industria modelo/i })
    await userEvent.selectOptions(screen.getByLabelText(/cliente/i), 'cli-industria')
    expect(siteSelect).toHaveProperty('disabled', false)
    expect(await screen.findByRole('option', { name: /unidade sorocaba/i })).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/sites\?.*clientId=cli-industria.*status=ACTIVE/),
      expect.anything(),
    )

    await userEvent.selectOptions(siteSelect, 'site-sorocaba')
    expect(equipmentSelect).toHaveProperty('disabled', false)
    expect(await screen.findByRole('option', { name: /compressor api/i })).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/equipment\?.*siteId=site-sorocaba.*status=ACTIVE/),
      expect.anything(),
    )
  })

  it('exibe lista vazia de locais quando a API de locais falha (sem fallback mock)', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/v1/sites?')) return Promise.reject(new Error('offline'))
      if (url.includes('/api/v1/clients?')) return pageOf([{ id: 1, name: 'Industria Modelo' }])
      if (url.includes('/api/v1/users?')) return pageOf([
        { id: 3, name: 'Carlos Henrique', email: 'carlos@example.com', role: 'TECHNICIAN', status: 'ACTIVE' },
      ])
      if (url.includes('/versions')) return versionsResponse()
      return pageOf([{ id: 'tpl-1', title: 'Preventiva', category: 'Geral', version: 1, sectionCount: 1, itemCount: 1, status: 'ACTIVE' }])
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter>
        <NewInspectionPage />
      </MemoryRouter>,
    )

    await screen.findByRole('option', { name: /industria modelo/i })
    await userEvent.selectOptions(screen.getByLabelText(/cliente/i), '1')

    // Após falha da API de sites, não deve cair em dados mock de sites
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /unidade sorocaba/i })).toBeNull()
      expect(screen.queryByRole('option', { name: /cd campinas/i })).toBeNull()
    })
  })

  it('exibe lista vazia de equipamentos quando API falha (sem fallback mock)', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/v1/equipment?')) return Promise.reject(new Error('offline'))
      if (url.includes('/api/v1/sites?')) return pageOf([
        { id: 'site-sorocaba', clientId: 1, name: 'Unidade Sorocaba', status: 'ACTIVE' },
      ])
      if (url.includes('/api/v1/clients?')) return pageOf([{ id: 1, name: 'Industria Modelo' }])
      if (url.includes('/api/v1/users?')) return pageOf([
        { id: 3, name: 'Carlos Henrique', email: 'carlos@example.com', role: 'TECHNICIAN', status: 'ACTIVE' },
      ])
      if (url.includes('/versions')) return versionsResponse()
      return pageOf([{ id: 'tpl-1', title: 'Preventiva', category: 'Geral', version: 1, sectionCount: 1, itemCount: 1, status: 'ACTIVE' }])
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter>
        <NewInspectionPage />
      </MemoryRouter>,
    )

    await screen.findByRole('option', { name: /industria modelo/i })
    await userEvent.selectOptions(screen.getByLabelText(/cliente/i), '1')
    await screen.findByRole('option', { name: /unidade sorocaba/i })
    await userEvent.selectOptions(screen.getByLabelText(/^local$/i), 'site-sorocaba')

    // Após falha da API de equipamentos, não deve cair em dados mock
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /compressor xpto/i })).toBeNull()
      expect(screen.queryByRole('option', { name: /empilhadeira/i })).toBeNull()
    })
  })

  it('agenda inspeção sem equipamento e omite equipmentId do payload', async () => {
    let postBody: Record<string, unknown> | undefined
    const fetchMock = buildFetchMock({
      equipment: [],
      sites: [{ id: 2, clientId: 1, name: 'Unidade Sorocaba', status: 'ACTIVE' }],
      clients: [{ id: 1, name: 'Industria Modelo' }],
      users: [{ id: 3, name: 'Carlos Henrique', email: 'carlos@example.com', role: 'TECHNICIAN', status: 'ACTIVE' }],
    })

    const wrappedMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/v1/inspections') && init?.method === 'POST') {
        postBody = JSON.parse(String(init.body)) as Record<string, unknown>
      }
      return fetchMock(input, init)
    })
    vi.stubGlobal('fetch', wrappedMock)

    render(
      <MemoryRouter>
        <NewInspectionPage />
      </MemoryRouter>,
    )

    await screen.findByRole('option', { name: /industria modelo/i })
    await userEvent.selectOptions(screen.getByLabelText(/cliente/i), '1')
    await screen.findByRole('option', { name: /unidade sorocaba/i })
    await userEvent.selectOptions(screen.getByLabelText(/^local$/i), '2')
    expect(await screen.findByRole('option', { name: /nenhum resultado/i })).not.toBeNull()
    await screen.findByRole('option', { name: /carlos henrique/i })
    await userEvent.selectOptions(screen.getByLabelText(/técnico/i), '3')
    await userEvent.type(screen.getByLabelText(/data prevista/i), '2026-09-30')
    await userEvent.click(screen.getByRole('button', { name: /agendar inspeção/i }))

    await waitFor(() =>
      expect(postBody).toMatchObject({
        title: 'Preventiva — Unidade Sorocaba',
        templateVersionId: 11,
        clientId: 1,
        siteId: 2,
        technicianId: 3,
      }),
    )
    expect(postBody).not.toHaveProperty('equipmentId')
  })

  it('exibe erro de validação ao tentar agendar sem preencher campos obrigatórios', async () => {
    vi.stubGlobal('fetch', vi.fn(() => pageOf([])))

    render(
      <MemoryRouter>
        <NewInspectionPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText(/carregando/i)).toBeNull()
    })

    await userEvent.click(screen.getByRole('button', { name: /agendar inspeção/i }))

    expect(screen.getByText(/preencha modelo, versão, cliente/i)).toBeInTheDocument()
  })
})
