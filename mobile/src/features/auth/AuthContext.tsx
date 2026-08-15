import React, { createContext, useCallback, useContext, useState } from 'react';

interface User { id: string; name: string; email: string; role: string }
interface AuthState { user: User | null; token: string | null; isAuthenticated: boolean }
interface AuthContextValue extends AuthState { signIn: (email: string, password: string) => Promise<void>; signOut: () => void; isLoading: boolean }

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ user: null, token: null, isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setAuthState({ user: { id: 'usr-carlos', name: 'Carlos Henrique Silva', email: email || 'tecnico@fieldops.local', role: 'Técnico' }, token: 'mock-token-fieldops', isAuthenticated: true });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => setAuthState({ user: null, token: null, isAuthenticated: false }), []);
  return <AuthContext.Provider value={{ ...authState, signIn, signOut, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
