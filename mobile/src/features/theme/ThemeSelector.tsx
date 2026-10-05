import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, FontWeight, Spacing } from '@/config/theme';
import { useTheme, type ThemePreference } from './ThemeContext';

/**
 * Accessible theme switcher (PBI-091). Three options: Claro / Escuro / Sistema.
 * State is conveyed by text + accessibility props (not color alone), and the
 * selected option exposes accessibilityState.selected for screen readers.
 *
 * Colors come from the active palette (`useTheme().colors`) instead of the
 * static `Colors`, so the selector itself follows the theme — it is the first
 * control to visibly reflect the chosen mode.
 */
const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'claro', label: 'Claro' },
  { value: 'escuro', label: 'Escuro' },
  { value: 'sistema', label: 'Sistema' },
];

export function ThemeSelector() {
  const { theme, setTheme, colors } = useTheme();

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
            style={[
              styles.option,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primary : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                { color: selected ? colors.white : colors.textSecondary },
              ]}
            >
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
  },
  optionText: {
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
});
