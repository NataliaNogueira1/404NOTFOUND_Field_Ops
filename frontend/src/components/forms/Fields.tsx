import { forwardRef, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }>(({ className, error, id, label, ...props }, ref) => <div className="space-y-1.5"><label htmlFor={id} className="block text-sm font-medium text-text">{label}</label><textarea id={id} ref={ref} className={cn('focus-ring min-h-24 w-full rounded-fieldops border bg-white px-3.5 py-3 text-sm text-text placeholder:text-muted/70 focus:border-primary', error ? 'border-danger' : 'border-border', className)} {...props} />{error && <p className="text-xs text-danger">{error}</p>}</div>)
Textarea.displayName = 'Textarea'
export function Select({ className, id, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const label = props.label
  return <div className="space-y-1.5"><label htmlFor={id} className="block text-sm font-medium text-text">{label}</label><select id={id} className={cn('focus-ring h-11 w-full rounded-fieldops border border-border bg-white px-3.5 text-sm text-text focus:border-primary disabled:bg-slate-50', className)} {...props}>{children}</select></div>
}
