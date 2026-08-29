// API client — configure base URL via environment or app config
import { tokenStorage } from '@/infrastructure/storage/tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';
const REFRESH_PATH = '/api/v1/auth/refresh';

interface RequestOptions extends RequestInit {
  token?: string;
  /** Internal: marks the retry issued after a successful token refresh. */
  isRetry?: boolean;
}

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export type SessionEvent =
  | { type: 'renewed'; accessToken: string }
  | { type: 'expired' };

type SessionListener = (event: SessionEvent) => void;

const sessionListeners = new Set<SessionListener>();

// Single-flight refresh: while one /auth/refresh is in flight, every 401 shares
// the same promise instead of firing a parallel refresh.
let refreshInFlight: Promise<string> | null = null;

/**
 * Subscribes to session changes driven by the 401 interceptor. UI layers use this
 * to keep their token state in sync and to sign out when the session dies.
 *
 * @returns an unsubscribe function.
 */
export function onSessionChanged(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function emitSessionEvent(event: SessionEvent): void {
  sessionListeners.forEach((listener) => listener(event));
}

async function requestAccessToken(): Promise<string> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token stored');
  }

  const response = await fetch(`${BASE_URL}${REFRESH_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error(`Refresh failed: API ${response.status}`);
  }

  const data = (await response.json()) as RefreshResponse;
  // The refresh token itself is not rotated by the API, so it is kept as-is.
  await tokenStorage.saveTokens(data.accessToken, refreshToken);
  return data.accessToken;
}

function renewAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = requestAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function handleUnauthorized<T>(path: string, options: RequestOptions): Promise<T> {
  try {
    const accessToken = await renewAccessToken();
    emitSessionEvent({ type: 'renewed', accessToken });
    // Transparent retry: the caller never sees the 401.
    return request<T>(path, { ...options, token: accessToken, isRetry: true });
  } catch {
    await tokenStorage.clearTokens();
    emitSessionEvent({ type: 'expired' });
    throw new Error('API 401: session expired');
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, isRetry, ...init } = options;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401 && token && !isRetry && path !== REFRESH_PATH) {
    return handleUnauthorized<T>(path, options);
  }

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`API ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),
};
