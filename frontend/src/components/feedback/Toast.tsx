import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/utils/cn'
export function Toast({ message, show }: { message: string; show: boolean }) {
  return <div className={cn('fixed bottom-5 right-5 z-60 flex items-center gap-2 rounded-fieldops border border-success-light bg-white px-4 py-3 text-sm font-medium text-success-dark shadow-fieldops transition-all', show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0')}><CheckCircle2 size={18} />{message}</div>
}
