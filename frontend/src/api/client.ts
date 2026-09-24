const API_URL = import.meta.env.VITE_API_URL ?? ''
const ACCESS_TOKEN_KEY = 'fieldops:access-token'
const REFRESH_TOKEN_KEY = 'fieldops:refresh-token'
const REFRESH_PATH = '/api/v1/auth/refresh'
const LOGIN_PATH = '/api/v1/auth/login'
let unauthorizedHandler: (() => void) | null = null
let refreshInFlight: Promise<string> | null = null

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
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export const tokenStorage = {
  get() {
    return this.getAccessToken()
  },
  set(token: string) {
    this.setAccessToken(token)
  },
  clear() {
    this.clearTokens()
  },
  getAccessToken() {
    return storageAvailable() ? window.localStorage.getItem(ACCESS_TOKEN_KEY) : null
  },
  getRefreshToken() {
    return storageAvailable() ? window.localStorage.getItem(REFRESH_TOKEN_KEY) : null
  },
  setAccessToken(token: string) {
    if (storageAvailable()) window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  saveTokens(accessToken: string, refreshToken: string) {
    if (!storageAvailable()) return
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clearTokens() {
    if (!storageAvailable()) return
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const body = text ? JSON.parse(text) : null
  if (!response.ok) {
    throw new ApiError({
      status: body?.status ?? response.status,
      code: body?.code ?? 'HTTP_ERROR',
      message: body?.message ?? 'Falha na comunicacao com a API.',
      path: body?.path,
      fieldErrors: body?.fieldErrors,
    })
  }
  return body as T
}

function expireSession() {
  tokenStorage.clearTokens()
  unauthorizedHandler?.()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    try {
      window.location.assign('/login')
    } catch {
      // jsdom cannot navigate; browsers will redirect normally.
    }
  }
}

async function requestRefreshToken() {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) throw new Error('No refresh token stored')

  const response = await fetch(`${API_URL}${REFRESH_PATH}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  const data = await parseResponse<{ accessToken: string; expiresIn: number }>(response)
  tokenStorage.saveTokens(data.accessToken, refreshToken)
  return data.accessToken
}

function renewAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = requestRefreshToken().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  return request<T>(path, options, false)
}

async function request<T>(path: string, options: RequestInit, isRetry: boolean): Promise<T> {
  const token = tokenStorage.get()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers })
    if (response.status === 401 && token && !isRetry && path !== REFRESH_PATH && path !== LOGIN_PATH) {
      try {
        await renewAccessToken()
        return request<T>(path, options, true)
      } catch {
        expireSession()
        throw new ApiError({ status: 401, code: 'SESSION_EXPIRED', message: 'Sessao expirada. Faca login novamente.' })
      }
    }
    return await parseResponse<T>(response)
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Nao foi possivel conectar ao servidor.' })
  }
}

export const httpClient = {
  get: <T>(path: string) => apiRequest<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
}
