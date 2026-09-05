import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientsPage } from '@/pages/catalog/ClientsPage'

const atlas = {
  id: '3e2fd0ad-93f1-4c51-a8ea-2f45f08e0f10',
  name: 'Industria Atlas',
  legalName: 'Atlas Industrial SA',
  document: '12.345.678/0001-90',
  email: 'contato@atlas.com',
  phone: '(11) 99999-0000',
  status: 'ACTIVE',
  activeSitesCount: 2,
  version: 0,
}

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  }))
}

function page(content = [atlas]) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: 10 }
}

beforeEach(() => window.sessionStorage.setItem('fieldops:access-token', 'supervisor-token'))
afterEach(cleanup)

describe('ClientsPage', () => {
  it('loads the active-site count and sends filters to the server', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockImplementation(() => json(page()))
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><ClientsPage /></MemoryRouter>)

    expect(await screen.findByText('Industria Atlas')).not.toBeNull()
    expect(screen.getByText('2')).not.toBeNull()
    await userEvent.type(screen.getByLabelText('Buscar'), 'Atlas')
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'ACTIVE')

    await waitFor(() => {
      const lastUrl = String(fetchMock.mock.calls.at(-1)?.[0])
      expect(lastUrl).toContain('name=Atlas')
      expect(lastUrl).toContain('status=ACTIVE')
      expect(lastUrl).toContain('page=0')
      expect(lastUrl).toContain('size=10')
    })
  })

  it('validates and creates a client through the API', async () => {
    let postBody: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/v1/clients') && init?.method === 'POST') {
        postBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return json({ ...atlas, name: 'Cliente Novo' }, 201)
      }
      return json(page())
    }))
    render(<MemoryRouter><ClientsPage /></MemoryRouter>)
    await screen.findByText('Industria Atlas')

    await userEvent.click(screen.getByRole('button', { name: 'Novo cliente' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Cliente Novo')
    await userEvent.type(within(dialog).getByLabelText('Razao social (opcional)'), 'Cliente Novo SA')
    await userEvent.type(within(dialog).getByLabelText('Documento (CNPJ)'), '12.345.678/0001-90')
    await userEvent.type(within(dialog).getByLabelText('E-mail (opcional)'), 'novo@example.com')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(postBody).toMatchObject({
      name: 'Cliente Novo', legalName: 'Cliente Novo SA',
      document: '12.345.678/0001-90', email: 'novo@example.com',
    }))
    expect(await screen.findByText('Cliente criado com sucesso.')).not.toBeNull()
  })

  it('requires confirmation before logical inactivation', async () => {
    let patchBody: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith(`/api/v1/clients/${atlas.id}/status`)) {
        patchBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        return json({ ...atlas, status: 'INACTIVE', version: 1 })
      }
      return json(page())
    }))
    render(<MemoryRouter><ClientsPage /></MemoryRouter>)
    await screen.findByText('Industria Atlas')

    await userEvent.click(screen.getByRole('button', { name: 'Inativar Industria Atlas' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('deixara de aparecer em novos agendamentos')
    expect(patchBody).toBeUndefined()
    await userEvent.click(screen.getByRole('button', { name: 'Inativar' }))

    await waitFor(() => expect(patchBody).toEqual({ status: 'INACTIVE' }))
  })
})
