import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/config/theme';

const icons = { index: 'house', inspections: 'checklist', sync: 'arrow.triangle.2.circlepath', profile: 'person.crop.circle' } as const;

export default function TabsLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => <SymbolView name={icons[route.name as keyof typeof icons]} tintColor={color} size={size} fallback={<></>} />,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.gray400,
      tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border, height: Platform.OS === 'ios' ? 88 : 68, paddingTop: 6 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: Platform.OS === 'android' ? 8 : 0 },
      headerShown: false,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="inspections" options={{ title: 'Inspeções' }} />
      <Tabs.Screen name="sync" options={{ title: 'Sync' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
