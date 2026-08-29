import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { tokenStorage } from '@/services/auth/tokenStorage'

import { httpClient } from './httpClient'

const BASE_URL = 'http://localhost:8080'
const REFRESH_URL = `${BASE_URL}/api/v1/auth/refresh`

const fetchMock = vi.fn()

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status < 400,
    status,
    statusText: 'HTTP ' + status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response
}

function requestUrl(call: number): string {
  return fetchMock.mock.calls[call][0] as string
}

function requestHeaders(call: number): Record<string, string> {
  return fetchMock.mock.calls[call][1].headers as Record<string, string>
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  tokenStorage.saveTokens('access-1', 'refresh-1')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('httpClient', () => {
  it('sends the stored token as a Bearer credential', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ value: 42 }))

    const data = await httpClient.get<{ value: number }>('/api/v1/things')

    expect(data).toEqual({ value: 42 })
    expect(requestHeaders(0).Authorization).toBe('Bearer access-1')
  })

  it('retries the original request with the new token after a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHORIZED' }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'access-2', expiresIn: 28800 }))
      .mockResolvedValueOnce(jsonResponse({ value: 42 }))

    const data = await httpClient.get<{ value: number }>('/api/v1/things')

    expect(data).toEqual({ value: 42 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(requestUrl(1)).toBe(REFRESH_URL)
    expect(requestHeaders(2).Authorization).toBe('Bearer access-2')
    expect(tokenStorage.getAccessToken()).toBe('access-2')
    expect(tokenStorage.getRefreshToken()).toBe('refresh-1')
  })

  it('refreshes once when several requests fail with 401 simultaneously', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHORIZED' }, 401))
      .mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHORIZED' }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'access-2', expiresIn: 28800 }))
      .mockResolvedValueOnce(jsonResponse({ value: 1 }))
      .mockResolvedValueOnce(jsonResponse({ value: 2 }))

    const [first, second] = await Promise.all([
      httpClient.get<{ value: number }>('/api/v1/things/1'),
      httpClient.get<{ value: number }>('/api/v1/things/2'),
    ])

    expect(first).toEqual({ value: 1 })
    expect(second).toEqual({ value: 2 })
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => url === REFRESH_URL)
    expect(refreshCalls).toHaveLength(1)
  })

  it('clears the session and redirects to login when the refresh fails', async () => {
    const assign = vi.fn()
    vi.stubGlobal('window', {
      location: { pathname: '/app/inspections', assign },
      dispatchEvent: vi.fn(),
    })

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHORIZED' }, 401))
      .mockResolvedValueOnce(jsonResponse({ code: 'INVALID_REFRESH_TOKEN' }, 401))

    await expect(httpClient.get('/api/v1/things')).rejects.toThrow('session expired')

    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('does not intercept a 401 from the login endpoint itself', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }, 401),
    )

    await expect(
      httpClient.post('/api/v1/auth/login', { email: 'x@fieldops.com', password: 'wrong' }),
    ).rejects.toThrow('API 401: Invalid credentials')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces the API error message for non-401 failures', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: 'NOT_FOUND', message: 'Resource not found' }, 404),
    )

    await expect(httpClient.get('/api/v1/things/999')).rejects.toThrow('API 404: Resource not found')
  })
})
