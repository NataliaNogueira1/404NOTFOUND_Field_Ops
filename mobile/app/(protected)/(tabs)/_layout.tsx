import { Tabs } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/features/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icons: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  inspections: { active: 'list', inactive: 'list-outline' },
  sync: { active: 'sync', inactive: 'sync-outline' },
  profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

const TAB_BAR_CONTENT_HEIGHT = 60;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();

  return (
    <Tabs screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size, focused }) => {
        const icon = icons[route.name] ?? icons.index;
        return <Ionicons name={focused ? icon.active : icon.inactive} color={color} size={size} />;
      },
      tabBarActiveTintColor: c.primary,
      tabBarInactiveTintColor: c.textSecondary,
      tabBarStyle: {
        backgroundColor: c.surface,
        borderTopColor: c.border,
        height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
        paddingTop: 6,
        paddingBottom: insets.bottom,
      },
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
