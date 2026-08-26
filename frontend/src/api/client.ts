const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const TOKEN_KEY = 'fieldops:access-token'
let unauthorizedHandler: (() => void) | null = null

export interface ApiErrorBody {
  timestamp?: string
  status: number
  code: string
  message: string
  path?: string
  fieldErrors?: { field: string; message: string }[]
}

export class ApiError extends Error {
  status: number
  code: string
  fieldErrors: { field: string; message: string }[]

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.status = body.status
    this.code = body.code
    this.fieldErrors = body.fieldErrors ?? []
  }
}

function storageAvailable() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export const tokenStorage = {
  get() {
    return storageAvailable() ? window.sessionStorage.getItem(TOKEN_KEY) : null
  },
  set(token: string) {
    if (storageAvailable()) window.sessionStorage.setItem(TOKEN_KEY, token)
  },
  clear() {
    if (storageAvailable()) window.sessionStorage.removeItem(TOKEN_KEY)
  },
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const body = text ? JSON.parse(text) : null
  if (!response.ok) {
    throw new ApiError(body ?? { status: response.status, code: 'HTTP_ERROR', message: 'Falha na comunicacao com a API.' })
  }
  return body as T
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const token = tokenStorage.get()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers })
    return await parseResponse<T>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 && token) unauthorizedHandler?.()
      throw error
    }
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Nao foi possivel conectar ao servidor.' })
  }
}
