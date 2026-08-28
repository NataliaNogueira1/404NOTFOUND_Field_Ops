import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import type { SaveStatus } from '@/hooks/useDebouncedSave';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

/**
 * Visual feedback for auto-save state:
 * - idle: hidden
 * - saving: "Salvando..." with pulsing opacity
 * - saved: "✓ Salvo no dispositivo" in green
 */
export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'idle') {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [status, opacity]);

  if (status === 'idle') return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {status === 'saving' ? (
        <View style={styles.row}>
          <Text style={styles.savingDot}>●</Text>
          <Text style={styles.savingText}>Salvando...</Text>
        </View>
      ) : (
        <View style={styles.row}>
          <Text style={styles.savedCheck}>✓</Text>
          <Text style={styles.savedText}>Salvo no dispositivo</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savingDot: {
    fontSize: 8,
    color: Colors.warning,
  },
  savingText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  savedCheck: {
    fontSize: FontSize.sm,
    color: Colors.successDark,
    fontWeight: FontWeight.bold,
  },
  savedText: {
    fontSize: FontSize.xs,
    color: Colors.successDark,
    fontWeight: FontWeight.semibold,
  },
});
