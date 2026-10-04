import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BorderRadius, Shadow, Spacing } from '@/config/theme';
import { useThemeColors } from '@/features/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  padding = 'md',
  shadow = 'sm',
}: CardProps) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: c.surface, borderColor: c.border },
        padding !== 'none' && styles[`padding_${padding}`],
        shadow !== 'none' && Shadow[shadow],
        style,
      ]}
      accessible
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  padding_sm: { padding: Spacing.sm },
  padding_md: { padding: Spacing.md },
  padding_lg: { padding: Spacing.lg },
});
