import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * Renders a sticky top banner when the browser goes offline.
 * Disappears automatically when the connection is restored.
 */
export function OfflineBanner() {
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Sem conexão com a internet"
      className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white dark:bg-amber-600"
    >
      <WifiOff size={16} aria-hidden />
      <span>Você está offline. Algumas funcionalidades podem não estar disponíveis.</span>
    </div>
  )
}
