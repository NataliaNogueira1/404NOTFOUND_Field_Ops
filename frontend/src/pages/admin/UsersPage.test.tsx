import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersPage } from '@/pages/admin/UsersPage'

const ana = {
  id: 7,
  name: 'Ana Costa',
  email: 'ana@example.com',
  role: 'ADMINISTRATOR',
  status: 'ACTIVE',
  phone: '(11) 99999-0000',
  createdAt: '2026-09-03T12:00:00Z',
  updatedAt: '2026-09-03T12:00:00Z',
  version: 0,
}

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
}

function page(content = [ana]) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: 10 }
}

beforeEach(() => {
  window.sessionStorage.setItem('fieldops:access-token', 'admin-token')
})

afterEach(cleanup)

describe('UsersPage', () => {
  it('loads users and sends filters and pagination to the server', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockImplementation(() => json(page()))
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><UsersPage /><LocationProbe /></MemoryRouter>)

    expect(await screen.findByText('Ana Costa')).not.toBeNull()
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'BLOCKED')

    expect(screen.getByTestId('location')).toHaveTextContent('status=BLOCKED')

    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('status=BLOCKED'), expect.anything()))
    expect(String(fetchMock.mock.calls[0][0])).toContain('page=0')
    expect(String(fetchMock.mock.calls[0][0])).toContain('size=10')
    expect(String(fetchMock.mock.calls[0][0])).toContain('sort=name%2Casc')
  })

  it('reflects debounced search and column sorting in the URL', async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
      .mockImplementation(() => json(page()))
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter initialEntries={['/app/users?size=25']}><UsersPage /><LocationProbe /></MemoryRouter>)
    await screen.findByText('Ana Costa')

    await userEvent.type(screen.getByLabelText('Buscar'), 'Ana')
    expect(screen.getByTestId('location')).toHaveTextContent('name=Ana')
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining('name=Ana'), expect.anything()))

    await userEvent.click(screen.getByRole('button', { name: 'Nome' }))
    expect(screen.getByTestId('location')).toHaveTextContent('sort=name%2Cdesc')
  })

  it('validates email on blur and creates a user through the API', async () => {
    let postBody: Record<string, unknown> | undefined
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/email-availability')) return json({ available: true })
      if (url.endsWith('/api/v1/users') && init?.method === 'POST') {
        postBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return json({ ...ana, id: 8, name: 'Nova Admin', email: 'nova@example.com' }, 201)
      }
      return json(page())
    })
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><UsersPage /></MemoryRouter>)
    await screen.findByText('Ana Costa')

    await userEvent.click(screen.getByRole('button', { name: /novo usuario/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Nova Admin')
    await userEvent.type(within(dialog).getByLabelText('E-mail'), 'nova@example.com')
    await userEvent.tab()
    await userEvent.type(within(dialog).getByLabelText('Senha'), 'secret1')
    await userEvent.selectOptions(within(dialog).getByLabelText('Perfil'), 'ADMIN')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/email-availability?email=nova%40example.com'), expect.anything()))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(postBody).toMatchObject({
      name: 'Nova Admin', email: 'nova@example.com', password: 'secret1', role: 'ADMINISTRATOR',
    }))
    expect(await screen.findByText('Usuario criado com sucesso.')).not.toBeNull()
  })

  it('asks for confirmation before inactivating a user', async () => {
    let statusBody: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/v1/users/7/status')) {
        statusBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        return json({ ...ana, status: 'INACTIVE', version: 1 })
      }
      return json(page())
    }))
    render(<MemoryRouter><UsersPage /></MemoryRouter>)
    await screen.findByText('Ana Costa')

    await userEvent.click(screen.getByRole('button', { name: 'Inativar Ana Costa' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('perdera o acesso ao sistema')
    expect(statusBody).toBeUndefined()
    await userEvent.click(screen.getByRole('button', { name: 'Inativar' }))

    await waitFor(() => expect(statusBody).toEqual({ status: 'INACTIVE' }))
  })
})

function LocationProbe() {
  return <span data-testid="location">{useLocation().search}</span>
}
