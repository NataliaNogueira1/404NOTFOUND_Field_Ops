import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useThemeColors } from '@/features/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const c = useThemeColors();

  // Build variant style dynamically so secondary uses the themed surface/border.
  const variantStyle = variant === 'secondary'
    ? { backgroundColor: c.surface, borderWidth: 1.5, borderColor: Colors.primary }
    : staticVariants[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        (isDisabled || pressed) && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' || variant === 'secondary' ? Colors.primary : Colors.white}
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const staticVariants: Record<Exclude<ButtonVariant, 'secondary'>, object> = {
  primary: { backgroundColor: Colors.primary },
  danger: { backgroundColor: Colors.danger },
  ghost: { backgroundColor: 'transparent' },
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  size_sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, minHeight: 36 },
  size_md: { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg, minHeight: 44 },
  size_lg: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, minHeight: 52 },
  label: { fontWeight: FontWeight.semibold, textAlign: 'center' },
  label_primary: { color: Colors.white },
  label_secondary: { color: Colors.primary },
  label_danger: { color: Colors.white },
  label_ghost: { color: Colors.primary },
  labelSize_sm: { fontSize: FontSize.sm },
  labelSize_md: { fontSize: FontSize.md },
  labelSize_lg: { fontSize: FontSize.lg },
});
