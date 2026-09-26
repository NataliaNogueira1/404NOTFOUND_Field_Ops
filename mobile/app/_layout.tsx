import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthProvider, BiometricLockScreen, useAuth } from '@/features/auth';
import { FieldOpsProvider } from '@/features/fieldops';
import { ConnectivityProvider } from '@/infrastructure/connectivity';
import { DatabaseProvider } from '@/infrastructure/database/DatabaseProvider';
import { biometricStorage } from '@/infrastructure/storage/tokenStorage';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const {
    isAuthenticated,
    isHydrating,
    isOfflineLimited,
    isBiometricLocked,
    lockSession,
  } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // ─── Navigation guard ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isHydrating) return;

    const inPublicGroup = segments[0] === '(public)';

    if (!isAuthenticated && !isOfflineLimited && !inPublicGroup) {
      router.replace('/(public)/login');
      return;
    }
    if (isAuthenticated && inPublicGroup) {
      router.replace('/(protected)/(tabs)');
    }
  }, [isAuthenticated, isHydrating, isOfflineLimited, segments, router]);

  // ─── AppState: lock session when app goes to background ────────────────────
  // We only lock when:
  //   1. The user has an active authenticated session (not offline-limited, not
  //      already locked).
  //   2. The user opted in to biometric unlock (stored in SecureStore).
  // The lock is cleared when the user passes the biometric prompt inside
  // BiometricLockScreen, which calls unlockSession().
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const wasActive = appState.current === 'active';
        const goingToBackground =
          nextState === 'background' || nextState === 'inactive';

        if (wasActive && goingToBackground && isAuthenticated && !isOfflineLimited) {
          // Check preference asynchronously; if enabled, lock immediately.
          void biometricStorage.isEnabled().then((enabled) => {
            if (enabled) lockSession();
          });
        }

        appState.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [isAuthenticated, isOfflineLimited, lockSession]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (isHydrating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  // Biometric lock gate: renders over everything while the session is locked.
  // Tokens are still valid — we're just requiring biometric confirmation before
  // the user can see any data.
  if (isBiometricLocked) {
    return <BiometricLockScreen />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf') });
  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <ConnectivityProvider>
        <DatabaseProvider>
          <AuthProvider>
            <FieldOpsProvider>
              <AuthGate />
            </FieldOpsProvider>
          </AuthProvider>
        </DatabaseProvider>
      </ConnectivityProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
