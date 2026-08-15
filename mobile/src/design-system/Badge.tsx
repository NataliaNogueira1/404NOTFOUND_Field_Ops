import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BorderRadius, Colors, FontSize, Spacing } from '@/config/theme';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  return (
    <View
      style={[styles.base, styles[variant], styles[`size_${size}`], style]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
        {label}
      </Text>
    </View>
  );
}

type StatusType = 'pending' | 'in_progress' | 'completed' | 'failed' | 'synced' | 'unsynced';

interface StatusBadgeProps {
  status: StatusType;
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<StatusType, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pendente', variant: 'warning' },
  in_progress: { label: 'Em andamento', variant: 'primary' },
  completed: { label: 'Concluído', variant: 'success' },
  failed: { label: 'Falhou', variant: 'danger' },
  synced: { label: 'Sincronizado', variant: 'success' },
  unsynced: { label: 'Não sincronizado', variant: 'warning' },
};

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return <Badge label={config.label} variant={config.variant} style={style} />;
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
  },
  // Variants background
  default: { backgroundColor: Colors.gray100 },
  primary: { backgroundColor: '#DBEAFE' },
  success: { backgroundColor: '#DCFCE7' },
  warning: { backgroundColor: '#FEF3C7' },
  danger: { backgroundColor: '#FEE2E2' },

  // Sizes
  size_sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
  },

  // Label base
  label: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  label_default: { color: Colors.gray600 },
  label_primary: { color: Colors.primaryDark },
  label_success: { color: Colors.successDark },
  label_warning: { color: Colors.warningDark },
  label_danger: { color: Colors.dangerDark },

  labelSize_sm: { fontSize: FontSize.xs },
  labelSize_md: { fontSize: FontSize.xs + 1 },
});
