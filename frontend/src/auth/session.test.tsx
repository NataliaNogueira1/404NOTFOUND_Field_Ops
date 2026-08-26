import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { normalizeRole } from '@/api/auth'
import { apiRequest, tokenStorage } from '@/api/client'
import { authSession } from '@/auth/session'
import { AppRoutes } from '@/routes/AppRoutes'
import { UserRole } from '@/types/domain'

const technicianUser = { id: 2, name: 'Carlos Henrique', email: 'carlos@fieldops.com', role: 'TECHNICIAN' }
const supervisorUser = { id: 1, name: 'Marina Silva', email: 'marina@fieldops.com', role: 'SUPERVISOR' }

function response(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
}

function loginBody(user: typeof technicianUser | typeof supervisorUser) {
  return { accessToken: `access-${user.role}`, refreshToken: `refresh-${user.role}`, expiresIn: 3600, user }
}

function mockFetch(handler: (url: string, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => handler(String(input), init)))
}

function renderRoute(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>)
}

beforeEach(() => {
  window.sessionStorage.clear()
})

afterEach(() => {
  cleanup()
  authSession.logout()
  window.sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe('real auth session and route guards', () => {
  it('normalizes ADMINISTRATOR to ADMIN', () => {
    expect(normalizeRole('ADMINISTRATOR')).toBe(UserRole.ADMIN)
  })

  it('redirects successful TECHNICIAN login to the technician portal', async () => {
    mockFetch(async url => url.endsWith('/api/v1/auth/login') ? response(loginBody(technicianUser)) : response(technicianUser))
    renderRoute('/login')

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'carlos@fieldops.com')
    await userEvent.type(screen.getByLabelText(/senha/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/ola, carlos/i)).not.toBeNull()
    expect(tokenStorage.get()).toBe('access-TECHNICIAN')
  })

  it('redirects successful SUPERVISOR login to admin dashboard', async () => {
    mockFetch(async url => url.endsWith('/api/v1/auth/login') ? response(loginBody(supervisorUser)) : response(supervisorUser))
    renderRoute('/login')

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'marina@fieldops.com')
    await userEvent.type(screen.getByLabelText(/senha/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0))
    expect(tokenStorage.get()).toBe('access-SUPERVISOR')
  })

  it('shows invalid credentials without storing a token', async () => {
    mockFetch(async () => response({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials', fieldErrors: [] }, 401))
    renderRoute('/login')

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'marina@fieldops.com')
    await userEvent.type(screen.getByLabelText(/senha/i), 'errada123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/e-mail ou senha invalidos/i)).not.toBeNull()
    expect(tokenStorage.get()).toBeNull()
  })

  it('restores the session from /auth/me when a token exists', async () => {
    tokenStorage.set('access-existing')
    mockFetch(async url => url.endsWith('/api/v1/auth/me') ? response(supervisorUser) : response(loginBody(supervisorUser)))

    await authSession.restore()

    expect(authSession.snapshot().user?.email).toBe('marina@fieldops.com')
  })

  it('clears the session when /auth/me returns 401', async () => {
    tokenStorage.set('expired-token')
    mockFetch(async () => response({ status: 401, code: 'UNAUTHORIZED', message: 'Authentication failed', fieldErrors: [] }, 401))

    await authSession.restore()

    expect(authSession.snapshot().user).toBeNull()
    expect(tokenStorage.get()).toBeNull()
  })

  it('keeps the session when an authenticated request returns 403', async () => {
    mockFetch(async url => url.endsWith('/api/v1/auth/login')
      ? response(loginBody(supervisorUser))
      : response({ status: 403, code: 'FORBIDDEN', message: 'Forbidden', fieldErrors: [] }, 403))
    await authSession.login('marina@fieldops.com', '123456')

    await expect(apiRequest('/api/v1/admin-only')).rejects.toMatchObject({ status: 403 })

    expect(tokenStorage.get()).toBe('access-SUPERVISOR')
    expect(authSession.snapshot().user?.email).toBe('marina@fieldops.com')
  })

  it('blocks technician access to admin routes', async () => {
    mockFetch(async () => response(loginBody(technicianUser)))
    await authSession.login('carlos@fieldops.com', '123456')
    renderRoute('/app/dashboard')

    expect(await screen.findByText(/ola, carlos/i)).not.toBeNull()
  })

  it('blocks supervisor access to technician routes', async () => {
    mockFetch(async () => response(loginBody(supervisorUser)))
    await authSession.login('marina@fieldops.com', '123456')
    renderRoute('/technician/home')

    await waitFor(() => expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0))
    expect(screen.queryByText(/portal do tecnico/i)).toBeNull()
  })

  it('logout clears local session data', async () => {
    mockFetch(async () => response(loginBody(supervisorUser)))
    await authSession.login('marina@fieldops.com', '123456')

    authSession.logout()

    expect(authSession.snapshot().user).toBeNull()
    expect(tokenStorage.get()).toBeNull()
  })
})
