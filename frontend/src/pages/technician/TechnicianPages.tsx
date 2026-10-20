import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  ClipboardCheck,
  Info as InfoIcon,
  MapPin,
  Play,
  RefreshCw,
  UserCircle,
} from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, PriorityBadge, StatusBadge } from '@/components/badges/Badge'
import { Select } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/ui/LoadingState'
import { authSession } from '@/auth/session'
import { type TechnicianInspection } from '@/api/mobileInspections'
import { useTechnicianInspections } from '@/hooks/useTechnicianInspections'
import { InspectionStatus, Priority, ResponseType, type TemplateItem } from '@/types/domain'
import { formatDate } from '@/utils/formatDate'

export function TechnicianHomePage() {
  const { state, reload } = useTechnicianInspections()
  const session = useSyncExternalStore(authSession.subscribe, authSession.snapshot, authSession.snapshot)
  const firstName = session.user?.name.split(' ')[0] ?? 'Técnico'
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {firstName}</h1>
        <p className="text-sm text-muted">Suas atividades de campo atribuídas.</p>
      </div>
      <InspectionsAsync state={state} reload={reload} emptyDescription="Nenhuma inspeção atribuída a você no momento.">
        {(inspections) => <HomeContent inspections={inspections} reload={reload} />}
      </InspectionsAsync>
    </div>
  )
}

function HomeContent({
  inspections,
  reload,
}: {
  inspections: TechnicianInspection[]
  reload: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const todayCount = inspections.filter((item) => item.dueDate === today).length
  const overdue = inspections.filter((item) => item.overdue).length
  const inProgress = inspections.filter((item) => item.status === InspectionStatus.IN_PROGRESS).length
  const assigned = inspections.filter((item) => item.status === InspectionStatus.ASSIGNED).length
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TechStat label="Hoje" value={todayCount} tone="primary" />
        <TechStat label="Atrasadas" value={overdue} tone="danger" />
        <TechStat label="Em andamento" value={inProgress} tone="warning" />
        <TechStat label="Atribuídas" value={assigned} tone="success" />
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Próximas inspeções</h2>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={reload}>
              <RefreshCw size={16} />
              Atualizar
            </Button>
            <Link className="text-sm font-semibold text-primary" to="/technician/inspections">
              Ver todas
            </Link>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {inspections.slice(0, 4).map((inspection) => (
            <TechnicianInspectionCard key={inspection.id} inspection={inspection} />
          ))}
        </div>
      </section>
    </>
  )
}

export function TechnicianInspectionsPage() {
  const { state, reload } = useTechnicianInspections()
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Minhas Inspeções</h1>
          <p className="text-sm text-muted">Busca, filtros e progresso das atividades atribuídas.</p>
        </div>
        <Button variant="ghost" onClick={reload}>
          <RefreshCw size={16} />
          Atualizar
        </Button>
      </div>
      <InspectionsAsync state={state} reload={reload} emptyDescription="Nenhuma inspeção atribuída a você no momento.">
        {(inspections) => <InspectionsList inspections={inspections} />}
      </InspectionsAsync>
    </div>
  )
}

function InspectionsList({ inspections }: { inspections: TechnicianInspection[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [period, setPeriod] = useState('')
  const [dueDate, setDueDate] = useState('')
  const { today, weekEnd } = useMemo(() => {
    const current = new Date()
    const end = new Date(current)
    end.setDate(current.getDate() + 6)
    return { today: current.toISOString().slice(0, 10), weekEnd: end.toISOString().slice(0, 10) }
  }, [])
  const filtered = useMemo(
    () =>
      inspections.filter((inspection) => {
        const haystack = `${inspection.title} ${inspection.clientName} ${inspection.equipmentName}`.toLowerCase()
        const matchesPeriod =
          !period ||
          (period === 'today' && inspection.dueDate === today) ||
          (period === 'week' && inspection.dueDate >= today && inspection.dueDate <= weekEnd)
        const matchesDueDate = !dueDate || inspection.dueDate === dueDate
        return (
          haystack.includes(query.toLowerCase()) &&
          (!status || inspection.status === status) &&
          (!priority || inspection.priority === priority) &&
          matchesPeriod &&
          matchesDueDate
        )
      }),
    [inspections, dueDate, period, priority, query, status, today, weekEnd],
  )
  const hasFilters = Boolean(query || status || priority || period || dueDate)
  function clearFilters() {
    setQuery('')
    setStatus('')
    setPriority('')
    setPeriod('')
    setDueDate('')
  }
  return (
    <>
      <Card className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Input
          label="Buscar"
          id="tech-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Título, cliente ou equipamento"
        />
        <Select label="Status" id="tech-status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos</option>
          <option value={InspectionStatus.ASSIGNED}>Atribuída</option>
          <option value={InspectionStatus.IN_PROGRESS}>Em andamento</option>
          <option value={InspectionStatus.SUBMITTED}>Enviada</option>
          <option value={InspectionStatus.UNDER_REVIEW}>Em revisão</option>
          <option value={InspectionStatus.APPROVED}>Aprovada</option>
          <option value={InspectionStatus.REJECTED}>Reprovada</option>
          <option value={InspectionStatus.CANCELED}>Cancelada</option>
        </Select>
        <Select
          label="Prioridade"
          id="tech-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="">Todas</option>
          {Object.values(Priority).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Select label="Período" id="tech-period" value={period} onChange={(event) => setPeriod(event.target.value)}>
          <option value="">Todos</option>
          <option value="today">Hoje</option>
          <option value="week">Esta semana</option>
        </Select>
        <Input
          label="Data"
          id="tech-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        {hasFilters && (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-5">
            <Button variant="ghost" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((inspection) => (
          <TechnicianInspectionCard key={inspection.id} inspection={inspection} />
        ))}
      </div>
      {filtered.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted">Nenhuma inspeção encontrada.</Card>
      )}
    </>
  )
}

export function TechnicianInspectionDetailsPage() {
  const { state, reload, id } = useInspection()
  return (
    <div className="space-y-6">
      <BackLink to="/technician/inspections" label="Minhas inspeções" />
      <InspectionAsync state={state} reload={reload} id={id}>
        {(inspection) => <DetailsContent inspection={inspection} />}
      </InspectionAsync>
    </div>
  )
}

function DetailsContent({ inspection }: { inspection: TechnicianInspection }) {
  const template = inspection.template
  const totalItems = template.sections.reduce((sum, section) => sum + section.items.length, 0)
  const action =
    inspection.status === InspectionStatus.IN_PROGRESS
      ? 'Continuar'
      : inspection.status === InspectionStatus.REJECTED
        ? 'Corrigir'
        : 'Abrir checklist'
  const isCanceled = inspection.status === InspectionStatus.CANCELED
  const canOpenChecklist =
    inspection.status === InspectionStatus.ASSIGNED ||
    inspection.status === InspectionStatus.IN_PROGRESS ||
    inspection.status === InspectionStatus.REJECTED
  return (
    <>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{inspection.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <PriorityBadge priority={inspection.priority} />
            <StatusBadge status={inspection.status} />
          </div>
        </div>
        {canOpenChecklist ? (
          <Link to={`/technician/inspections/${inspection.id}/start`}>
            <Button>
              <Play size={17} />
              {action}
            </Button>
          </Link>
        ) : (
          <Button disabled>
            <Play size={17} />
            {isCanceled ? 'Cancelada' : 'Somente leitura'}
          </Button>
        )}
      </div>
      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard label="Cliente" value={inspection.clientName} icon={UserCircle} />
        <InfoCard label="Local" value={inspection.siteName} icon={MapPin} />
        <InfoCard label="Equipamento" value={inspection.equipmentName} icon={ClipboardCheck} />
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <div className="space-y-4">
          {isCanceled && (
            <Card className="border-danger-light/40 bg-danger-light/10 p-4 text-sm font-medium text-danger-dark">
              Esta inspeção foi cancelada pelo Admin/Supervisor e não pode ser iniciada ou continuada.
            </Card>
          )}
          {inspection.status === InspectionStatus.REJECTED && inspection.rejectionReason && (
            <Card className="border-warning/40 bg-warning/10 p-4 text-sm text-warning-dark">
              <p className="font-semibold">Motivo da reprovação</p>
              <p className="mt-1">{inspection.rejectionReason}</p>
            </Card>
          )}
          <Card className="p-5">
            <h2 className="text-base font-semibold">Dados da inspeção</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Data" value={`${formatDate(inspection.dueDate)} ${inspection.dueTime ?? ''}`.trim()} />
              <Info label="Supervisor" value={inspection.supervisorName} />
              <Info label="Modelo" value={template.title} />
              <Info label="Progresso" value={`${inspection.progress}%`} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold">Instruções</h2>
            <p className="mt-2 text-sm text-muted">
              {inspection.supervisorInstructions || 'Sem instruções adicionais.'}
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="text-base font-semibold">Progresso</h2>
            <Progress value={inspection.progress} />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info label="Seções" value={String(template.sections.length)} />
              <Info label="Itens do checklist" value={String(totalItems)} />
            </div>
          </Card>
        </div>
        <Card className="h-fit p-5">
          <h2 className="text-base font-semibold">Checklist</h2>
          <p className="mt-2 text-sm text-muted">
            {template.sections.length} seções e {totalItems} itens neste modelo.
          </p>
          <Link className="mt-4 block" to={`/technician/inspections/${inspection.id}/checklist`}>
            <Button variant="secondary" className="w-full">
              <ClipboardCheck size={17} />
              Ver checklist
            </Button>
          </Link>
        </Card>
      </div>
    </>
  )
}

export function TechnicianStartInspectionPage() {
  const { state, reload, id } = useInspection()
  return (
    <div className="space-y-6">
      <BackLink to={`/technician/inspections/${id}`} label="Detalhes" />
      <InspectionAsync state={state} reload={reload} id={id}>
        {(inspection) => <StartContent inspection={inspection} />}
      </InspectionAsync>
    </div>
  )
}

function StartContent({ inspection }: { inspection: TechnicianInspection }) {
  const navigate = useNavigate()
  const totalItems = inspection.template.sections.reduce((sum, section) => sum + section.items.length, 0)
  return (
    <>
      <h1 className="text-2xl font-semibold">Pronto para abrir o checklist?</h1>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_360px]">
        <Card className="p-5">
          <h2 className="text-base font-semibold">{inspection.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {inspection.clientName} / {inspection.siteName}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Info label="Equipamento" value={inspection.equipmentName} />
            <Info label="Itens" value={String(totalItems)} />
            <Info label="Prioridade" value={inspection.priority} />
            <Info label="Modelo" value={inspection.template.title} />
          </div>
        </Card>
        <Card className="border-primary-light/60 p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-fieldops bg-primary-light/55 p-2 text-primary-dark dark:bg-primary/25 dark:text-primary-light">
              <InfoIcon size={19} />
            </span>
            <div>
              <h2 className="text-base font-semibold">Execução em campo</h2>
              <p className="mt-1 text-sm text-muted">
                O preenchimento com fotos, QR Code e localização é feito pelo aplicativo mobile. No portal web você
                acompanha o checklist e o andamento.
              </p>
            </div>
          </div>
        </Card>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate(`/technician/inspections/${inspection.id}`)}>
          Voltar
        </Button>
        <Button onClick={() => navigate(`/technician/inspections/${inspection.id}/checklist`)}>Ver checklist</Button>
      </div>
    </>
  )
}

export function TechnicianChecklistPage() {
  const { state, reload, id } = useInspection()
  return (
    <div className="space-y-6">
      <BackLink to={`/technician/inspections/${id}`} label="Detalhes" />
      <InspectionAsync state={state} reload={reload} id={id}>
        {(inspection) => <ChecklistContent inspection={inspection} />}
      </InspectionAsync>
    </div>
  )
}

function ChecklistContent({ inspection }: { inspection: TechnicianInspection }) {
  const template = inspection.template
  const items = template.sections.flatMap((section) => section.items)
  return (
    <>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{template.title}</h1>
          <p className="text-sm text-muted">
            {template.sections.length} seções / {items.length} itens
          </p>
        </div>
        <Link to={`/technician/inspections/${inspection.id}/summary`}>
          <Button>Ver resumo</Button>
        </Link>
      </div>
      <Card className="flex items-start gap-3 border-primary-light/60 p-4">
        <span className="rounded-fieldops bg-primary-light/55 p-2 text-primary-dark dark:bg-primary/25 dark:text-primary-light">
          <InfoIcon size={18} />
        </span>
        <p className="text-sm text-muted">
          Visualização do checklist atribuído. O preenchimento das respostas, evidências e não conformidades é feito
          pelo aplicativo mobile em campo.
        </p>
      </Card>
      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Checklist sem itens"
          description="O modelo desta inspeção não possui itens para exibir."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <Card className="h-fit p-4">
            <p className="text-sm font-semibold">Seções</p>
            <div className="mt-3 space-y-2">
              {template.sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="focus-ring block rounded-fieldops px-3 py-2 text-sm text-muted hover:bg-primary-light/25 hover:text-text"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </Card>
          <div className="space-y-5">
            {template.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 space-y-3">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                {section.items.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    index={items.findIndex((candidate) => candidate.id === item.id) + 1}
                  />
                ))}
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export function TechnicianSummaryPage() {
  const { state, reload, id } = useInspection()
  return (
    <div className="space-y-6">
      <BackLink to={`/technician/inspections/${id}/checklist`} label="Checklist" />
      <h1 className="text-2xl font-semibold">Resumo</h1>
      <InspectionAsync state={state} reload={reload} id={id}>
        {(inspection) => <SummaryContent inspection={inspection} />}
      </InspectionAsync>
    </div>
  )
}

function SummaryContent({ inspection }: { inspection: TechnicianInspection }) {
  const template = inspection.template
  const total = template.sections.reduce((sum, section) => sum + section.items.length, 0)
  const required = template.sections
    .flatMap((section) => section.items)
    .filter((item) => item.required).length
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TechStat label="Total de itens" value={total} tone="primary" />
        <TechStat label="Obrigatórios" value={required} tone="warning" />
        <TechStat label="Seções" value={template.sections.length} tone="success" />
        <TechStat label="Progresso" value={inspection.progress} tone="primary" />
      </section>
      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="Cliente" value={inspection.clientName} />
          <Info label="Equipamento" value={inspection.equipmentName} />
          <Info label="Modelo" value={template.title} />
          <Info label="Status" value={inspection.status} />
        </div>
      </Card>
      <Card className="flex items-start gap-3 border-primary-light/60 p-4">
        <span className="rounded-fieldops bg-primary-light/55 p-2 text-primary-dark dark:bg-primary/25 dark:text-primary-light">
          <InfoIcon size={18} />
        </span>
        <p className="text-sm text-muted">
          A conclusão e a sincronização da inspeção acontecem no aplicativo mobile. Este resumo é somente para
          acompanhamento.
        </p>
      </Card>
    </>
  )
}

export function TechnicianProfilePage() {
  const navigate = useNavigate()
  const session = useSyncExternalStore(authSession.subscribe, authSession.snapshot, authSession.snapshot)
  const user = session.user
  const initials = (user?.name ?? 'Técnico')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  function logout() {
    authSession.logout()
    navigate('/login')
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="p-8 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary text-2xl font-semibold text-white">
          {initials}
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{user?.name ?? 'Técnico'}</h1>
        <p className="text-primary">{user?.role ?? 'TECHNICIAN'}</p>
        <p className="text-sm text-muted">{user?.email ?? ''}</p>
      </Card>
      <Card className="p-5">
        <Info label="Versão" value="1.0.0" />
        <div className="mt-3">
          <Info label="Experiência" value="Portal web do técnico" />
        </div>
      </Card>
      <div className="flex justify-end gap-3">
        <Button variant="danger" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  )
}

function InspectionsAsync({
  state,
  reload,
  emptyDescription,
  children,
}: {
  state: ReturnType<typeof useTechnicianInspections>['state']
  reload: () => void
  emptyDescription: string
  children: (inspections: TechnicianInspection[]) => React.ReactNode
}) {
  if (state.type === 'loading') return <LoadingState label="Carregando inspeções..." />
  if (state.type === 'error') return <ErrorState message={state.message} onRetry={reload} />
  if (state.inspections.length === 0)
    return <EmptyState icon={ClipboardCheck} title="Nenhuma inspeção" description={emptyDescription} />
  return <>{children(state.inspections)}</>
}

function InspectionAsync({
  state,
  reload,
  id,
  children,
}: {
  state: ReturnType<typeof useTechnicianInspections>['state']
  reload: () => void
  id: string
  children: (inspection: TechnicianInspection) => React.ReactNode
}) {
  if (state.type === 'loading') return <LoadingState label="Carregando inspeção..." />
  if (state.type === 'error') return <ErrorState message={state.message} onRetry={reload} />
  const inspection = state.inspections.find((item) => item.id === id)
  if (!inspection)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Inspeção não encontrada"
        description="A inspeção solicitada não está entre as suas atribuições."
      />
    )
  return <>{children(inspection)}</>
}

function TechnicianInspectionCard({ inspection }: { inspection: TechnicianInspection }) {
  const action =
    inspection.status === InspectionStatus.IN_PROGRESS
      ? 'Continuar'
      : inspection.status === InspectionStatus.REJECTED
        ? 'Corrigir'
        : 'Abrir'
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link to={`/technician/inspections/${inspection.id}`} className="font-semibold text-primary">
            {inspection.title}
          </Link>
          <p className="mt-1 text-sm text-muted">
            {inspection.clientName} - {inspection.siteName}
          </p>
          <p className="text-sm text-muted">{inspection.equipmentName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={inspection.priority} />
          <StatusBadge status={inspection.status} />
        </div>
      </div>
      <div className="mt-4">
        <Progress value={inspection.progress} />
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>
            {formatDate(inspection.dueDate)} {inspection.dueTime ?? ''}
          </span>
          {inspection.overdue && <Badge tone="danger">Atrasada</Badge>}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Link to={`/technician/inspections/${inspection.id}`}>
          <Button variant="secondary">{action}</Button>
        </Link>
      </div>
    </Card>
  )
}

function ChecklistItem({ item, index }: { item: TemplateItem; index: number }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-semibold">
            {index}. {item.question}
            {item.required && ' *'}
          </p>
          {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="primary">{responseTypeLabel(item.responseType)}</Badge>
            {item.required && <Badge tone="neutral">Obrigatório</Badge>}
            {item.requireObservationOnFailure && <Badge tone="warning">Obs. na falha</Badge>}
            {item.requireEvidenceOnFailure && <Badge tone="danger">Evidência na falha</Badge>}
          </div>
          {item.options && item.options.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.options.map((option) => (
                <span key={option} className="rounded-md border border-border px-2.5 py-1 text-xs text-muted">
                  {option}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="rounded-fieldops bg-app-bg p-2 text-muted dark:bg-muted-surface">
          <Camera size={18} aria-hidden />
        </span>
      </div>
    </Card>
  )
}

const responseTypeLabels: Record<ResponseType, string> = {
  [ResponseType.TEXT_SHORT]: 'Texto curto',
  [ResponseType.TEXT_LONG]: 'Texto longo',
  [ResponseType.NUMBER]: 'Número',
  [ResponseType.BOOLEAN]: 'Sim / Não',
  [ResponseType.CONFORMITY]: 'Conformidade',
  [ResponseType.SINGLE_CHOICE]: 'Seleção única',
  [ResponseType.DATE]: 'Data',
}

function responseTypeLabel(type: ResponseType): string {
  return responseTypeLabels[type] ?? type
}

function TechStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'primary' | 'danger' | 'warning' | 'success'
}) {
  const toneClass = {
    primary: 'text-primary-dark bg-primary-light/45 dark:text-primary-light dark:bg-primary/25',
    danger: 'text-danger-dark bg-danger-light/20',
    warning: 'text-warning-dark bg-amber-100 dark:bg-warning-light/60',
    success: 'text-success-dark bg-success-light/30',
  }[tone]
  return (
    <Card className="relative overflow-hidden p-5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <span className={`absolute right-4 top-4 h-10 w-10 rounded-full ${toneClass}`} />
    </Card>
  )
}

function InfoCard({ label, value, icon: Icon }: { label: string; value?: string; icon: typeof UserCircle }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-fieldops bg-primary-light/55 p-2 text-primary-dark dark:bg-primary/25 dark:text-primary-light">
          <Icon size={19} />
        </span>
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="text-sm font-semibold">{value || '-'}</p>
        </div>
      </div>
    </Card>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-sm font-semibold">{value || '-'}</p>
    </div>
  )
}

function Progress({ value }: { value: number }) {
  return (
    <div>
      <div className="h-2 rounded-full bg-app-bg dark:bg-muted-surface">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{value}% concluído</p>
    </div>
  )
}

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary" to={to}>
      <ArrowLeft size={16} />
      {label}
    </Link>
  )
}

function useInspection() {
  const { id = '' } = useParams()
  const { state, reload } = useTechnicianInspections()
  return { state, reload, id }
}
