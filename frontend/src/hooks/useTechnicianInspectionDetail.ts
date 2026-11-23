import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/api/client'
import { mobileInspectionsApi, type TechnicianInspection } from '@/api/mobileInspections'

/** Discriminated state for a single technician inspection fetched by id. */
export type TechnicianInspectionDetailState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'ready'; inspection: TechnicianInspection }

interface TechnicianInspectionDetailResult {
  state: TechnicianInspectionDetailState
  reload: () => void
}

/**
 * Loads one inspection detail by id from the real API
 * (GET /api/v1/mobile/inspections/{id}). Unlike the list pull, this returns the
 * inspection in any status — including CANCELED — so the technician can read the
 * cancellation reason/author/date on the detail screen (#338). A 404/403 surfaces
 * as an error state the screen can retry.
 */
export function useTechnicianInspectionDetail(id: string): TechnicianInspectionDetailResult {
  const [state, setState] = useState<TechnicianInspectionDetailState>({ type: 'loading' })

  const load = useCallback(async () => {
    if (!id) {
      setState({ type: 'error', message: 'Inspeção não encontrada.' })
      return
    }
    setState({ type: 'loading' })
    try {
      const inspection = await mobileInspectionsApi.get(id)
      setState({ type: 'ready', inspection })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Não foi possível carregar a inspeção.'
      setState({ type: 'error', message })
    }
  }, [id])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [load])

  const reload = useCallback(() => {
    void load()
  }, [load])

  return { state, reload }
}
