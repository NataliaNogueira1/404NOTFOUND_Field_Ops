import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', { value: ResizeObserverMock })

const store = new Map<string, string>()

const localStorageMock: Storage = {
  getItem: key => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: key => store.delete(key),
  clear: () => store.clear(),
  key: index => Array.from(store.keys())[index] ?? null,
  get length() {
    return store.size
  },
}

beforeEach(() => {
  store.clear()
  vi.stubGlobal('localStorage', localStorageMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})
