import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { apiClient, onSessionChanged } from '@/infrastructure/api/client';
import { getDatabase } from '@/infrastructure/database';
import { InspectionRepository } from '@/infrastructure/database/repositories';
import { biometricStorage, tokenStorage } from '@/infrastructure/storage/tokenStorage';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** Session expired, but local (offline) data keeps the user in the app, read-only. */
  isOfflineLimited: boolean;
  /**
   * The user is authenticated and tokens are valid, but the session is currently
   * locked behind a biometric prompt (e.g. app returned to foreground).
   */
  isBiometricLocked: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Called after a successful biometric prompt to lift the lock.
   * Also used when biometric is unavailable and the user falls back to password.
   */
  unlockSession: () => void;
  /**
   * Puts the session back into the biometric-locked state (called when the app
   * moves to the background while biometric unlock is enabled).
   */
  lockSession: () => void;
  isLoading: boolean;
  isHydrating: boolean;
}

interface LoginApiResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

interface MeApiResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Whether any inspection is cached in the local database — the condition for
 * keeping the user in the app (limited offline mode) after the session dies.
 * Never throws: a broken database simply means "no offline data".
 */
async function hasLocalInspections(): Promise<boolean> {
  try {
    const db = await getDatabase();
    const inspections = await new InspectionRepository(db).getAll();
    return inspections.length > 0;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isOfflineLimited: false,
    isBiometricLocked: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  // ─── Hydrate session from SecureStore on app start ───────────────────────────

  useEffect(() => {
    async function hydrate() {
      try {
        const storedToken = await tokenStorage.getAccessToken();
        if (!storedToken) return;

        // If the user opted in to biometric unlock, start in locked state so
        // the biometric prompt fires before any protected data is displayed.
        const biometricEnabled = await biometricStorage.isEnabled();

        // Try to validate the token by calling /auth/me
        try {
          const userResponse = await apiClient.get<MeApiResponse>(
            '/api/v1/auth/me',
            storedToken,
          );

          setAuthState({
            user: {
              id: String(userResponse.id),
              name: userResponse.name,
              email: userResponse.email,
              role: userResponse.role,
            },
            token: storedToken,
            isAuthenticated: true,
            isOfflineLimited: false,
            isBiometricLocked: biometricEnabled,
          });
        } catch {
          // If /me fails (network, CORS, etc), still restore session optimistically.
          // A 401 on a later request will trigger sign-out.
          setAuthState({
            user: null,
            token: storedToken,
            isAuthenticated: true,
            isOfflineLimited: false,
            isBiometricLocked: biometricEnabled,
          });
        }
      } catch {
        await tokenStorage.clearTokens();
      } finally {
        setIsHydrating(false);
      }
    }

    hydrate();
  }, []);

  // ─── Sign In ─────────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<LoginApiResponse>(
        '/api/v1/auth/login',
        { email, password },
      );

      await tokenStorage.saveTokens(response.accessToken, response.refreshToken);

      // After a fresh login the session is never biometric-locked — the user
      // just proved their identity with their password.
      setAuthState({
        user: {
          id: String(response.user.id),
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
        },
        token: response.accessToken,
        isAuthenticated: true,
        isOfflineLimited: false,
        isBiometricLocked: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Sign Out ────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    await tokenStorage.clearTokens();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isOfflineLimited: false,
      isBiometricLocked: false,
    });
  }, []);

  // ─── Biometric lock / unlock ──────────────────────────────────────────────────

  /**
   * Lifts the biometric gate. Called either after a successful biometric prompt
   * or when the user chooses the password fallback (they'll be sent to login).
   */
  const unlockSession = useCallback(() => {
    setAuthState((prev) => ({ ...prev, isBiometricLocked: false }));
  }, []);

  /**
   * Re-locks the session when the app goes to the background (only meaningful
   * when biometric unlock is enabled — AuthGate checks this before calling).
   */
  const lockSession = useCallback(() => {
    setAuthState((prev) => {
      // Only lock if there is an active, non-expired session.
      if (!prev.isAuthenticated || prev.isOfflineLimited) return prev;
      return { ...prev, isBiometricLocked: true };
    });
  }, []);

  // ─── Handle session expiry from the 401 interceptor ──────────────────────────

  const handleSessionExpired = useCallback(async () => {
    if (await hasLocalInspections()) {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isOfflineLimited: true,
        isBiometricLocked: false,
      });
      return;
    }
    await tokenStorage.clearTokens();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isOfflineLimited: false,
      isBiometricLocked: false,
    });
  }, []);

  // ─── Track transparent renewals from the 401 interceptor ─────────────────────
  // The interceptor refreshes the token below the UI layer; these events keep the
  // in-memory state in sync and drop the session when the refresh token dies.

  useEffect(() => {
    return onSessionChanged((event) => {
      if (event.type === 'renewed') {
        setAuthState((state) =>
          state.token ? { ...state, token: event.accessToken } : state,
        );
        return;
      }
      void handleSessionExpired();
    });
  }, [handleSessionExpired]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signOut,
        unlockSession,
        lockSession,
        isLoading,
        isHydrating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
