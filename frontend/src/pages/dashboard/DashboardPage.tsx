import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  ClipboardPlus,
  ClockAlert,
  Eye,
  FilePlus2,
  Loader2,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { dashboardApi, type DashboardSummary } from '@/api/dashboard'
import { Badge } from '@/components/badges/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Card } from '@/components/ui/Card'
import { authSession } from '@/auth/session'
import { InspectionStatus, Priority } from '@/types/domain'

// ── Label helpers ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  [InspectionStatus.DRAFT]: 'Rascunho',
  [InspectionStatus.ASSIGNED]: 'Atribuídas',
  [InspectionStatus.IN_PROGRESS]: 'Em andamento',
  [InspectionStatus.SUBMITTED]: 'Enviadas',
  [InspectionStatus.UNDER_REVIEW]: 'Em revisão',
  [InspectionStatus.APPROVED]: 'Aprovadas',
  [InspectionStatus.REJECTED]: 'Reprovadas',
  [InspectionStatus.CANCELED]: 'Canceladas',
}

const STATUS_COLOR: Record<string, string> = {
  [InspectionStatus.DRAFT]: '#94A3B8',
  [InspectionStatus.ASSIGNED]: '#2563EB',
  [InspectionStatus.IN_PROGRESS]: '#F59E0B',
  [InspectionStatus.SUBMITTED]: '#8B5CF6',
  [InspectionStatus.UNDER_REVIEW]: '#F97316',
  [InspectionStatus.APPROVED]: '#16A34A',
  [InspectionStatus.REJECTED]: '#DC2626',
  [InspectionStatus.CANCELED]: '#CBD5E1',
}

const PRIORITY_LABEL: Record<string, string> = {
  [Priority.LOW]: 'Baixa',
  [Priority.MEDIUM]: 'Média',
  [Priority.HIGH]: 'Alta',
  [Priority.CRITICAL]: 'Crítica',
}

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
const PRIORITY_TONE: Record<string, BadgeTone> = {
  [Priority.LOW]: 'success',
  [Priority.MEDIUM]: 'primary',
  [Priority.HIGH]: 'warning',
  [Priority.CRITICAL]: 'danger',
}

// ── Derived data helpers ──────────────────────────────────────────────────────

/** Converts byStatus map into Recharts-friendly array, hiding zero-count statuses. */
function toChartData(byStatus: Record<string, number>) {
  return Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name: STATUS_LABEL[key] ?? key,
      value: count,
      fill: STATUS_COLOR[key] ?? '#94A3B8',
    }))
    .sort((a, b) => b.value - a.value)
}

/** Total across all statuses. */
function totalInspections(byStatus: Record<string, number>) {
  return Object.values(byStatus).reduce((sum, n) => sum + n, 0)
}

/** Pending review = SUBMITTED + UNDER_REVIEW */
function pendingReview(byStatus: Record<string, number>) {
  return (byStatus[InspectionStatus.SUBMITTED] ?? 0)
    + (byStatus[InspectionStatus.UNDER_REVIEW] ?? 0)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const session = useSyncExternalStore(
    authSession.subscribe,
    authSession.snapshot,
    authSession.snapshot,
  )
  const firstName = session.user?.name?.split(' ')[0] ?? 'Supervisor'

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    dashboardApi
      .getSummary()
      .then(data => setSummary(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const chartData = summary ? toChartData(summary.byStatus) : []
  const total = summary ? totalInspections(summary.byStatus) : 0
  const pending = summary ? pendingReview(summary.byStatus) : 0
  const overdue = summary?.overdue ?? 0
  const criticalNcs = summary?.openNonConformities ?? 0

  const priorityRows = summary
    ? Object.entries(summary.byCriticality)
        .filter(([, count]) => count > 0)
        .sort((a, b) => {
          const order = [Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW]
          return order.indexOf(a[0] as Priority) - order.indexOf(b[0] as Priority)
        })
    : []

  const pendingLabel = loading
    ? 'carregando...'
    : `${pending} aguardando revisão`

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá, ${firstName}`}
        description="Aqui está um resumo das operações de hoje."
      />

      {/* ── Estado de erro global ───────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 rounded-fieldops border border-danger-light/40 bg-danger-light/10 px-4 py-3 text-sm text-danger">
          <AlertCircle size={18} className="shrink-0" />
          <span>
            Não foi possível carregar os indicadores. Verifique sua conexão e{' '}
            <button
              className="font-semibold underline"
              onClick={() => {
                setError(false)
                setLoading(true)
                dashboardApi
                  .getSummary()
                  .then(data => setSummary(data))
                  .catch(() => setError(true))
                  .finally(() => setLoading(false))
              }}
            >
              tente novamente
            </button>
            .
          </span>
        </div>
      )}

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de inspeções"
          value={loading ? 0 : total}
          icon={ClipboardCheck}
          tone="blue"
          loading={loading}
        />
        <Link to="/app/inspections/review" className="focus-ring rounded-card">
          <StatCard
            title="Revisões pendentes"
            value={loading ? 0 : pending}
            icon={CalendarClock}
            tone="amber"
            loading={loading}
          />
        </Link>
        <StatCard
          title="Inspeções atrasadas"
          value={loading ? 0 : overdue}
          icon={ClockAlert}
          tone="red"
          loading={loading}
        />
        <StatCard
          title="NCs abertas"
          value={loading ? 0 : criticalNcs}
          icon={ShieldAlert}
          tone="green"
          loading={loading}
        />
      </section>

      {/* ── Gráfico + ações rápidas ─────────────────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="p-5 lg:p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold">Inspeções por estado</h2>
            <p className="text-sm text-muted">Distribuição das inspeções ativas</p>
          </div>

          {loading && (
            <div className="flex h-72 items-center justify-center text-muted">
              <Loader2 size={28} className="animate-spin" />
            </div>
          )}

          {!loading && !error && chartData.length === 0 && (
            <div className="flex h-72 flex-col items-center justify-center text-muted">
              <ClipboardCheck size={32} className="mb-2 opacity-40" />
              <p className="text-sm">Nenhuma inspeção registrada ainda.</p>
            </div>
          )}

          {!loading && chartData.length > 0 && (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#C1CDDD" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#F2F7FF' }}
                    contentStyle={{ borderRadius: 10, borderColor: '#C1CDDD' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {chartData.map(entry => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          {/* Ações rápidas */}
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
              <QuickAction
                to="/app/inspections/review"
                icon={Eye}
                title="Revisar pendentes"
                description={pendingLabel}
              />
            </div>
          </Card>

          {/* Inspeções por criticidade */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <TriangleAlert className="text-warning" size={20} />
              <h2 className="text-base font-semibold">Inspeções por criticidade</h2>
            </div>

            {loading && (
              <div className="flex h-24 items-center justify-center text-muted">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}

            {!loading && priorityRows.length === 0 && (
              <p className="text-sm text-muted">Nenhuma inspeção ativa no momento.</p>
            )}

            {!loading && priorityRows.length > 0 && (
              <div className="space-y-3">
                {priorityRows.map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Badge tone={PRIORITY_TONE[key] ?? 'neutral'}>
                      {PRIORITY_LABEL[key] ?? key}
                    </Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  )
}

// ── QuickAction ───────────────────────────────────────────────────────────────

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
