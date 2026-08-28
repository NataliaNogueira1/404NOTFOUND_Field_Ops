import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/config/theme';
import { OfflineLimitedBanner } from '@/features/auth';

export default function ProtectedLayout() {
  return (
    <View style={styles.container}>
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
