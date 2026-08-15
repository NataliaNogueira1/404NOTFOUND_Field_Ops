import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  AccessibilityRole,
} from 'react-native';
import {
  BorderRadius,
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
} from '@/config/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface StatusCardProps {
  title: string;
  description?: string;
  timestamp?: string;
  status: InspectionStatus;
  onPress?: () => void;
  style?: ViewStyle;
}

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  color: string;
  backgroundColor: string;
  indicatorColor: string;
}

const STATUS_CONFIG: Record<InspectionStatus, StatusConfig> = {
  pending: {
    label: 'Pendente',
    color: Colors.warningDark,
    backgroundColor: '#FEF3C7',
    indicatorColor: Colors.warning,
  },
  in_progress: {
    label: 'Em andamento',
    color: Colors.primaryDark,
    backgroundColor: '#DBEAFE',
    indicatorColor: Colors.primary,
  },
  completed: {
    label: 'Concluído',
    color: Colors.successDark,
    backgroundColor: '#DCFCE7',
    indicatorColor: Colors.success,
  },
  failed: {
    label: 'Falhou',
    color: Colors.dangerDark,
    backgroundColor: '#FEE2E2',
    indicatorColor: Colors.danger,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StatusCard({
  title,
  description,
  timestamp,
  status,
  onPress,
  style,
}: StatusCardProps) {
  const config = STATUS_CONFIG[status];

  const content = (
    <View
      style={[styles.card, Shadow.sm, style]}
      accessible
      accessibilityRole={onPress ? ('button' as AccessibilityRole) : ('summary' as AccessibilityRole)}
      accessibilityLabel={`${title}. Status: ${config.label}${description ? '. ' + description : ''}${timestamp ? '. ' + timestamp : ''}`}
    >
      {/* Left accent bar */}
      <View
        style={[styles.accentBar, { backgroundColor: config.indicatorColor }]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />

      {/* Body */}
      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {/* Status pill */}
          <View style={[styles.statusPill, { backgroundColor: config.backgroundColor }]}>
            {/* Dot indicator */}
            <View
              style={[styles.dot, { backgroundColor: config.indicatorColor }]}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.statusLabel, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Description */}
        {description ? (
          <Text style={styles.description} numberOfLines={3}>
            {description}
          </Text>
        ) : null}

        {/* Footer */}
        {timestamp ? (
          <View style={styles.footer}>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
        android_ripple={{ color: Colors.gray200, borderless: false }}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  body: {
    flex: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.gray900,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: FontSize.sm * 1.5,
  },
  footer: {
    marginTop: Spacing.xs,
  },
  timestamp: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },
});
