import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRotatingIndex } from '@/hooks/useRotatingIndex'

function Probe({ count, intervalMs }: { count: number; intervalMs: number }) {
  const index = useRotatingIndex(count, intervalMs)
  return <span data-testid="index">{index}</span>
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('useRotatingIndex', () => {
  it('starts at the first index', () => {
    render(<Probe count={5} intervalMs={4000} />)
    expect(screen.getByTestId('index').textContent).toBe('0')
  })

  it('advances on each interval tick', () => {
    render(<Probe count={5} intervalMs={4000} />)
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByTestId('index').textContent).toBe('1')
    act(() => vi.advanceTimersByTime(4000))
    expect(screen.getByTestId('index').textContent).toBe('2')
  })

  it('wraps around after the last index', () => {
    render(<Probe count={3} intervalMs={1000} />)
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByTestId('index').textContent).toBe('0')
  })

  it('clears the interval on unmount so no timer leaks', () => {
    const clearSpy = vi.spyOn(window, 'clearInterval')
    const { unmount } = render(<Probe count={5} intervalMs={4000} />)
    unmount()
    expect(clearSpy).toHaveBeenCalled()
  })

  it('never schedules an interval for a single item', () => {
    const setSpy = vi.spyOn(window, 'setInterval')
    render(<Probe count={1} intervalMs={4000} />)
    act(() => vi.advanceTimersByTime(12000))
    expect(screen.getByTestId('index').textContent).toBe('0')
    expect(setSpy).not.toHaveBeenCalled()
  })
})
