import { apiRequest } from '@/api/client'

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface ManagedClient {
  id: string
  name: string
  legalName: string
  document: string
  email: string
  phone: string
  status: ClientStatus
  activeSitesCount: number
  version: number
}

export interface ClientInput {
  name: string
  legalName: string
  document: string
  email: string
  phone: string
}

interface BackendClient extends Omit<ManagedClient, 'id' | 'legalName' | 'document' | 'email' | 'phone'> {
  id: number
  legalName: string | null
  document: string | null
  email: string | null
  phone: string | null
}

interface BackendPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function normalize(client: BackendClient): ManagedClient {
  return {
    ...client,
    id: String(client.id),
    legalName: client.legalName ?? '',
    document: client.document ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
  }
}

function payload(input: ClientInput) {
  return {
    name: input.name,
    legalName: input.legalName || null,
    document: input.document || null,
    email: input.email || null,
    phone: input.phone || null,
  }
}

export const clientsApi = {
  async list(filters: { name: string; status: ClientStatus | ''; page: number; size: number }) {
    const params = new URLSearchParams({
      page: String(filters.page), size: String(filters.size), sort: 'name,asc',
    })
    if (filters.name.trim()) params.set('name', filters.name.trim())
    if (filters.status) params.set('status', filters.status)
    const result = await apiRequest<BackendPage<BackendClient>>(`/api/v1/clients?${params}`)
    return { ...result, content: result.content.map(normalize) }
  },

  async get(id: string) {
    return normalize(await apiRequest<BackendClient>(`/api/v1/clients/${id}`))
  },

  async create(input: ClientInput) {
    return normalize(await apiRequest<BackendClient>('/api/v1/clients', {
      method: 'POST', body: JSON.stringify(payload(input)),
    }))
  },

  async update(id: string, input: ClientInput) {
    return normalize(await apiRequest<BackendClient>(`/api/v1/clients/${id}`, {
      method: 'PUT', body: JSON.stringify(payload(input)),
    }))
  },

  async updateStatus(id: string, status: ClientStatus) {
    return normalize(await apiRequest<BackendClient>(`/api/v1/clients/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }))
  },
}
