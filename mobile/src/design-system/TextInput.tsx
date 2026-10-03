import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, FontSize, Spacing } from '@/config/theme';
import { useThemeColors } from '@/features/theme';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

export function TextInput({
  label,
  error,
  hint,
  containerStyle,
  ...props
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const c = useThemeColors();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: c.textSecondary }]} accessibilityRole="text">
          {label}
        </Text>
      )}
      <RNTextInput
        style={[
          styles.input,
          {
            backgroundColor: c.surface,
            borderColor: focused ? Colors.primary : error ? Colors.danger : c.border,
            color: c.text,
          },
        ]}
        placeholderTextColor={c.textSecondary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        accessibilityHint={hint}
        {...props}
      />
      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
      ) : hint ? (
        <Text style={[styles.hintText, { color: c.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: '500' },
  input: {
    height: 44,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  errorText: { fontSize: FontSize.xs, color: Colors.danger },
  hintText: { fontSize: FontSize.xs },
});
