import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

/**
 * Length above which an identifier is considered "long" (e.g. a UUID) and is
 * abbreviated to its first characters. Short sequential numeric IDs stay whole.
 */
const ABBREVIATION_THRESHOLD = 12
/** Number of leading characters kept when a long identifier is abbreviated. */
const ABBREVIATED_LENGTH = 8

interface InspectionIdCellProps {
  /** The inspection identifier as returned by the API (already a string). */
  id: string
  className?: string
}

/**
 * Renders an inspection identifier in a readable, traceable way.
 *
 * - Short IDs (sequential numbers) are shown in full, prefixed with `#`.
 * - Long IDs (UUIDs) are abbreviated to the first characters with an ellipsis.
 * - The full ID is always available via tooltip and a copy-to-clipboard action,
 *   so it can be referenced in support conversations and filters (task #336).
 */
export function InspectionIdCell({ id, className }: InspectionIdCellProps) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const isLong = id.length > ABBREVIATION_THRESHOLD
  const label = isLong ? `${id.slice(0, ABBREVIATED_LENGTH)}…` : `#${id}`

  async function copyId() {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      window.clearTimeout(resetTimer.current)
      resetTimer.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* Clipboard unavailable (e.g. insecure context) — the tooltip still exposes the full ID. */
    }
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="font-mono text-xs text-muted" title={id}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => void copyId()}
        aria-label={copied ? `ID ${id} copiado` : `Copiar ID ${id}`}
        title={copied ? 'Copiado' : 'Copiar ID'}
        className="focus-ring rounded p-0.5 text-muted transition-colors hover:text-text"
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      </button>
    </span>
  )
}
