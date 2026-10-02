import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { tokenStorage } from '@/services/auth/tokenStorage'

import { httpClient } from './httpClient'

const REFRESH_PATH = '/api/v1/auth/refresh'

// The client prefixes every request with VITE_API_URL, so assertions match on
// the path suffix rather than an absolute URL to stay independent of the base.
function isRefreshCall(url: unknown): boolean {
  return String(url).endsWith(REFRESH_PATH)
}

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
  return Object.fromEntries(new Headers(fetchMock.mock.calls[call][1].headers).entries())
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
    expect(requestHeaders(0).authorization).toBe('Bearer access-1')
  })

  it('retries the original request with the new token after a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHORIZED' }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'access-2', expiresIn: 28800 }))
      .mockResolvedValueOnce(jsonResponse({ value: 42 }))

    const data = await httpClient.get<{ value: number }>('/api/v1/things')

    expect(data).toEqual({ value: 42 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(isRefreshCall(requestUrl(1))).toBe(true)
    expect(requestHeaders(2).authorization).toBe('Bearer access-2')
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
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => isRefreshCall(url))
    expect(refreshCalls).toHaveLength(1)
  })

  it('clears the session and redirects to login when the refresh fails', async () => {
    window.history.pushState({}, '', '/login')
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ code: 'UNAUTHORIZED' }, 401))
      .mockResolvedValueOnce(jsonResponse({ code: 'INVALID_REFRESH_TOKEN' }, 401))

    await expect(httpClient.get('/api/v1/things')).rejects.toMatchObject({ status: 401, code: 'SESSION_EXPIRED' })

    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('does not intercept a 401 from the login endpoint itself', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }, 401))

    await expect(
      httpClient.post('/api/v1/auth/login', { email: 'x@fieldops.com', password: 'wrong' }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces the API error message for non-401 failures', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: 'NOT_FOUND', message: 'Resource not found' }, 404))

    await expect(httpClient.get('/api/v1/things/999')).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
  })
})
