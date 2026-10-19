import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ThemeContext,
  type EffectiveTheme,
  type ThemeContextValue,
  type ThemePreference,
} from './themeContext'

/**
 * Dark mode infrastructure (PBI-091).
 *
 * Theme preference model:
 * - "claro"   → always light
 * - "escuro"  → always dark
 * - "sistema" → follow the OS via prefers-color-scheme
 *
 * The effective theme ("light" | "dark") toggles the `dark` class on <html>,
 * which flips the semantic color tokens redefined in index.css. Screens using
 * the semantic classes (bg-surface, text-text, ...) adapt with no changes.
 */
const STORAGE_KEY = 'theme-preference'

/** Reads the saved preference; falls back to "sistema" and never throws. */
function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'claro' || stored === 'escuro' || stored === 'sistema') return stored
  } catch {
    // localStorage unavailable (private mode, SSR, etc.) — ignore and use default.
  }
  return 'sistema'
}

function persistPreference(theme: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore persistence errors so the app never breaks.
  }
}

function prefersDark(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveEffective(theme: ThemePreference): EffectiveTheme {
  if (theme === 'claro') return 'light'
  if (theme === 'escuro') return 'dark'
  return prefersDark() ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStoredPreference())
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() => resolveEffective(theme))

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next)
    persistPreference(next)
    setEffectiveTheme(resolveEffective(next))
  }, [])

  // Apply the `dark` class to <html> whenever the effective theme changes.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
  }, [effectiveTheme])

  // When following the system, react to OS changes live.
  useEffect(() => {
    if (theme !== 'sistema' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setEffectiveTheme(media.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, effectiveTheme }),
    [theme, setTheme, effectiveTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
