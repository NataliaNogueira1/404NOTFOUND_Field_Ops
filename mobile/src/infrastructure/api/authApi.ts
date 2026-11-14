// Auth-related API calls that do not require an active session (public endpoints).
import { apiClient } from './client';

/**
 * Sends a password-reset request to the server.
 *
 * The API sends an e-mail to the address when it belongs to an active user.
 * For security reasons the server never reveals whether the address exists,
 * so this function always resolves (204 → `undefined`) regardless of that.
 *
 * Throws only on network/connectivity errors (5xx, timeout, etc.).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await apiClient.post<void>('/api/v1/auth/forgot-password', { email });
  } catch (error) {
    // 404 is expected when the backend treats "unknown e-mail" as no-op.
    // 422 from field validation should still propagate so the caller can surface
    // a validation message.  All other errors (network, 5xx) bubble up.
    if (error instanceof Error && error.message.startsWith('API 404')) {
      return; // treat as success — server stays silent on unknown addresses
    }
    throw error;
  }
}
