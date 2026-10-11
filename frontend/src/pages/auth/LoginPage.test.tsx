import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AuthLayout } from '@/layouts/AuthLayout'

/** Mocks matchMedia for ThemeProvider (jsdom doesn't implement it). */
function mockMatchMedia(prefersDark = false) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark && query.includes('dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

/**
 * Renders AuthLayout + LoginPage in a memory router, replicating the real
 * routing setup in AppRoutes.tsx.
 */
function renderLoginPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  mockMatchMedia(false)
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
})

describe('LoginPage — dark theme (issue #172)', () => {
  it('renders the ThemeToggle on the auth screen', () => {
    renderLoginPage()
    expect(screen.getByRole('button', { name: /alternar tema/i })).toBeInTheDocument()
  })

  it('ThemeToggle switches to dark mode when clicked twice (sistema → claro → escuro)', async () => {
    renderLoginPage()
    const toggle = screen.getByRole('button', { name: /alternar tema/i })

    // sistema → claro
    await userEvent.click(toggle)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // claro → escuro
    await userEvent.click(toggle)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('hint box does not use hardcoded bg-slate-50', () => {
    renderLoginPage()
    const hint = screen.getByText(/use credenciais cadastradas/i).closest('div')
    expect(hint?.className).not.toContain('bg-slate-50')
  })

  it('hint box uses semantic token class that adapts to dark mode', () => {
    renderLoginPage()
    const hint = screen.getByText(/use credenciais cadastradas/i).closest('div')
    // bg-app-bg and bg-surface are redefined under .dark in index.css
    expect(hint?.className).toMatch(/bg-app-bg|bg-surface/)
  })

  it('AuthLayout outer wrapper uses semantic bg-app-bg', () => {
    renderLoginPage()
    const main = document.querySelector('main')
    expect(main?.className).toContain('bg-app-bg')
  })

  it('page title and form remain visible after switching to dark mode', async () => {
    renderLoginPage()
    const toggle = screen.getByRole('button', { name: /alternar tema/i })

    // Switch to dark (sistema → claro → escuro)
    await userEvent.click(toggle)
    await userEvent.click(toggle)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    expect(screen.getByText('FieldOps')).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('quick-fill buttons are accessible in dark mode', async () => {
    renderLoginPage()
    const toggle = screen.getByRole('button', { name: /alternar tema/i })
    await userEvent.click(toggle)
    await userEvent.click(toggle) // sistema → claro → escuro

    expect(screen.getByRole('button', { name: /supervisor/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /tecnico/i })).toBeInTheDocument()
  })

  it('ThemeToggle persists dark preference to localStorage', async () => {
    renderLoginPage()
    const toggle = screen.getByRole('button', { name: /alternar tema/i })

    // sistema → claro
    await userEvent.click(toggle)
    expect(localStorage.getItem('theme-preference')).toBe('claro')

    // claro → escuro
    await userEvent.click(toggle)
    expect(localStorage.getItem('theme-preference')).toBe('escuro')
  })
})
