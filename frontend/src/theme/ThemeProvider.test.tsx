import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { useTheme } from '@/theme/themeContext'

/** Mocks prefers-color-scheme: dark to the given value. */
function mockPrefersDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query.includes('dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function Probe() {
  const { theme, setTheme, effectiveTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="effective">{effectiveTheme}</span>
      <button onClick={() => setTheme('escuro')}>escuro</button>
      <button onClick={() => setTheme('claro')}>claro</button>
      <button onClick={() => setTheme('sistema')}>sistema</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    mockPrefersDark(false)
    document.documentElement.classList.remove('dark')
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('defaults to "sistema" when no preference is stored', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('theme').textContent).toBe('sistema')
    // System prefers light → effective light, no dark class.
    expect(screen.getByTestId('effective').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('applies dark when preference is "escuro" and persists it', async () => {
    render(<ThemeProvider><Probe /></ThemeProvider>)
    await userEvent.click(screen.getByText('escuro'))
    expect(screen.getByTestId('effective').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme-preference')).toBe('escuro')
  })

  it('forces light when preference is "claro" even if the OS prefers dark', async () => {
    mockPrefersDark(true)
    render(<ThemeProvider><Probe /></ThemeProvider>)
    await userEvent.click(screen.getByText('claro'))
    expect(screen.getByTestId('effective').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('follows the OS when preference is "sistema" (dark)', () => {
    mockPrefersDark(true)
    localStorage.setItem('theme-preference', 'sistema')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('effective').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('reads a previously stored preference on mount', () => {
    localStorage.setItem('theme-preference', 'escuro')
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByTestId('theme').textContent).toBe('escuro')
    expect(screen.getByTestId('effective').textContent).toBe('dark')
  })

  it('does not throw when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    })
    expect(() =>
      act(() => {
        render(<ThemeProvider><Probe /></ThemeProvider>)
      }),
    ).not.toThrow()
    expect(screen.getByTestId('theme').textContent).toBe('sistema')
  })
})
