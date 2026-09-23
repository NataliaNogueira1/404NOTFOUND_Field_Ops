import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  tone: 'blue' | 'amber' | 'red' | 'green'
  /** When true renders a pulsing skeleton instead of the value. */
  loading?: boolean
}

const tones = {
  blue: 'bg-primary-light/55 text-primary-dark',
  amber: 'bg-amber-100 text-warning-dark',
  red: 'bg-danger-light/25 text-danger-dark',
  green: 'bg-success-light/35 text-success-dark',
}

export function StatCard({ title, value, icon: Icon, tone, loading = false }: StatCardProps) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm font-medium text-muted">{title}</p>
        {loading
          ? <div className="mt-2 h-9 w-16 animate-pulse rounded-md bg-slate-200" />
          : <p className="mt-2 text-3xl font-semibold text-text">{value}</p>
        }
      </div>
      <div className={`rounded-full p-3 ${tones[tone]}`}>
        <Icon size={23} />
      </div>
    </Card>
  )
}
