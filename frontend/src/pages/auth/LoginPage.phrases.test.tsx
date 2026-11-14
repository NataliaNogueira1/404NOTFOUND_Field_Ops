import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { LoginPage } from '@/pages/auth/LoginPage'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LOGIN_PHRASES, LOGIN_PHRASE_INTERVAL_MS } from '@/pages/auth/loginPhrases'

function mockMatchMedia() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

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
  vi.useFakeTimers()
  mockMatchMedia()
})

afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('LoginPage — rotating motivational phrases (PBI-274)', () => {
  it('shows the first phrase initially', () => {
    renderLoginPage()
    expect(screen.getByText(LOGIN_PHRASES[0])).toBeInTheDocument()
  })

  it('rotates to the next phrase after the interval', () => {
    renderLoginPage()
    expect(screen.getByText(LOGIN_PHRASES[0])).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(LOGIN_PHRASE_INTERVAL_MS))

    expect(screen.getByText(LOGIN_PHRASES[1])).toBeInTheDocument()
    expect(screen.queryByText(LOGIN_PHRASES[0])).not.toBeInTheDocument()
  })

  it('exposes the tagline as a polite live region for screen readers', () => {
    renderLoginPage()
    const liveRegion = screen.getByText(LOGIN_PHRASES[0]).closest('[aria-live]')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
  })
})
