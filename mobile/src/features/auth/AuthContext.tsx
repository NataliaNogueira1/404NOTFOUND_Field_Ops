import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { apiClient, onSessionChanged } from '@/infrastructure/api/client';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
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
          });
        } catch {
          // If /me fails (network, CORS, etc), still restore session optimistically.
          // A 401 on a later request will trigger sign-out.
          setAuthState({
            user: null,
            token: storedToken,
            isAuthenticated: true,
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
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Sign Out ────────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    await tokenStorage.clearTokens();
    setAuthState({ user: null, token: null, isAuthenticated: false });
  }, []);

  // ─── Track transparent renewals from the 401 interceptor ─────────────────────
  // The interceptor refreshes the token below the UI layer; these events keep the
  // in-memory state in sync and drop the session when the refresh token dies.
  // Locally stored (offline) data survives an expiry — only the session is reset.

  useEffect(() => {
    return onSessionChanged((event) => {
      if (event.type === 'renewed') {
        setAuthState((state) =>
          state.token ? { ...state, token: event.accessToken } : state,
        );
      } else {
        setAuthState({ user: null, token: null, isAuthenticated: false });
      }
    });
  }, []);

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
