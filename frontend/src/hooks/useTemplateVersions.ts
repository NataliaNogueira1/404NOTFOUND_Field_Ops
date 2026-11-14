import { useCallback, useEffect, useState } from 'react'
import { adminCatalogApi, type InspectionTemplateVersion } from '@/api/adminCatalog'

/**
 * Explicit load states for the published versions of an inspection template
 * (PBI-246, Part A). Modeled as a discriminated union so the versions modal
 * renders exactly one of loading / empty / error / ready without juggling
 * separate boolean flags.
 */
export type TemplateVersionsState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'ready'; versions: InspectionTemplateVersion[] }

interface UseTemplateVersions {
  state: TemplateVersionsState
  reload: () => void
}

/**
 * Loads the published version history of an inspection template for the
 * versions modal (PBI-246). It consumes the existing
 * adminCatalogApi.listTemplateVersions endpoint (no backend change) and owns
 * the loading/empty/error states. Passing `null` as the template id keeps the
 * hook idle (loading) so it only fetches once the modal is opened for a template.
 */
export function useTemplateVersions(templateId: string | null): UseTemplateVersions {
  const [state, setState] = useState<TemplateVersionsState>({ status: 'loading' })
  // Bumped to force a reload without changing the template id (retry button).
  const [reloadToken, setReloadToken] = useState(0)

  // Synchronize the modal with the versions endpoint. setState runs only from
  // the async callbacks (not synchronously in the effect body) so the fetch is
  // treated as the external system this effect subscribes to.
  useEffect(() => {
    if (!templateId) return

    let active = true

    adminCatalogApi
      .listTemplateVersions(templateId)
      .then((versions) => {
        if (!active) return
        setState(versions.length === 0 ? { status: 'empty' } : { status: 'ready', versions })
      })
      .catch(() => {
        if (!active) return
        setState({ status: 'error' })
      })

    return () => {
      active = false
    }
  }, [templateId, reloadToken])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setReloadToken((token) => token + 1)
  }, [])

  return { state, reload }
}
