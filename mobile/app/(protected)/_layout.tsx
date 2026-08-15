import { Stack } from 'expo-router';

export default function ProtectedLayout() {
  return (
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
  );
}
