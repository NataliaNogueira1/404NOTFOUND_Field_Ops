import { useEffect, useState } from 'react'

/**
 * Rotates an index through `count` items on a fixed interval (PBI-274).
 *
 * Returns the index currently active; the caller renders the item and animates
 * the transition. The interval is cleared on unmount and whenever its inputs
 * change, so no timer leaks. A count of 0 or 1 (or a non-positive interval)
 * never schedules an interval, keeping the single-item case static.
 */
export function useRotatingIndex(count: number, intervalMs: number): number {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (count <= 1 || intervalMs <= 0) return

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [count, intervalMs])

  // Guard against a shrinking list leaving the index out of range.
  return count > 0 ? index % count : 0
}
