import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SitesPage } from '@/pages/catalog/SitesPage'

const client = {
  id: '3e2fd0ad-93f1-4c51-a8ea-2f45f08e0f10', name: 'Industria Atlas',
  legalName: null, document: null, email: null, phone: null,
  status: 'ACTIVE', activeSitesCount: 1, version: 0,
}

const site = {
  id: '53bb819a-4203-4c5a-aad8-057f421f59b1', clientId: client.id,
  clientName: client.name, name: 'Unidade Centro', description: 'Entrada lateral',
  address: 'Av. Paulista, 1000', city: 'Sao Paulo', state: 'SP', zipCode: '01310-100',
  latitude: -23.561684, longitude: -46.655981, contactName: 'Ana',
  contactPhone: '(11) 99999-0000', status: 'ACTIVE', equipmentCount: 3, version: 0,
}

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  }))
}

function page(content: unknown[]) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: 10 }
}

function defaultFetch(input: RequestInfo | URL) {
  return String(input).includes('/api/v1/clients?') ? json(page([client])) : json(page([site]))
}

beforeEach(() => window.sessionStorage.setItem('fieldops:access-token', 'supervisor-token'))
afterEach(cleanup)

describe('SitesPage', () => {
  it('loads equipment count and sends client and status filters to the server', async () => {
    const fetchMock = vi.fn(defaultFetch)
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><SitesPage /></MemoryRouter>)

    expect(await screen.findByText('Unidade Centro')).not.toBeNull()
    expect(screen.getByText('3')).not.toBeNull()
    await userEvent.type(screen.getByLabelText('Buscar'), 'Centro')
    await userEvent.selectOptions(screen.getByLabelText('Cliente'), client.id)
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'ACTIVE')

    await waitFor(() => {
      const siteCalls = fetchMock.mock.calls.map(call => String(call[0])).filter(url => url.includes('/api/v1/sites?'))
      expect(siteCalls.at(-1)).toContain('name=Centro')
      expect(siteCalls.at(-1)).toContain(`clientId=${client.id}`)
      expect(siteCalls.at(-1)).toContain('status=ACTIVE')
    })
  })

  it('creates a site with an active client and all location fields', async () => {
    let postBody: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/v1/sites') && init?.method === 'POST') {
        postBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return json(site, 201)
      }
      return defaultFetch(input)
    }))
    render(<MemoryRouter><SitesPage /></MemoryRouter>)
    await screen.findByText('Unidade Centro')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Novo local' })).not.toBeDisabled())

    await userEvent.click(screen.getByRole('button', { name: 'Novo local' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Nova Filial')
    await userEvent.type(within(dialog).getByLabelText('Descricao (opcional)'), 'Recepcao principal')
    await userEvent.type(within(dialog).getByLabelText('Cidade (opcional)'), 'Campinas')
    await userEvent.selectOptions(within(dialog).getByLabelText('Estado (UF)'), 'SP')
    await userEvent.type(within(dialog).getByLabelText('CEP (opcional)'), '13010-001')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(postBody).toMatchObject({
      clientId: client.id, name: 'Nova Filial', description: 'Recepcao principal',
      city: 'Campinas', state: 'SP', zipCode: '13010-001',
    }))
    expect(await screen.findByText('Local criado com sucesso.')).not.toBeNull()
  })

  it('requires confirmation before logical inactivation', async () => {
    let patchBody: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith(`/api/v1/sites/${site.id}/status`)) {
        patchBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        return json({ ...site, status: 'INACTIVE', version: 1 })
      }
      return defaultFetch(input)
    }))
    render(<MemoryRouter><SitesPage /></MemoryRouter>)
    await screen.findByText('Unidade Centro')

    await userEvent.click(screen.getByRole('button', { name: 'Inativar Unidade Centro' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('deixara de aparecer em novas inspecoes')
    expect(patchBody).toBeUndefined()
    await userEvent.click(screen.getByRole('button', { name: 'Inativar' }))

    await waitFor(() => expect(patchBody).toEqual({ status: 'INACTIVE' }))
  })
})
