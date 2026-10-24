import { useCallback, useEffect, useRef, useState } from 'react'
import { nonConformitiesApi } from '@/api/nonConformities'
import { inspectionReviewApi } from '@/api/inspectionReview'
import type { LightboxPhoto } from '@/components/feedback/Lightbox'

/**
 * Explicit load states for the non-conformity evidence gallery (PBI-255).
 * Modeled as a discriminated union so the NC detail view renders exactly one of
 * loading / empty / error / ready without juggling separate boolean flags.
 */
export type NonConformityEvidencesState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error' }
  | { status: 'ready'; photos: LightboxPhoto[] }

interface NonConformityEvidencesTarget {
  inspectionId: string
  inspectionItemSnapshotId: string | null
}

interface UseNonConformityEvidences {
  state: NonConformityEvidencesState
  /** Photos resolved for the lightbox (with blob `src`), empty until one is opened. */
  lightboxPhotos: LightboxPhoto[]
  /** Index of the open lightbox photo; -1 means the lightbox is closed. */
  openIndex: number
  reload: () => void
  openPhoto: (index: number) => void
  closePhoto: () => void
}

/**
 * Loads and manages the equipment photos linked to a non-conformity for the
 * supervisor/admin detail view (PBI-255). It reuses the authenticated evidence
 * download already used by the inspection review lightbox and owns the blob URL
 * lifecycle so object URLs are revoked when the lightbox closes or the component
 * unmounts.
 */
export function useNonConformityEvidences(
  target: NonConformityEvidencesTarget,
): UseNonConformityEvidences {
  const { inspectionId, inspectionItemSnapshotId } = target
  const [state, setState] = useState<NonConformityEvidencesState>({ status: 'loading' })
  const [lightboxPhotos, setLightboxPhotos] = useState<LightboxPhoto[]>([])
  const [openIndex, setOpenIndex] = useState(-1)
  // Bumped to force a reload without changing the target identity (retry button).
  const [reloadToken, setReloadToken] = useState(0)

  // Keep the thumbnail photos (empty src) so opening/retrying never depends on a
  // stale closure of the loaded state.
  const thumbnailsRef = useRef<LightboxPhoto[]>([])

  const releaseLightboxPhotos = useCallback(() => {
    setLightboxPhotos((current) => {
      current.forEach((photo) => {
        if (photo.src.startsWith('blob:')) URL.revokeObjectURL(photo.src)
      })
      return []
    })
  }, [])

  // Synchronize the gallery with the evidence endpoint. setState runs only from
  // the async callbacks (not synchronously in the effect body) so the fetch is
  // treated as the external system this effect subscribes to.
  useEffect(() => {
    let active = true

    nonConformitiesApi
      .loadEvidencePhotos(inspectionId, inspectionItemSnapshotId)
      .then((photos) => {
        if (!active) return
        thumbnailsRef.current = photos
        setState(photos.length === 0 ? { status: 'empty' } : { status: 'ready', photos })
      })
      .catch(() => {
        if (!active) return
        thumbnailsRef.current = []
        setState({ status: 'error' })
      })

    return () => {
      active = false
    }
  }, [inspectionId, inspectionItemSnapshotId, reloadToken])

  // Revoke any open blob URLs whenever the target changes or on unmount.
  useEffect(() => releaseLightboxPhotos, [inspectionId, inspectionItemSnapshotId, releaseLightboxPhotos])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setReloadToken((token) => token + 1)
  }, [])

  const openPhoto = useCallback(async (index: number) => {
    const photos = thumbnailsRef.current
    if (photos.length === 0) return
    // Download the authenticated binaries lazily, mirroring the review flow.
    const loaded = await Promise.all(
      photos.map(async (photo) => {
        try {
          return { ...photo, src: await inspectionReviewApi.loadEvidenceImage(photo.contentUrl ?? '') }
        } catch {
          return { ...photo, loadError: true }
        }
      }),
    )
    setLightboxPhotos(loaded)
    setOpenIndex(index)
  }, [])

  const closePhoto = useCallback(() => setOpenIndex(-1), [])

  return {
    state,
    lightboxPhotos,
    openIndex,
    reload,
    openPhoto: (index: number) => void openPhoto(index),
    closePhoto,
  }
}
