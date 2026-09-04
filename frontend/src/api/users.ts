import { apiRequest } from '@/api/client'
import { UserRole, UserStatus } from '@/types/domain'

type BackendRole = 'ADMINISTRATOR' | 'SUPERVISOR' | 'TECHNICIAN'

interface BackendUser {
  id: number
  name: string
  email: string
  role: BackendRole
  status: UserStatus
  phone: string | null
  version: number
}

interface BackendPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ManagedUser {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
  phone: string
  version: number
}

export interface UserInput {
  name: string
  email: string
  password?: string
  role: UserRole
  phone: string
}

export interface UserPage {
  content: ManagedUser[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function backendRole(role: UserRole): BackendRole {
  return role === UserRole.ADMIN ? 'ADMINISTRATOR' : role
}

function managedUser(user: BackendUser): ManagedUser {
  const role = user.role === 'ADMINISTRATOR'
    ? UserRole.ADMIN
    : user.role === 'SUPERVISOR' ? UserRole.SUPERVISOR : UserRole.TECHNICIAN
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    status: user.status,
    phone: user.phone ?? '',
    version: user.version,
  }
}

function payload(input: UserInput) {
  return { ...input, role: backendRole(input.role), password: input.password || undefined }
}

export const usersApi = {
  async list(filters: { query: string; role: UserRole | ''; status: UserStatus | ''; page: number; size: number; sort: string }) {
    const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size), sort: filters.sort })
    if (filters.query.trim()) params.set('query', filters.query.trim())
    if (filters.role) params.set('role', backendRole(filters.role))
    if (filters.status) params.set('status', filters.status)
    const result = await apiRequest<BackendPage<BackendUser>>(`/api/v1/users?${params}`)
    return { ...result, content: result.content.map(managedUser) } satisfies UserPage
  },

  async create(input: UserInput) {
    return managedUser(await apiRequest<BackendUser>('/api/v1/users', {
      method: 'POST', body: JSON.stringify(payload(input)),
    }))
  },

  async update(id: number, input: UserInput) {
    return managedUser(await apiRequest<BackendUser>(`/api/v1/users/${id}`, {
      method: 'PUT', body: JSON.stringify(payload(input)),
    }))
  },

  async updateStatus(id: number, status: UserStatus.ACTIVE | UserStatus.INACTIVE) {
    return managedUser(await apiRequest<BackendUser>(`/api/v1/users/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }))
  },

  async emailAvailable(email: string, excludeId?: number) {
    const params = new URLSearchParams({ email })
    if (excludeId !== undefined) params.set('excludeId', String(excludeId))
    return (await apiRequest<{ available: boolean }>(`/api/v1/users/email-availability?${params}`)).available
  },
}
