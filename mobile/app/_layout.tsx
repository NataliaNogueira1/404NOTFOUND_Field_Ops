import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/features/auth';
import { FieldOpsProvider } from '@/features/fieldops';
import { DatabaseProvider } from '@/infrastructure/database/DatabaseProvider';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isAuthenticated, isHydrating, isOfflineLimited } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isHydrating) return; // Wait until we know if there's a stored session

    const inPublicGroup = segments[0] === '(public)';
    // In offline-limited mode the user keeps browsing locally cached data.
    if (!isAuthenticated && !isOfflineLimited && !inPublicGroup) {
      router.replace('/(public)/login');
    }
    if (isAuthenticated && inPublicGroup) router.replace('/(protected)/(tabs)');
  }, [isAuthenticated, isHydrating, isOfflineLimited, segments, router]);

  if (isHydrating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;

  return (
    <DatabaseProvider>
      <AuthProvider>
        <FieldOpsProvider>
          <AuthGate />
        </FieldOpsProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
