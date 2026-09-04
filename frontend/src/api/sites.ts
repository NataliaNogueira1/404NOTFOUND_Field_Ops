import { apiRequest } from '@/api/client'

export enum InspectionSiteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface ManagedInspectionSite {
  id: string
  clientId: string
  clientName: string
  name: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number | null
  longitude: number | null
  contactName: string
  contactPhone: string
  status: InspectionSiteStatus
  equipmentCount: number
  version: number
}

export interface InspectionSiteInput {
  clientId: string
  name: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number | null
  longitude: number | null
  contactName: string
  contactPhone: string
}

interface BackendSite extends Omit<ManagedInspectionSite,
  'id' | 'clientId' | 'description' | 'address' | 'city' | 'state' | 'zipCode' | 'contactName' | 'contactPhone'> {
  id: number
  clientId: number
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  contactName: string | null
  contactPhone: string | null
}

interface BackendPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function normalize(site: BackendSite): ManagedInspectionSite {
  return {
    ...site,
    id: String(site.id), clientId: String(site.clientId),
    description: site.description ?? '', address: site.address ?? '', city: site.city ?? '',
    state: site.state ?? '', zipCode: site.zipCode ?? '', contactName: site.contactName ?? '',
    contactPhone: site.contactPhone ?? '',
  }
}

function payload(input: InspectionSiteInput) {
  return {
    ...input,
    description: input.description || null, address: input.address || null,
    city: input.city || null, state: input.state || null, zipCode: input.zipCode || null,
    contactName: input.contactName || null, contactPhone: input.contactPhone || null,
  }
}

export const sitesApi = {
  async list(filters: { name: string; clientId: string; status: InspectionSiteStatus | ''; page: number; size: number }) {
    const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size), sort: 'name,asc' })
    if (filters.name.trim()) params.set('name', filters.name.trim())
    if (filters.clientId) params.set('clientId', filters.clientId)
    if (filters.status) params.set('status', filters.status)
    const result = await apiRequest<BackendPage<BackendSite>>(`/api/v1/sites?${params}`)
    return { ...result, content: result.content.map(normalize) }
  },

  async listByClient(clientId: string) {
    const result = await apiRequest<BackendSite[]>(`/api/v1/clients/${clientId}/sites`)
    return result.map(normalize)
  },

  async get(id: string) {
    return normalize(await apiRequest<BackendSite>(`/api/v1/sites/${id}`))
  },

  async create(input: InspectionSiteInput) {
    return normalize(await apiRequest<BackendSite>('/api/v1/sites', { method: 'POST', body: JSON.stringify(payload(input)) }))
  },

  async update(id: string, input: InspectionSiteInput) {
    return normalize(await apiRequest<BackendSite>(`/api/v1/sites/${id}`, { method: 'PUT', body: JSON.stringify(payload(input)) }))
  },

  async updateStatus(id: string, status: InspectionSiteStatus) {
    return normalize(await apiRequest<BackendSite>(`/api/v1/sites/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }))
  },
}
