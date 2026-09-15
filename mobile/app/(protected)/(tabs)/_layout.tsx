import { Tabs } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/theme';

// Ionicons are cross-platform (iOS + Android + web). Each tab has a filled variant
// (shown when focused) and an outline variant (shown when inactive).
type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icons: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  inspections: { active: 'list', inactive: 'list-outline' },
  sync: { active: 'sync', inactive: 'sync-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

// Base height of the tab bar content (icons + labels), without the device's bottom inset.
const TAB_BAR_CONTENT_HEIGHT = 60;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size, focused }) => {
        const icon = icons[route.name] ?? icons.index;
        return <Ionicons name={focused ? icon.active : icon.inactive} color={color} size={size} />;
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.gray400,
      // Add the device's bottom safe-area inset so the bar sits above the system
      // navigation / gesture area (Android nav bar, iOS home indicator).
      tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border, height: TAB_BAR_CONTENT_HEIGHT + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      headerShown: false,
    })}>
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="inspections" options={{ title: 'Inspeções' }} />
      <Tabs.Screen name="sync" options={{ title: 'Sync' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
