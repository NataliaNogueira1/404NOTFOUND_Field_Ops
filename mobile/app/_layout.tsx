import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/features/auth';
import { FieldOpsProvider } from '@/features/fieldops';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inPublicGroup = segments[0] === '(public)';
    if (!isAuthenticated && !inPublicGroup) router.replace('/(public)/login');
    if (isAuthenticated && inPublicGroup) router.replace('/(protected)/(tabs)');
  }, [isAuthenticated, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;

  return (
    <AuthProvider>
      <FieldOpsProvider>
        <AuthGate />
      </FieldOpsProvider>
    </AuthProvider>
  );
}
