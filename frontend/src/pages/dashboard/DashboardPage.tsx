import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  ClipboardPlus,
  ClockAlert,
  Eye,
  FilePlus2,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { dashboardApi, type DashboardFilters, type DashboardSummary } from '@/api/dashboard'
import { authSession } from '@/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { useReviewCount } from '@/hooks/useReviewCount'
import { useTheme } from '@/theme'
import { Priority } from '@/types/domain'

/**
 * Recharts renders SVG and cannot consume Tailwind classes, so chart colors
 * must be passed as explicit values. These mirror the semantic design tokens
 * declared in `index.css` (`@theme` for light, `.dark` for dark) so the chart
 * stays legible on both themes (PBI-091 #173) without a flash on first paint.
 * Keep these values in sync with the corresponding CSS variables:
 *   grid   -> --color-border    tick    -> --color-muted
 *   cursor -> --color-app-bg    surface -> --color-surface
 *   bar    -> --color-primary
 */
const CHART_COLORS = {
  light: { grid: '#c1cddd', tick: '#64748b', cursor: '#f2f7ff', surface: '#ffffff', bar: '#2563eb' },
  dark: { grid: '#2a3852', tick: '#94a3b8', cursor: '#0b1220', surface: '#111a2e', bar: '#2563eb' },
} as const

const PRIORITY_LABEL: Record<Priority, string> = {
  [Priority.LOW]: 'Baixa',
  [Priority.MEDIUM]: 'Média',
  [Priority.HIGH]: 'Alta',
  [Priority.CRITICAL]: 'Crítica',
}

// Explicit view state so the render never branches on undefined summary data.
type ViewState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; summary: DashboardSummary }

function totalInspections(summary: DashboardSummary) {
  return Object.values(summary.byStatus).reduce((sum, count) => sum + count, 0)
}

function toCriticalityData(summary: DashboardSummary) {
  return Object.entries(summary.byCriticality).map(([priority, value]) => ({
    name: PRIORITY_LABEL[priority as Priority] ?? priority,
    value,
  }))
}

// The /app/dashboard route and its RequireAdmin guard are declared in
// AppRoutes.tsx and left untouched here. Hiding UI is never authorization — the
// backend @PreAuthorize on GET /api/v1/dashboard/summary stays the source of truth.
export function DashboardPage() {
  const session = useSyncExternalStore(authSession.subscribe, authSession.snapshot, authSession.snapshot)
  const reviewCount = useReviewCount()
  const { effectiveTheme } = useTheme()
  const chart = CHART_COLORS[effectiveTheme]

  const [view, setView] = useState<ViewState>({ kind: 'loading' })
  const [fromInput, setFromInput] = useState('')
  const [toInput, setToInput] = useState('')
  const [clientInput, setClientInput] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({})
  const [dateError, setDateError] = useState<string | null>(null)

  // Reload whenever the applied filters change (initial render included) and on
  // explicit retry. `reloadToken` lets the error retry re-run the same filters.
  const [reloadToken, setReloadToken] = useState(0)
  const retry = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    let cancelled = false
    // Flip to loading inside an async callback (not synchronously in the effect
    // body) to satisfy react-hooks/set-state-in-effect.
    async function loadSummary() {
      setView({ kind: 'loading' })
      try {
        const summary = await dashboardApi.getSummary(appliedFilters)
        if (!cancelled) setView({ kind: 'ready', summary })
      } catch {
        if (!cancelled) setView({ kind: 'error' })
      }
    }
    void loadSummary()
    return () => {
      cancelled = true
    }
  }, [appliedFilters, reloadToken])

  const applyFilters = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (fromInput && toInput && fromInput > toInput) {
        setDateError('A data inicial não pode ser posterior à data final.')
        return
      }
      setDateError(null)
      setAppliedFilters({
        from: fromInput || undefined,
        to: toInput || undefined,
        client: clientInput.trim() || undefined,
      })
    },
    [fromInput, toInput, clientInput],
  )

  const firstName = session.user?.name?.split(' ')[0] ?? 'Supervisor'
  const pendingLabel =
    reviewCount === null
      ? 'aguardando revisão'
      : reviewCount === 1
        ? '1 aguardando revisão'
        : `${reviewCount} aguardando revisão`

  return (
    <div className="space-y-6">
      <PageHeader title={`Olá, ${firstName}`} description="Aqui está um resumo das operações de hoje." />

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Card className="p-5">
        <form className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end" onSubmit={applyFilters}>
          <Input
            id="dashboard-from"
            type="date"
            label="Data inicial"
            value={fromInput}
            error={dateError ?? undefined}
            onChange={(event) => setFromInput(event.target.value)}
          />
          <Input
            id="dashboard-to"
            type="date"
            label="Data final"
            value={toInput}
            onChange={(event) => setToInput(event.target.value)}
          />
          <Input
            id="dashboard-client"
            label="Cliente"
            placeholder="Nome do cliente"
            value={clientInput}
            onChange={(event) => setClientInput(event.target.value)}
          />
          <Button type="submit" className="h-11">
            Aplicar filtros
          </Button>
        </form>
      </Card>

      <DashboardBody view={view} chart={chart} reviewCount={reviewCount} pendingLabel={pendingLabel} onRetry={retry} />
    </div>
  )
}

function DashboardBody({
  view,
  chart,
  reviewCount,
  pendingLabel,
  onRetry,
}: {
  view: ViewState
  chart: (typeof CHART_COLORS)[keyof typeof CHART_COLORS]
  reviewCount: number | null
  pendingLabel: string
  onRetry: () => void
}) {
  if (view.kind === 'loading') {
    return <LoadingState label="Carregando resumo..." />
  }
  if (view.kind === 'error') {
    return <ErrorState message="Não foi possível carregar o resumo do dashboard." onRetry={onRetry} />
  }

  const { summary } = view
  const total = totalInspections(summary)
  const criticalityData = toCriticalityData(summary)
  const isEmpty = total === 0 && summary.openNonConformities === 0 && summary.overdue === 0

  if (isEmpty) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Sem dados para o período"
        description="Não há inspeções ou não conformidades para os filtros selecionados."
      />
    )
  }

  return (
    <>
      {/* ── KPI cards ────────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de inspeções" value={total} icon={ClipboardCheck} tone="blue" />
        <Link to="/app/inspections/review" className="focus-ring rounded-card">
          <StatCard title="Revisões pendentes" value={reviewCount ?? 0} icon={CalendarClock} tone="amber" />
        </Link>
        <StatCard title="Inspeções atrasadas" value={summary.overdue} icon={ClockAlert} tone="red" />
        <StatCard title="NCs abertas" value={summary.openNonConformities} icon={ShieldAlert} tone="green" />
      </section>

      {/* ── Criticality chart + quick actions ────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="p-5 lg:p-6">
          <div className="mb-6 flex items-center gap-2">
            <TriangleAlert className="text-warning" size={20} aria-hidden />
            <h2 className="text-base font-semibold">Não conformidades por criticidade</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={criticalityData} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: chart.tick, fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: chart.cursor }}
                  contentStyle={{
                    borderRadius: 10,
                    borderColor: chart.grid,
                    backgroundColor: chart.surface,
                    color: chart.tick,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56} fill={chart.bar} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

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
            <QuickAction to="/app/inspections/review" icon={Eye} title="Revisar pendentes" description={pendingLabel} />
          </div>
        </Card>
      </section>
    </>
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
      <span className="rounded-fieldops bg-primary-light/55 p-2 text-primary-dark dark:bg-primary/25 dark:text-primary-light">
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
