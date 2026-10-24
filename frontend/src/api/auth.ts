import { apiRequest, ApiError } from '@/api/client'
import { UserRole, type User } from '@/types/domain'

export type BackendRole = 'TECHNICIAN' | 'SUPERVISOR' | 'ADMINISTRATOR'

export interface BackendUser {
  id: number
  name: string
  email: string
  role: BackendRole
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: BackendUser
}

export function normalizeRole(role: BackendRole): UserRole {
  if (role === 'ADMINISTRATOR') return UserRole.ADMIN
  if (role === 'SUPERVISOR') return UserRole.SUPERVISOR
  return UserRole.TECHNICIAN
}

export function normalizeUser(user: BackendUser): User {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    phone: '',
    active: true,
  }
}

export const authApi = {
  login(email: string, password: string) {
    return apiRequest<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  me() {
    return apiRequest<BackendUser>('/api/v1/auth/me')
  },
  /**
   * Requests a self-service password-reset e-mail.
   *
   * The server is intentionally silent — it always returns 204 whether or not
   * the address is registered. A 404 from the backend is also treated as
   * success here to avoid leaking whether an e-mail exists.
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await apiRequest<void>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    } catch (error) {
      // 404 = server chose to stay silent on unknown addresses → treat as success.
      if (error instanceof ApiError && error.status === 404) return
      throw error
    }
  },
}
