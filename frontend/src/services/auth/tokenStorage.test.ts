import { describe, expect, it } from 'vitest'

import { tokenStorage } from './tokenStorage'

describe('tokenStorage', () => {
  it('saves and reads both tokens', () => {
    tokenStorage.saveTokens('access-1', 'refresh-1')

    expect(tokenStorage.getAccessToken()).toBe('access-1')
    expect(tokenStorage.getRefreshToken()).toBe('refresh-1')
  })

  it('clears both tokens', () => {
    tokenStorage.saveTokens('access-1', 'refresh-1')
    tokenStorage.clearTokens()

    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('returns null when nothing was stored', () => {
    expect(tokenStorage.getAccessToken()).toBeNull()
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })
})
