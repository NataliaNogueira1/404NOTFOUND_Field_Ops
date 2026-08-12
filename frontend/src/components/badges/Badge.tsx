import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
const tones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700', primary: 'bg-blue-50 text-blue-700',
  success: 'bg-green-50 text-green-700', warning: 'bg-amber-50 text-amber-700', danger: 'bg-red-50 text-red-700',
}

export function Badge({ className, tone = 'neutral', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)} {...props} />
}
