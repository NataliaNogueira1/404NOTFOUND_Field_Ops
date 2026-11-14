import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientSiteDetailsPage } from '@/pages/catalog/ClientsPage'

const CLIENT_ID = '3e2fd0ad-93f1-4c51-a8ea-2f45f08e0f10'
const SITE_ID = '53bb819a-4203-4c5a-aad8-057f421f59b1'

const site = {
  id: SITE_ID,
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
}

const equipment = [
  {
    id: 101,
    siteId: 1,
    clientId: 1,
    siteName: 'Unidade Centro',
    name: 'Compressor A',
    assetNumber: 'CMP-001',
    serialNumber: 'SN-001',
    manufacturer: 'ACME',
    model: 'X500',
    description: null,
    qrCode: 'FO-CMP-001',
    status: 'ACTIVE',
    installedAt: null,
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
  if (url.includes(`/api/v1/sites/${SITE_ID}/equipment`)) return json(equipment)
  if (url.includes(`/api/v1/sites/${SITE_ID}`)) return json(site)
  return json({}, 404)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/app/clients/${CLIENT_ID}/sites/${SITE_ID}`]}>
      <Routes>
        <Route
          path="/app/clients/:clientId/sites/:siteId"
          element={<ClientSiteDetailsPage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => window.localStorage.setItem('fieldops:access-token', 'supervisor-token'))
afterEach(cleanup)

describe('ClientSiteDetailsPage', () => {
  it('carrega os dados do local via API real e não usa mocks', async () => {
    const fetchMock = vi.fn(defaultFetch)
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    // exibe spinner enquanto carrega
    expect(screen.getByRole('status')).not.toBeNull()

    // após carregar exibe os dados do local
    expect(await screen.findByRole('heading', { name: 'Unidade Centro' })).not.toBeNull()
    // "Industria Atlas" aparece no breadcrumb e no campo Cliente — verifica ao menos um
    expect(screen.getAllByText('Industria Atlas').length).toBeGreaterThan(0)
    expect(screen.getByText('Av. Paulista, 1000')).not.toBeNull()
    expect(screen.getByText('Sao Paulo / SP')).not.toBeNull()
    expect(screen.getByText('01310-100')).not.toBeNull()
    expect(screen.getByText('Ana Lima')).not.toBeNull()

    // a chamada à API real foi feita
    const siteCalls = fetchMock.mock.calls.map((c) => String(c[0])).filter((u) => u.includes(`/sites/${SITE_ID}`))
    expect(siteCalls.length).toBeGreaterThan(0)
  })

  it('exibe os equipamentos do local carregados via API real', async () => {
    vi.stubGlobal('fetch', vi.fn(defaultFetch))
    renderPage()

    expect(await screen.findByText('Compressor A')).not.toBeNull()
    expect(screen.getByText('CMP-001')).not.toBeNull()
    expect(screen.getByText('SN-001')).not.toBeNull()
  })

  it('exibe estado de erro com retry quando a API falha', async () => {
    let siteCallCount = 0
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes(`/api/v1/sites/${SITE_ID}/equipment`)) return json([])
      if (url.includes(`/api/v1/sites/${SITE_ID}`)) {
        siteCallCount++
        if (siteCallCount === 1) return json({ message: 'Internal Server Error' }, 500)
        return json(site)
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
    expect(await screen.findByRole('heading', { name: 'Unidade Centro' })).not.toBeNull()
  })

  it('exibe mensagem de não encontrado quando a API retorna 404', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json({ message: 'Not Found' }, 404)))
    renderPage()

    expect(await screen.findByText(/não encontrado/i)).not.toBeNull()
  })

  it('edita o local via API real e recarrega os dados', async () => {
    let putBody: Record<string, unknown> | undefined
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith(`/api/v1/sites/${SITE_ID}`) && init?.method === 'PUT') {
        putBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return json({ ...site, name: 'Unidade Centro Editada' })
      }
      return defaultFetch(input)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    // aguarda a página carregar
    expect(await screen.findByRole('heading', { name: 'Unidade Centro' })).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Editar local' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toBeNull()

    // confirma que o campo nome está preenchido com o valor atual
    const nameInput = dialog.querySelector('#site-form-name') as HTMLInputElement
    expect(nameInput.value).toBe('Unidade Centro')

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(putBody).toBeDefined())
    expect(putBody).toMatchObject({ name: 'Unidade Centro', clientId: CLIENT_ID })
  })

  it('exibe o QR Code do equipamento ao clicar em Ver', async () => {
    vi.stubGlobal('fetch', vi.fn(defaultFetch))
    renderPage()

    await screen.findByText('Compressor A')
    await userEvent.click(screen.getByRole('button', { name: /Ver/i }))

    expect(screen.getByRole('dialog')).not.toBeNull()
    expect(screen.getByText('FO-CMP-001')).not.toBeNull()
  })
})
