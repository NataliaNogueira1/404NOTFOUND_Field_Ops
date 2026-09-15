import { ArrowRight, CalendarClock, ClipboardCheck, ClipboardPlus, ClockAlert, Eye, FilePlus2, ShieldAlert, TriangleAlert } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { authSession } from '@/auth/session'
import { Badge } from '@/components/badges/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Card } from '@/components/ui/Card'
import { useReviewCount } from '@/hooks/useReviewCount'
import { dashboardStats, inspections, inspectionsByStatus, nonConformitiesBySeverity, byId, clients, equipment } from '@/mocks/domain'

export function DashboardPage() {
  const session = useSyncExternalStore(authSession.subscribe, authSession.snapshot, authSession.snapshot)
  const reviewCount = useReviewCount()

  const firstName = session.user?.name?.split(' ')[0] ?? 'Supervisor'
  const pendingLabel = reviewCount === null
    ? 'aguardando revisão'
    : reviewCount === 1
      ? '1 aguardando revisão'
      : `${reviewCount} aguardando revisão`

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Aqui está um resumo das operações de hoje."
      />

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de inspeções" value={dashboardStats.total} icon={ClipboardCheck} tone="blue" />
        <Link to="/app/inspections/review" className="focus-ring rounded-card">
          <StatCard
            title="Revisões pendentes"
            value={reviewCount ?? dashboardStats.pending}
            icon={CalendarClock}
            tone="amber"
          />
        </Link>
        <StatCard title="Inspeções atrasadas" value={dashboardStats.overdue} icon={ClockAlert} tone="red" />
        <StatCard title="NCs críticas" value={dashboardStats.critical} icon={ShieldAlert} tone="green" />
      </section>

      {/* ── Charts + quick actions ─────────────────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="p-5 lg:p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold">Inspeções por estado</h2>
            <p className="text-sm text-muted">Distribuição das inspeções ativas</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspectionsByStatus} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#C1CDDD" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#F2F7FF' }} contentStyle={{ borderRadius: 10, borderColor: '#C1CDDD' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-base font-semibold">Ações rápidas</h2>
            <p className="mb-4 text-sm text-muted">Atalhos para tarefas frequentes</p>
            <div className="space-y-3">
              <QuickAction
                to="/app/inspections/new"
                icon={ClipboardPlus}
                title="Nova inspeção"
                description="Agendar atividade"
              />
              <QuickAction
                to="/app/inspection-templates/new"
                icon={FilePlus2}
                title="Criar modelo"
                description="Abrir construtor"
              />
              {/* Deep-link direto para a fila de revisão, com contagem dinâmica */}
              <QuickAction
                to="/app/inspections/review"
                icon={Eye}
                title="Revisar pendentes"
                description={pendingLabel}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <TriangleAlert className="text-warning" size={20} />
              <h2 className="text-base font-semibold">Não conformidades por criticidade</h2>
            </div>
            <div className="space-y-3">
              {nonConformitiesBySeverity.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <Badge tone={item.tone}>{item.label}</Badge>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ── Recent inspections ─────────────────────────────────────────────── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Inspeções recentes</h2>
            <p className="text-sm text-muted">Últimos registros movimentados</p>
          </div>
          <Link className="text-sm font-semibold text-primary" to="/app/inspections">
            Ver todas
          </Link>
        </div>
        <div className="divide-y divide-border">
          {inspections.slice(0, 5).map(item => (
            <Link
              to={`/app/inspections/${item.id}/review`}
              key={item.id}
              className="flex flex-col gap-2 py-3 hover:bg-primary-light/10 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted">
                  {byId(clients, item.clientId)?.name} - {byId(equipment, item.equipmentId)?.name}
                </p>
              </div>
              <span className="text-sm text-muted">{item.dueDate}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string
  icon: typeof ClipboardPlus
  title: string
  description: string
}) {
  return (
    <Link
      to={to}
      className="focus-ring group flex items-center gap-3 rounded-fieldops border border-border p-3 transition-colors hover:border-primary-light hover:bg-primary-light/30"
    >
      <span className="rounded-fieldops bg-primary-light/55 p-2 text-primary-dark">
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{description}</span>
      </span>
      <ArrowRight
        className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        size={17}
      />
    </Link>
  )
}
