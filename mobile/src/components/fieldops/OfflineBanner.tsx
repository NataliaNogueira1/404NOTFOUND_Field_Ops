import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, FontSize, FontWeight, Spacing } from '@/config/theme';
import { useConnectivity } from '@/infrastructure/connectivity';

/**
 * Global banner shown whenever the device loses network connectivity. It sits
 * at the top of the protected layout and disappears automatically as soon as
 * the connection is restored (driven by NetInfo via {@link useConnectivity}).
 *
 * All screens keep reading from the local SQLite database while offline, so this
 * banner is purely informative — it does not block any local action.
 *
 * useSafeAreaInsets ensures the banner appears below the native status bar,
 * notch, or punch-hole camera on both iOS and Android (issue #332).
 */
export function OfflineBanner() {
  const { isOffline } = useConnectivity();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View
      style={[styles.banner, { paddingTop: insets.top + Spacing.sm }]}
      accessibilityRole="alert"
    >
      <Text style={styles.text}>📡 Modo offline — usando dados salvos no dispositivo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.gray800,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  text: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
});
