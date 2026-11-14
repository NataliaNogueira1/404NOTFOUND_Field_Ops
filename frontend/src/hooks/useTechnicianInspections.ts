import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/api/client'
import { mobileInspectionsApi, type TechnicianInspection } from '@/api/mobileInspections'

/** Discriminated state for the technician inspections pull: covers loading, error and ready. */
export type TechnicianInspectionsState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'ready'; inspections: TechnicianInspection[] }

interface TechnicianInspectionsResult {
  state: TechnicianInspectionsState
  reload: () => void
}

/**
 * Loads the inspections assigned to the authenticated technician from the real API
 * (GET /api/v1/mobile/inspections). Exposes a stable {@link reload} so screens can
 * retry after an error or refresh on demand. Empty data is a valid ready state.
 */
export function useTechnicianInspections(): TechnicianInspectionsResult {
  const [state, setState] = useState<TechnicianInspectionsState>({ type: 'loading' })

  const load = useCallback(async () => {
    setState({ type: 'loading' })
    try {
      const inspections = await mobileInspectionsApi.list()
      setState({ type: 'ready', inspections })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Não foi possível carregar as inspeções.'
      setState({ type: 'error', message })
    }
  }, [])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [load])

  const reload = useCallback(() => {
    void load()
  }, [load])

  return { state, reload }
}
