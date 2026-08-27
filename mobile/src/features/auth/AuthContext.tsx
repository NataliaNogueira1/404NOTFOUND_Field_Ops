import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { apiClient, onSessionChanged } from '@/infrastructure/api/client';
import { getDatabase } from '@/infrastructure/database';
import { InspectionRepository } from '@/infrastructure/database/repositories';
import { tokenStorage } from '@/infrastructure/storage/tokenStorage';

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
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);

  // ─── Hydrate session from SecureStore on app start ───────────────────────────

  useEffect(() => {
    async function hydrate() {
      try {
        const storedToken = await tokenStorage.getAccessToken();
        if (!storedToken) return;

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
          });
        } catch {
          // If /me fails (network, CORS, etc), still restore session optimistically.
          // A 401 on a later request will trigger sign-out.
          setAuthState({
            user: null,
            token: storedToken,
            isAuthenticated: true,
            isOfflineLimited: false,
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
    });
  }, []);

  const handleSessionExpired = useCallback(async () => {
    if (await hasLocalInspections()) {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isOfflineLimited: true,
      });
      return;
    }
    await tokenStorage.clearTokens();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isOfflineLimited: false,
    });
  }, []);

  // ─── Track transparent renewals from the 401 interceptor ─────────────────────
  // The interceptor refreshes the token below the UI layer; these events keep the
  // in-memory state in sync and drop the session when the refresh token dies.
  // When the session dies but inspections are cached locally, the user stays in
  // the app in a limited offline mode instead of being kicked to the login screen.

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
    <AuthContext.Provider value={{ ...authState, signIn, signOut, isLoading, isHydrating }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
