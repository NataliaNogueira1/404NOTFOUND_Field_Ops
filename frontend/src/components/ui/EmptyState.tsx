import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps { icon: LucideIcon; title: string; description: string }

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-fieldops border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="mb-4 rounded-full bg-blue-50 p-3 text-primary"><Icon size={24} /></div>
      <h2 className="font-semibold text-text">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
    </div>
  )
}
