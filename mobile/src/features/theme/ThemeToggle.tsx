import Ionicons from '@react-native-vector-icons/ionicons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type ThemePreference } from './ThemeContext';

/**
 * Compact theme switcher (PBI-091). A single icon-only button that cycles
 * claro → escuro → sistema, mirroring the web ThemeToggle. The current mode is
 * conveyed by the icon plus an accessibilityLabel (not by color alone), and
 * accessibilityState.selected reflects dark mode for screen readers.
 */
const NEXT: Record<ThemePreference, ThemePreference> = {
  claro: 'escuro',
  escuro: 'sistema',
  sistema: 'claro',
};

const LABEL: Record<ThemePreference, string> = {
  claro: 'Claro',
  escuro: 'Escuro',
  sistema: 'Sistema',
};

const ICON: Record<ThemePreference, React.ComponentProps<typeof Ionicons>['name']> = {
  claro: 'sunny-outline',
  escuro: 'moon-outline',
  sistema: 'phone-portrait-outline',
};

export function ThemeToggle({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme, setTheme, effectiveTheme, colors } = useTheme();

  return (
    <Pressable
      onPress={() => setTheme(NEXT[theme])}
      accessibilityRole="button"
      accessibilityState={{ selected: effectiveTheme === 'dark' }}
      accessibilityLabel={`Alternar tema (atual: ${LABEL[theme]}). Toque para mudar.`}
      hitSlop={8}
      style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    >
      <Ionicons name={ICON[theme]} size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
});
