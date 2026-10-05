import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'Ocorreu um erro ao carregar os dados.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex min-h-72 flex-col items-center justify-center rounded-fieldops border border-red-200 bg-red-50 px-6 text-center dark:border-red-900/40 dark:bg-red-950/20"
    >
      <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">
        <AlertCircle size={24} aria-hidden />
      </div>
      <h2 className="font-semibold text-red-700 dark:text-red-400">Algo deu errado</h2>
      <p className="mt-1 max-w-md text-sm text-red-600/80 dark:text-red-400/80">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          className="mt-4 gap-2"
          onClick={onRetry}
        >
          <RefreshCw size={14} aria-hidden />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
