import { ArrowRight, CalendarClock, ClipboardCheck, ClipboardPlus, ClockAlert, Eye, ShieldAlert, TriangleAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Card } from '@/components/ui/Card'
import { dashboardStats, inspectionsByStatus, nonConformitiesByPriority } from '@/mocks/domain'

export function DashboardPage() {
  return <div className="space-y-6"><PageHeader title="Visão geral" description="Acompanhe os principais indicadores das operações em campo." />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="Total de inspeções" value={dashboardStats.total} icon={ClipboardCheck} tone="blue" /><StatCard title="Revisões pendentes" value={dashboardStats.pending} icon={CalendarClock} tone="amber" /><StatCard title="Inspeções atrasadas" value={dashboardStats.overdue} icon={ClockAlert} tone="red" /><StatCard title="Não conformidades críticas" value={dashboardStats.critical} icon={ShieldAlert} tone="violet" /></section>
    <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <Card className="p-5 lg:p-6"><div className="mb-6"><h2 className="font-semibold">Inspeções por estado</h2><p className="text-sm text-muted">Distribuição das inspeções ativas</p></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={inspectionsByStatus} margin={{ left: -20, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} /><Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: 8, borderColor: '#E2E8F0' }} /><Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} /></BarChart></ResponsiveContainer></div></Card>
      <div className="space-y-6"><Card className="p-5"><h2 className="font-semibold">Ações rápidas</h2><p className="mb-4 text-sm text-muted">Atalhos para tarefas frequentes</p><div className="space-y-3"><QuickAction to="/app/inspections/new" icon={ClipboardPlus} title="Nova inspeção" description="Criar uma nova atividade" /><QuickAction to="/app/inspections" icon={Eye} title="Revisar pendentes" description="3 aguardando revisão" /></div></Card>
      <Card className="p-5"><div className="mb-4 flex items-center gap-2"><TriangleAlert className="text-warning" size={20} /><h2 className="font-semibold">Não conformidades</h2></div><div className="space-y-3">{nonConformitiesByPriority.map(item => <div key={item.label} className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-muted"><span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />{item.label}</span><span className="font-semibold">{item.value}</span></div>)}</div></Card></div>
    </section></div>
}

function QuickAction({ to, icon: Icon, title, description }: { to: string; icon: typeof ClipboardPlus; title: string; description: string }) {
  return <Link to={to} className="focus-ring group flex items-center gap-3 rounded-fieldops border border-border p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50"><span className="rounded-fieldops bg-blue-50 p-2 text-primary"><Icon size={19} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="block text-xs text-muted">{description}</span></span><ArrowRight className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" size={17} /></Link>
}
