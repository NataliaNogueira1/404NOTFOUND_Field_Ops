import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface StatCardProps { title: string; value: number; icon: LucideIcon; tone: 'blue' | 'amber' | 'red' | 'violet' }
const tones = { blue: 'bg-blue-50 text-primary', amber: 'bg-amber-50 text-warning', red: 'bg-red-50 text-danger', violet: 'bg-violet-50 text-secondary' }

export function StatCard({ title, value, icon: Icon, tone }: StatCardProps) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div><p className="text-sm font-medium text-muted">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>
      <div className={`rounded-fieldops p-3 ${tones[tone]}`}><Icon size={23} /></div>
    </Card>
  )
}
