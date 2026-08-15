import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label: string; error?: string }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, id, label, ...props }, ref) => (
  <div className="space-y-1.5"><label htmlFor={id} className="block text-sm font-medium text-text">{label}</label><input id={id} ref={ref} className={cn('focus-ring h-11 w-full rounded-fieldops border bg-white px-3.5 text-sm text-text placeholder:text-muted/70 focus:border-primary disabled:bg-slate-50', error ? 'border-danger' : 'border-border', className)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props} />{error && <p id={`${id}-error`} className="text-xs text-danger">{error}</p>}</div>
))
Input.displayName = 'Input'
