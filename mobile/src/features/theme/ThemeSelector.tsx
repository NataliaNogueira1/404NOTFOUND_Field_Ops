import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useTheme, type ThemePreference } from './ThemeContext';

/**
 * Accessible theme switcher (PBI-091). Three options: Claro / Escuro / Sistema.
 * State is conveyed by text + accessibility props (not color alone), and the
 * selected option exposes accessibilityState.selected for screen readers.
 */
const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'claro', label: 'Claro' },
  { value: 'escuro', label: 'Escuro' },
  { value: 'sistema', label: 'Sistema' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel="Tema do aplicativo">
      {OPTIONS.map((option) => {
        const selected = theme === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setTheme(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Tema ${option.label}`}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  option: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  optionTextSelected: {
    color: Colors.white,
  },
});
