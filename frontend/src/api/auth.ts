import { apiRequest } from '@/api/client'
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
}
