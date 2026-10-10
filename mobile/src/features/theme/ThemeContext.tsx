import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from '@/config/themes';
import { themeStorage } from '@/infrastructure/storage/themeStorage';

/**
 * Dark mode infrastructure for mobile (PBI-091).
 *
 * Preference model:
 * - "claro"   → always light
 * - "escuro"  → always dark
 * - "sistema" → follows the OS via useColorScheme()
 *
 * Screens are NOT migrated in this issue; they still import `Colors`. Future
 * dark-mode issues will read the active `colors` from `useTheme()`.
 */
export type ThemePreference = 'claro' | 'escuro' | 'sistema';
export type EffectiveTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  effectiveTheme: EffectiveTheme;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isPreference(value: string | null): value is ThemePreference {
  return value === 'claro' || value === 'escuro' || value === 'sistema';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [theme, setThemeState] = useState<ThemePreference>('sistema');

  // Load saved preference on boot; default to "sistema" when none exists.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await themeStorage.getPreference();
      if (!cancelled && isPreference(stored)) setThemeState(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    themeStorage.savePreference(next).catch(() => {});
  }, []);

  const effectiveTheme: EffectiveTheme = useMemo(() => {
    if (theme === 'claro') return 'light';
    if (theme === 'escuro') return 'dark';
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [theme, systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      effectiveTheme,
      colors: effectiveTheme === 'dark' ? darkColors : lightColors,
    }),
    [theme, setTheme, effectiveTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
