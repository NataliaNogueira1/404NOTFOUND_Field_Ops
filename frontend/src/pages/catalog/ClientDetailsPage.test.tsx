import { cleanup, render, screen, waitFor } from '@testing-library/react'
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
  activeSitesCount: 7,
  version: 0,
}

const sites = [
  {
    id: 101,
    clientId: CLIENT_ID,
    clientName: 'Industria Atlas',
    name: 'Unidade Centro',
    description: 'Sede principal',
    address: 'Av. Paulista, 1000',
    city: 'Sao Paulo',
    state: 'SP',
    zipCode: '01310-100',
    latitude: -23.561684,
    longitude: -46.655981,
    contactName: 'Ana Lima',
    contactPhone: '(11) 99999-0000',
    status: 'ACTIVE',
    equipmentCount: 2,
    version: 0,
  },
  {
    id: 102,
    clientId: CLIENT_ID,
    clientName: 'Industria Atlas',
    name: 'Unidade Filial',
    description: null,
    address: null,
    city: 'Campinas',
    state: 'SP',
    zipCode: null,
    latitude: null,
    longitude: null,
    contactName: null,
    contactPhone: null,
    status: 'INACTIVE',
    equipmentCount: 0,
    version: 0,
  },
]

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
  if (url.includes(`/api/v1/clients/${CLIENT_ID}/sites`)) return json(sites)
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
  it('exibe o spinner de carregamento enquanto busca os dados', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    renderPage()

    expect(screen.getByRole('status')).not.toBeNull()
  })

  it('carrega os dados do cliente via API real e não usa mocks', async () => {
    const fetchMock = vi.fn(defaultFetch)
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    // após carregar exibe os dados do cliente
    expect(await screen.findByRole('heading', { name: 'Industria Atlas' })).not.toBeNull()
    expect(screen.getByText('Atlas Industrial SA')).not.toBeNull()
    expect(screen.getByText('12.345.678/0001-90')).not.toBeNull()
    expect(screen.getByText('contato@atlas.com')).not.toBeNull()
    expect(screen.getByText('(11) 99999-0000')).not.toBeNull()
    // "Ativo" aparece no status do cliente e no badge do primeiro local
    expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0)
    // activeSitesCount (7) é único na tela e aparece no resumo da estrutura
    expect(screen.getByText('7')).not.toBeNull()

    // a chamada à API real foi feita
    const clientCalls = fetchMock.mock.calls.map((c) => String(c[0])).filter((u) => u.includes(`/clients/${CLIENT_ID}`))
    expect(clientCalls.length).toBeGreaterThan(0)
  })

  it('carrega e exibe os locais vinculados via API real', async () => {
    vi.stubGlobal('fetch', vi.fn(defaultFetch))
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Industria Atlas' })).not.toBeNull()
    // tabela de locais
    expect(await screen.findByText('Unidade Centro')).not.toBeNull()
    expect(screen.getByText('Unidade Filial')).not.toBeNull()
    expect(screen.getByText('Sao Paulo / SP')).not.toBeNull()
    expect(screen.getByText('Campinas / SP')).not.toBeNull()
    expect(screen.getByText('Ana Lima')).not.toBeNull()
  })

  it('exibe estado de erro com retry quando a API falha', async () => {
    let clientCallCount = 0
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes(`/api/v1/clients/${CLIENT_ID}/sites`)) return json([])
      if (url.includes(`/api/v1/clients/${CLIENT_ID}`)) {
        clientCallCount++
        if (clientCallCount === 1) return json({ message: 'Internal Server Error' }, 500)
        return json(client)
      }
      return json({}, 404)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    // aguarda aparecer mensagem de erro
    expect(await screen.findByRole('alert')).not.toBeNull()
    expect(screen.getByText(/Não foi possível/i)).not.toBeNull()

    // clica em retry
    await userEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }))

    // agora carrega com sucesso
    expect(await screen.findByRole('heading', { name: 'Industria Atlas' })).not.toBeNull()
  })

  it('exibe mensagem de não encontrado quando a API retorna 404', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ message: 'Not Found' }, 404)))
    renderPage()

    expect(await screen.findByText(/não encontrado/i)).not.toBeNull()
    // não deve haver botão de retry (404 não é recuperável)
    expect(screen.queryByRole('button', { name: /Tentar novamente/i })).toBeNull()
    // link de voltar para a lista de clientes
    expect(screen.getByRole('link', { name: 'Clientes' }).getAttribute('href')).toBe('/app/clients')
  })

  it('edita o cliente via API real e recarrega os dados', async () => {
    let putBody: Record<string, unknown> | undefined
    let currentClient = client
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith(`/api/v1/clients/${CLIENT_ID}`) && init?.method === 'PUT') {
        putBody = JSON.parse(String(init.body)) as Record<string, unknown>
        currentClient = { ...client, name: 'Industria Atlas Editada' }
        return json(currentClient)
      }
      if (url.includes(`/api/v1/clients/${CLIENT_ID}/sites`)) return json(sites)
      if (url.includes(`/api/v1/clients/${CLIENT_ID}`)) return json(currentClient)
      return json({}, 404)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    // aguarda a página carregar
    expect(await screen.findByRole('heading', { name: 'Industria Atlas' })).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Editar cliente' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toBeNull()

    // confirma que o campo nome está preenchido com o valor atual
    const nameInput = dialog.querySelector('#client-name') as HTMLInputElement
    expect(nameInput.value).toBe('Industria Atlas')

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(putBody).toBeDefined())
    expect(putBody).toMatchObject({ name: 'Industria Atlas' })

    // após salvar, a página recarrega o cliente e exibe o dado atualizado
    expect(await screen.findByRole('heading', { name: 'Industria Atlas Editada' })).not.toBeNull()
  })

  it('exibe erro com retry quando falha o carregamento dos locais, sem mostrar lista vazia', async () => {
    let sitesCallCount = 0
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes(`/api/v1/clients/${CLIENT_ID}/sites`)) {
          sitesCallCount++
          return sitesCallCount === 1 ? json({ message: 'Internal Server Error' }, 500) : json(sites)
        }
        if (url.includes(`/api/v1/clients/${CLIENT_ID}`)) return json(client)
        return json({}, 404)
      }),
    )
    renderPage()

    // o cliente carrega normalmente; só a seção de locais falha
    expect(await screen.findByRole('heading', { name: 'Industria Atlas' })).not.toBeNull()
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/locais/i)
    expect(screen.queryByText('Nenhum local cadastrado para este cliente.')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }))

    expect(await screen.findByText('Unidade Centro')).not.toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('exibe o estado vazio quando o cliente não tem locais', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        if (String(input).includes(`/api/v1/clients/${CLIENT_ID}/sites`)) return json([])
        return defaultFetch(input)
      }),
    )
    renderPage()

    expect(await screen.findByText('Nenhum local cadastrado para este cliente.')).not.toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
