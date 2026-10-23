import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientDetailsPage } from '@/pages/catalog/ClientsPage'

const CLIENT_ID = '3e2fd0ad-93f1-4c51-a8ea-2f45f08e0f10'

const client = {
  id: CLIENT_ID,
  name: 'Industria Atlas',
  legalName: 'Atlas Industrial SA',
  document: '12.345.678/0001-90',
  email: 'contato@atlas.com',
  phone: '(11) 99999-0000',
  status: 'ACTIVE',
  activeSitesCount: 2,
  version: 0,
}

const site = {
  id: '53bb819a-4203-4c5a-aad8-057f421f59b1',
  clientId: CLIENT_ID,
  clientName: 'Industria Atlas',
  name: 'Unidade Centro',
  description: 'Sede principal',
  address: 'Av. Paulista, 1000',
  city: 'Sao Paulo',
  state: 'SP',
  zipCode: '01310-100',
  latitude: null,
  longitude: null,
  contactName: 'Ana Lima',
  contactPhone: '(11) 99999-0000',
  status: 'ACTIVE',
  equipmentCount: 3,
  version: 0,
}

function json(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function defaultFetch(input: RequestInfo | URL) {
  const url = String(input)
  if (url.includes(`/api/v1/clients/${CLIENT_ID}/sites`)) return json([site])
  if (url.includes(`/api/v1/clients/${CLIENT_ID}`)) return json(client)
  return json({}, 404)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/app/clients/${CLIENT_ID}`]}>
      <Routes>
        <Route path="/app/clients/:clientId" element={<ClientDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => window.localStorage.setItem('fieldops:access-token', 'supervisor-token'))
afterEach(cleanup)

describe('ClientDetailsPage', () => {
  it('exibe estado de carregamento e depois os dados do cliente via API real', async () => {
    const fetchMock = vi.fn(defaultFetch)
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    // exibe spinner enquanto carrega
    expect(screen.getByRole('status')).not.toBeNull()

    // após carregar, exibe todos os campos do cliente
    expect(await screen.findByRole('heading', { name: 'Industria Atlas' })).not.toBeNull()
    expect(screen.getByText('Atlas Industrial SA')).not.toBeNull()
    expect(screen.getByText('12.345.678/0001-90')).not.toBeNull()
    expect(screen.getByText('contato@atlas.com')).not.toBeNull()
    expect(screen.getByText('(11) 99999-0000')).not.toBeNull()
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0)

    // confirmando que chamou a API real
    const clientCalls = fetchMock.mock.calls
      .map((c) => String(c[0]))
      .filter((u) => u.includes(`/clients/${CLIENT_ID}`) && !u.includes('sites'))
    expect(clientCalls.length).toBeGreaterThan(0)
  })

  it('não usa dados de @/mocks/domain — exibe a lista de locais da API', async () => {
    vi.stubGlobal('fetch', vi.fn(defaultFetch))
    renderPage()

    // aguarda a página carregar
    await screen.findByRole('heading', { name: 'Industria Atlas' })

    // exibe o local retornado pela API
    expect(await screen.findByText('Unidade Centro')).not.toBeNull()
    expect(screen.getByText('Sao Paulo / SP')).not.toBeNull()
    expect(screen.getByText('Ana Lima')).not.toBeNull()
    // equipmentCount vindo da API
    expect(screen.getByText('3')).not.toBeNull()

    // NÃO exibe dados de seed (mocks) que não existem na API
    expect(screen.queryByText('Industria Modelo')).toBeNull()
    expect(screen.queryByText('Logistica ABC')).toBeNull()
  })

  it('exibe estado de erro com retry quando a API falha', async () => {
    let callCount = 0
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes(`/api/v1/clients/${CLIENT_ID}`) && !url.includes('sites')) {
        callCount++
        if (callCount === 1) return json({ message: 'Internal Server Error' }, 500)
        return json(client)
      }
      return json([])
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    // aguarda mensagem de erro
    expect(await screen.findByRole('alert')).not.toBeNull()
    expect(screen.getByText(/Não foi possível/i)).not.toBeNull()
    expect(screen.getByRole('button', { name: /Tentar novamente/i })).not.toBeNull()

    // clica em retry
    await userEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }))

    // agora carrega com sucesso
    expect(await screen.findByRole('heading', { name: 'Industria Atlas' })).not.toBeNull()
  })

  it('exibe mensagem de não encontrado quando a API retorna 404', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ message: 'Not Found' }, 404)))
    renderPage()

    expect(await screen.findByText(/não encontrado/i)).not.toBeNull()
    // link de voltar para a lista
    expect(screen.getByRole('link', { name: /Clientes/i })).not.toBeNull()
  })

  it('edita os dados do cliente via API real e recarrega', async () => {
    let putBody: Record<string, unknown> | undefined
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith(`/api/v1/clients/${CLIENT_ID}`) && init?.method === 'PUT') {
        putBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return json({ ...client, name: 'Atlas Atualizado' })
      }
      return defaultFetch(input)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    await screen.findByRole('heading', { name: 'Industria Atlas' })

    // abre o modal de edição
    await userEvent.click(screen.getByRole('button', { name: 'Editar cliente' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toBeNull()

    // campos pré-preenchidos com dados da API
    expect((dialog.querySelector('#client-name') as HTMLInputElement).value).toBe('Industria Atlas')
    expect((dialog.querySelector('#client-legal-name') as HTMLInputElement).value).toBe('Atlas Industrial SA')

    // salva sem alterar nada (confirma que chama PUT)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(putBody).toBeDefined())
    expect(putBody).toMatchObject({ name: 'Industria Atlas' })
  })

  it('adiciona um local via API real e recarrega a lista', async () => {
    let postBody: Record<string, unknown> | undefined
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/v1/sites') && init?.method === 'POST') {
        postBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return json({ ...site, id: 'novo-site-id', name: 'Nova Unidade' }, 201)
      }
      return defaultFetch(input)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    await screen.findByRole('heading', { name: 'Industria Atlas' })

    // clica em Adicionar local
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar local' }))
    const dialog = screen.getByRole('dialog')

    // preenche o nome
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Nova Unidade')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(postBody).toBeDefined())
    expect(postBody).toMatchObject({ clientId: CLIENT_ID, name: 'Nova Unidade' })
    expect(await screen.findByText('Local criado com sucesso.')).not.toBeNull()
  })

  it('exibe o resumo de locais cadastrados vindo da API', async () => {
    vi.stubGlobal('fetch', vi.fn(defaultFetch))
    renderPage()

    await screen.findByRole('heading', { name: 'Industria Atlas' })

    // activeSitesCount = 2 vindo da API
    expect(screen.getByText('2')).not.toBeNull()
  })
})
