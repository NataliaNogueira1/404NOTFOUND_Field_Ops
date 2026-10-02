import { useTheme } from './ThemeContext';
import type { ThemeColors } from '@/config/themes';

/**
 * Convenience hook: returns the active color palette (light or dark).
 * Use this in screens and components instead of the static `Colors` import.
 *
 * Example:
 *   const c = useThemeColors()
 *   <View style={{ backgroundColor: c.background }}>
 */
export function useThemeColors(): ThemeColors {
  return useTheme().colors;
}
