import { Calendar, ChevronLeft, ChevronRight, MapPin, Tag, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface LightboxPhoto {
  /** URL or filename of the photo */
  src: string
  /** Label shown as the linked item (e.g. question text) */
  item: string
  /** ISO date string when the photo was captured */
  capturedAt?: string
  /** Human-readable coordinates or location name */
  location?: string
}

interface LightboxProps {
  photos: LightboxPhoto[]
  /** Index of the photo to open first; -1 or undefined means closed */
  initialIndex?: number
  onClose: () => void
}

/**
 * Full-screen lightbox with zoom, keyboard navigation and metadata panel.
 * Satisfies PBI-058 acceptance criteria:
 *  - Thumbnails are rendered by the parent (PhotoThumbnails helper is also exported)
 *  - Click opens lightbox with zoom
 *  - Previous / next navigation
 *  - Metadata: date, location, linked item
 */
export function Lightbox({ photos, initialIndex = 0, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)
  const [zoomed, setZoomed] = useState(false)

  const open = initialIndex >= 0 && photos.length > 0

  // Sync index when the caller opens a different photo
  useEffect(() => {
    if (initialIndex >= 0) {
      setIndex(initialIndex)
      setZoomed(false)
    }
  }, [initialIndex])

  const prev = useCallback(() => {
    setZoomed(false)
    setIndex(current => (current - 1 + photos.length) % photos.length)
  }, [photos.length])

  const next = useCallback(() => {
    setZoomed(false)
    setIndex(current => (current + 1) % photos.length)
  }, [photos.length])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') prev()
      else if (event.key === 'ArrowRight') next()
      else if (event.key === 'Escape') onClose()
      else if (event.key === '+' || event.key === '=') setZoomed(true)
      else if (event.key === '-') setZoomed(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, prev, next, onClose])

  if (!open) return null

  const photo = photos[Math.min(index, photos.length - 1)]
  if (!photo) return null
  const isUrl = photo.src.startsWith('http') || photo.src.startsWith('blob') || photo.src.startsWith('data')

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visualizador de fotografias"
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ backgroundColor: 'rgba(2, 6, 23, 0.97)' }}
    >
      {/* Top bar */}
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="truncate text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {index + 1} / {photos.length}
        </p>
        <p className="truncate text-sm font-semibold" style={{ color: 'white' }}>{photo.item}</p>
        <div className="flex items-center gap-2">
          <button
            aria-label={zoomed ? 'Reduzir zoom' : 'Aumentar zoom'}
            onClick={() => setZoomed(z => !z)}
            style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}
          >
            {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
          </button>
          <button
            aria-label="Fechar lightbox"
            onClick={onClose}
            style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="relative flex min-h-0 flex-1">
        {/* Prev button */}
        {photos.length > 1 && (
          <button
            aria-label="Foto anterior"
            onClick={prev}
            style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white', cursor: 'pointer' }}
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Photo */}
        <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
          {isUrl ? (
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.item}
              className={`max-h-full rounded-lg object-contain shadow-xl transition-transform duration-200 ${
                zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setZoomed(z => !z)}
            />
          ) : (
            // Placeholder for mock/filename-only evidences
            <div
              className={`flex flex-col items-center justify-center gap-4 rounded-lg border border-white/10 bg-white/5 p-12 transition-transform duration-200 ${
                zoomed ? 'scale-150' : ''
              }`}
              onClick={() => setZoomed(z => !z)}
            >
              <div className="rounded-full bg-primary/20 p-6">
                <ZoomIn size={48} className="text-primary-light" />
              </div>
              <p className="max-w-xs break-all text-center text-sm text-white/60">{photo.src}</p>
            </div>
          )}
        </div>

        {/* Next button */}
        {photos.length > 1 && (
          <button
            aria-label="Proxima foto"
            onClick={next}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white', cursor: 'pointer' }}
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {/* Metadata bar */}
      <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <span className="flex items-center gap-1.5">
            <Tag size={14} className="shrink-0 text-primary-light" />
            <span className="truncate">{photo.item}</span>
          </span>
          {photo.capturedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="shrink-0 text-primary-light" />
              <span>{formatDate(photo.capturedAt)}</span>
            </span>
          )}
          {photo.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="shrink-0 text-primary-light" />
              <span>{photo.location}</span>
            </span>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          {photos.map((thumbnail, thumbIndex) => (
            <button
              key={thumbIndex}
              aria-label={`Foto ${thumbIndex + 1}: ${thumbnail.item}`}
              aria-current={thumbIndex === index ? 'true' : undefined}
              onClick={() => { setIndex(thumbIndex); setZoomed(false) }}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                thumbIndex === index
                  ? 'border-primary opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              {thumbnail.src.startsWith('http') || thumbnail.src.startsWith('blob') || thumbnail.src.startsWith('data') ? (
                <img src={thumbnail.src} alt={thumbnail.item} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs text-white/50">
                  <ZoomIn size={16} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  , document.body)
}

/** Thumbnail grid shown inside an inspection item card */
export function PhotoThumbnails({
  photos,
  onOpen,
}: {
  photos: LightboxPhoto[]
  onOpen: (index: number) => void
}) {
  if (photos.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {photos.map((photo, index) => (
        <button
          key={index}
          aria-label={`Abrir foto ${index + 1}: ${photo.item}`}
          onClick={() => onOpen(index)}
          className="group relative h-16 w-16 overflow-hidden rounded-md border border-border bg-slate-100 transition hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {photo.src.startsWith('http') || photo.src.startsWith('blob') || photo.src.startsWith('data') ? (
            <img src={photo.src} alt={photo.item} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light/40 to-slate-100 text-primary">
              <ZoomIn size={20} />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
            <ZoomIn size={16} className="text-white opacity-0 transition group-hover:opacity-100" />
          </div>
        </button>
      ))}
    </div>
  )
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}
