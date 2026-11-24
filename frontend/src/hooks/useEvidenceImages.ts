import { useEffect, useState } from 'react'
import { inspectionReviewApi } from '@/api/inspectionReview'

export type EvidenceImage = { status: 'loading' } | { status: 'ready'; src: string } | { status: 'error' }

/**
 * Loads every evidence image of the review up front, so thumbnails show the photo instead of a
 * placeholder and the lightbox opens with the image already resolved. Blob URLs are revoked when
 * the list changes or the page unmounts.
 */
export function useEvidenceImages(contentUrls: string[]) {
  const key = contentUrls.join('|')
  const [images, setImages] = useState<Record<string, EvidenceImage>>({})

  useEffect(() => {
    const urls = key ? key.split('|') : []
    let active = true
    const created: string[] = []
    for (const contentUrl of urls) {
      inspectionReviewApi.loadEvidenceImage(contentUrl)
        .then(src => {
          if (src.startsWith('blob:')) created.push(src)
          if (!active) { if (src.startsWith('blob:')) URL.revokeObjectURL(src); return }
          setImages(current => ({ ...current, [contentUrl]: { status: 'ready', src } }))
        })
        .catch(() => { if (active) setImages(current => ({ ...current, [contentUrl]: { status: 'error' } })) })
    }
    return () => { active = false; created.forEach(src => URL.revokeObjectURL(src)); setImages({}) }
  }, [key])

  return (contentUrl: string): EvidenceImage => images[contentUrl] ?? { status: 'loading' }
}
