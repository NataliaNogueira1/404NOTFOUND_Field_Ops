import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useTheme, type ThemePreference } from './themeContext'

/**
 * Minimal, accessible theme switcher (PBI-091 infrastructure).
 * Cycles claro → escuro → sistema. The state is conveyed by icon + text +
 * aria-label (not by color alone), and aria-pressed reflects dark mode.
 */
const NEXT: Record<ThemePreference, ThemePreference> = {
  claro: 'escuro',
  escuro: 'sistema',
  sistema: 'claro',
}

const LABEL: Record<ThemePreference, string> = {
  claro: 'Claro',
  escuro: 'Escuro',
  sistema: 'Sistema',
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, effectiveTheme } = useTheme()
  const Icon = theme === 'claro' ? Sun : theme === 'escuro' ? Moon : Monitor

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Alternar tema (atual: ${LABEL[theme]}). Clique para mudar.`}
      aria-pressed={effectiveTheme === 'dark'}
      title={`Tema: ${LABEL[theme]}`}
      className={cn(
        'focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-fieldops border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-primary-light/30',
        className,
      )}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{LABEL[theme]}</span>
    </button>
  )
}
