import { Colors } from './theme';

/**
 * Light/Dark color tokens (PBI-091 — infrastructure only).
 *
 * `lightColors` reuses the existing `Colors` object verbatim, so the current
 * light appearance is preserved exactly. `darkColors` mirrors the SAME KEYS,
 * so future screens can switch source object without renaming anything.
 *
 * This issue only sets up the tokens + provider. Screens are NOT migrated yet;
 * they keep importing `Colors` until later dark-mode issues consume `useTheme()`.
 */
/** Same keys as `Colors`, but each value widened to `string` so light/dark
 * palettes can hold different hex values without literal-type conflicts. */
export type ThemeColors = Record<keyof typeof Colors, string>;

/** Light theme = current palette, unchanged. */
export const lightColors: ThemeColors = Colors;

/** Dark theme mirror: same keys, dark-friendly values. */
export const darkColors: ThemeColors = {
  primary: '#3B82F6',
  primaryLight: '#1E3A8A',
  primaryDark: '#93C5FD',
  success: '#22C55E',
  successLight: '#14532D',
  successDark: '#4ADE80',
  warning: '#F59E0B',
  warningLight: '#78350F',
  warningDark: '#FBBF24',
  danger: '#EF4444',
  dangerLight: '#7F1D1D',
  dangerDark: '#F87171',
  white: '#FFFFFF',
  black: '#000000',
  text: '#E2E8F0',
  textSecondary: '#94A3B8',
  gray50: '#0B1220',
  gray100: '#111A2E',
  gray200: '#1E293B',
  gray300: '#334155',
  gray400: '#475569',
  gray500: '#64748B',
  gray600: '#94A3B8',
  gray700: '#CBD5E1',
  gray800: '#E2E8F0',
  gray900: '#F8FAFC',
  background: '#0B1220',
  surface: '#111A2E',
  border: '#2A3852',
  mutedSurface: '#0F1626',
};

export const themes = { light: lightColors, dark: darkColors } as const;
