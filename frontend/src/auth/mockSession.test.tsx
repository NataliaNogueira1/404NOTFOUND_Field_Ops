import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { mockSession } from '@/auth/mockSession'
import { AppRoutes } from '@/routes/AppRoutes'

function renderRoute(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>)
}

afterEach(() => {
  cleanup()
  mockSession.logout()
  window.sessionStorage.clear()
})

describe('mock auth and route guards', () => {
  it('redirects technician login to the technician portal', async () => {
    renderRoute('/login')
    await userEvent.click(screen.getByRole('button', { name: /tecnico/i }))
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(screen.getAllByText(/portal do tecnico/i).length).toBeGreaterThan(0))
    expect(await screen.findByText(/ola, carlos/i)).not.toBeNull()
  })

  it('blocks technician access to admin routes', async () => {
    mockSession.login('carlos@fieldops.com')
    renderRoute('/app/dashboard')

    await waitFor(() => expect(screen.getAllByText(/portal do tecnico/i).length).toBeGreaterThan(0))
    expect(await screen.findByText(/ola, carlos/i)).not.toBeNull()
  })

  it('blocks supervisor access to technician routes', async () => {
    mockSession.login('marina@fieldops.com')
    renderRoute('/technician/home')

    await waitFor(() => expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0))
    expect(screen.queryByText(/portal do tecnico/i)).toBeNull()
  })
})
