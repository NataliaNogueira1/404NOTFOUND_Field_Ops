import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/fieldops';
import { Colors } from '@/config/theme';
import { OfflineLimitedBanner } from '@/features/auth';

export default function ProtectedLayout() {
  const insets = useSafeAreaInsets();

  return (
    /**
     * The top safe-area inset (notch, punch-hole, status bar) is applied ONCE
     * here for the entire protected area. OfflineBanner and OfflineLimitedBanner
     * must NOT add insets.top themselves — doing so would double the offset
     * when both banners are visible at the same time (e.g. offline + expired
     * session), producing a blank gap the size of the notch between them.
     */
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <OfflineBanner />
      <OfflineLimitedBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="inspections/[id]" />
        <Stack.Screen name="inspections/[id]/start" />
        <Stack.Screen name="inspections/[id]/checklist" />
        <Stack.Screen name="inspections/[id]/summary" />
        <Stack.Screen name="inspections/[id]/non-conformities" />
        <Stack.Screen name="evidence" />
        <Stack.Screen name="scanner" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
