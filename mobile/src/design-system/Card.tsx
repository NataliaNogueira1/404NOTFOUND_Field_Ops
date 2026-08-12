import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BorderRadius, Colors, Shadow, Spacing } from '@/config/theme';

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
  return (
    <View
      style={[
        styles.card,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  padding_sm: { padding: Spacing.sm },
  padding_md: { padding: Spacing.md },
  padding_lg: { padding: Spacing.lg },
});
