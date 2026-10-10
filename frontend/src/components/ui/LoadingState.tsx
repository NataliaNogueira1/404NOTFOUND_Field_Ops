import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Carregando...' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex min-h-72 flex-col items-center justify-center rounded-fieldops border border-border bg-surface px-6 text-center"
    >
      <Loader2 size={32} className="mb-3 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}
