import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function Probe() {
  const online = useOnlineStatus()
  return <span data-testid="status">{online ? 'online' : 'offline'}</span>
}

describe('useOnlineStatus', () => {
  it('returns true when navigator.onLine is true', () => {
    vi.stubGlobal('navigator', { onLine: true })
    render(<Probe />)
    expect(screen.getByTestId('status').textContent).toBe('online')
  })

  it('returns false when navigator.onLine is false', () => {
    vi.stubGlobal('navigator', { onLine: false })
    render(<Probe />)
    expect(screen.getByTestId('status').textContent).toBe('offline')
  })

  it('switches to offline when the "offline" window event fires', () => {
    vi.stubGlobal('navigator', { onLine: true })
    render(<Probe />)
    expect(screen.getByTestId('status').textContent).toBe('online')

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByTestId('status').textContent).toBe('offline')
  })

  it('switches back to online when the "online" window event fires', () => {
    vi.stubGlobal('navigator', { onLine: false })
    render(<Probe />)
    expect(screen.getByTestId('status').textContent).toBe('offline')

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.getByTestId('status').textContent).toBe('online')
  })
})
