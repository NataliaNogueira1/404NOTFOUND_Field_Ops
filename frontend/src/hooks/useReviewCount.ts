import { useEffect, useState } from 'react'
import { adminCatalogApi } from '@/api/adminCatalog'

/** Polling interval in milliseconds — refreshes the count every 60 seconds. */
const POLL_INTERVAL_MS = 60_000

/**
 * Returns the live count of inspections awaiting supervisor review
 * (status SUBMITTED or UNDER_REVIEW).
 *
 * The count is fetched on mount and refreshed every 60 seconds.
 * Returns `null` while the first request is in-flight.
 */
export function useReviewCount(): number | null {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      try {
        const total = await adminCatalogApi.countReviewQueue()
        if (!cancelled) setCount(total)
      } catch {
        // Silently ignore — badge simply won't render until next poll succeeds
      }
    }

    void fetch()
    const interval = window.setInterval(() => void fetch(), POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  return count
}
