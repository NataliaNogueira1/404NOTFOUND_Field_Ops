import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { Colors } from '@/config/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? 8 : 0,
        },
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.gray900,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          headerTitle: '404 Field Ops',
        }}
      />
      <Tabs.Screen
        name="inspections"
        options={{
          title: 'Inspeções',
          headerTitle: 'Inspeções',
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sincronizar',
          headerTitle: 'Sincronização',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          headerTitle: 'Meu Perfil',
        }}
      />
    </Tabs>
  );
}
