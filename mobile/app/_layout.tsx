import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/features/auth';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

/**
 * Watches auth state and redirects accordingly:
 * - Not authenticated → /(public)/login
 * - Authenticated + on public route → /(protected)/(tabs)
 */
function AuthGate() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inPublicGroup = segments[0] === '(public)';

    if (!isAuthenticated && !inPublicGroup) {
      router.replace('/(public)/login');
    } else if (isAuthenticated && inPublicGroup) {
      router.replace('/(protected)/(tabs)');
    }
  }, [isAuthenticated, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
