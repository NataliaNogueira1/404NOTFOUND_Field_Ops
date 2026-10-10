import { createContext, useContext } from 'react'

/**
 * Theme context + hook (PBI-091). Kept in a separate module from the provider
 * component so the file only exports non-component values (avoids the
 * react-refresh/only-export-components warning).
 */
export type ThemePreference = 'claro' | 'escuro' | 'sistema'
export type EffectiveTheme = 'light' | 'dark'

export interface ThemeContextValue {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
  effectiveTheme: EffectiveTheme
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
