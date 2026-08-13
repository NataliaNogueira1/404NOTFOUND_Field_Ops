import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant }
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
  secondary: 'border border-border bg-white text-text hover:bg-primary-light/30',
  outline: 'border border-border bg-white text-text hover:bg-slate-50',
  ghost: 'text-muted hover:bg-primary-light/30 hover:text-text',
  danger: 'bg-danger text-white hover:bg-danger-dark shadow-sm',
}
export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={cn('focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-fieldops px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60', variants[variant], className)} {...props} />
}
