// HTTP client for the web admin — the React/Vite counterpart of an Angular
// auth interceptor: every request carries the stored Bearer token, and a 401
// triggers a single-flight refresh followed by a transparent retry of the
// original request. When the refresh itself fails, the session is cleared and
// the user is sent back to login.

import { tokenStorage } from '@/services/auth/tokenStorage';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const REFRESH_PATH = '/api/v1/auth/refresh';
const LOGIN_PATH = '/api/v1/auth/login';

interface RequestOptions extends RequestInit {
  /** Internal: marks the retry issued after a successful token refresh. */
  isRetry?: boolean;
}

interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

// Single-flight refresh: while one /auth/refresh is in flight, every 401 shares
// the same promise — the pending-request queue from the auth story.
let refreshInFlight: Promise<string> | null = null;

async function requestAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
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
  tokenStorage.saveTokens(data.accessToken, refreshToken);
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

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

async function handleUnauthorized<T>(path: string, options: RequestOptions): Promise<T> {
  try {
    await renewAccessToken();
    // Transparent retry: the caller never sees the 401.
    return request<T>(path, { ...options, isRetry: true });
  } catch {
    tokenStorage.clearTokens();
    redirectToLogin();
    throw new Error('API 401: session expired');
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { isRetry, ...init } = options;
  const token = tokenStorage.getAccessToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  const interceptable = path !== REFRESH_PATH && path !== LOGIN_PATH;
  if (response.status === 401 && interceptable && !isRetry) {
    return handleUnauthorized<T>(path, options);
  }

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`API ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
