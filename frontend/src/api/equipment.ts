import { apiRequest } from '@/api/client'

export enum EquipmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export interface ManagedEquipment {
  id: string
  siteId: string
  siteName: string
  clientId: string
  name: string
  assetNumber: string
  serialNumber: string
  manufacturer: string
  model: string
  description: string
  qrCode: string
  status: EquipmentStatus
  installedAt: string
  version: number
}

export interface EquipmentInput {
  siteId: string
  name: string
  assetNumber: string
  serialNumber: string
  manufacturer: string
  model: string
  description: string
  qrCode: string
  status: EquipmentStatus
  installedAt: string
}

interface BackendEquipment extends Omit<ManagedEquipment,
  'id' | 'siteId' | 'clientId' | 'assetNumber' | 'serialNumber' | 'manufacturer' | 'model' | 'description' | 'installedAt'> {
  id: number
  siteId: number
  clientId: number
  assetNumber: string | null
  serialNumber: string | null
  manufacturer: string | null
  model: string | null
  description: string | null
  installedAt: string | null
}

interface BackendPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

function normalize(item: BackendEquipment): ManagedEquipment {
  return {
    ...item,
    id: String(item.id), siteId: String(item.siteId), clientId: String(item.clientId),
    assetNumber: item.assetNumber ?? '', serialNumber: item.serialNumber ?? '',
    manufacturer: item.manufacturer ?? '', model: item.model ?? '',
    description: item.description ?? '', installedAt: item.installedAt ?? '',
  }
}

function payload(input: EquipmentInput) {
  return {
    ...input,
    assetNumber: input.assetNumber || null, serialNumber: input.serialNumber || null,
    manufacturer: input.manufacturer || null, model: input.model || null,
    description: input.description || null, installedAt: input.installedAt || null,
  }
}

export const equipmentApi = {
  async list(filters: { name?: string; siteId: string; status: EquipmentStatus | ''; page: number; size: number; sort?: string }) {
    const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size), sort: filters.sort ?? 'name,asc' })
    if (filters.name?.trim()) params.set('name', filters.name.trim())
    if (filters.siteId) params.set('siteId', filters.siteId)
    if (filters.status) params.set('status', filters.status)
    const result = await apiRequest<BackendPage<BackendEquipment>>(`/api/v1/equipment?${params}`)
    return { ...result, content: result.content.map(normalize) }
  },

  async listBySite(siteId: string) {
    const result = await apiRequest<BackendEquipment[]>(`/api/v1/sites/${siteId}/equipment`)
    return result.map(normalize)
  },

  async get(id: string) {
    return normalize(await apiRequest<BackendEquipment>(`/api/v1/equipment/${id}`))
  },

  async getByQrCode(qrCode: string) {
    return normalize(await apiRequest<BackendEquipment>(`/api/v1/equipment/by-qr/${encodeURIComponent(qrCode)}`))
  },

  async create(input: EquipmentInput) {
    return normalize(await apiRequest<BackendEquipment>('/api/v1/equipment', {
      method: 'POST', body: JSON.stringify(payload(input)),
    }))
  },

  async update(id: string, input: EquipmentInput) {
    return normalize(await apiRequest<BackendEquipment>(`/api/v1/equipment/${id}`, {
      method: 'PUT', body: JSON.stringify(payload(input)),
    }))
  },

  async updateStatus(id: string, status: EquipmentStatus) {
    return normalize(await apiRequest<BackendEquipment>(`/api/v1/equipment/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }))
  },
}
