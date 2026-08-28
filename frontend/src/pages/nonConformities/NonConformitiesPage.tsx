import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SeverityBadge } from '@/components/badges/Badge'
import { Modal } from '@/components/feedback/Modal'
import { Select } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { byId, clients, inspections, nonConformities } from '@/mocks/domain'
import { Severity, type NonConformity } from '@/types/domain'

export function NonConformitiesPage() {
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [client, setClient] = useState('')
  const [period, setPeriod] = useState('')
  const [selected, setSelected] = useState<NonConformity | null>(null)
  const hasFilters = Boolean(query || severity || status || client || period)
  const filtered = useMemo(() => nonConformities.filter(nc => nc.title.toLowerCase().includes(query.toLowerCase()) && (!severity || nc.severity === severity) && (!status || nc.status === status) && (!client || nc.clientId === client) && (!period || nc.date === period)), [query, severity, status, client, period])
  const columns: Column<NonConformity>[] = [{ header: 'Titulo', cell: nc => <span className="font-medium">{nc.title}</span> }, { header: 'Inspecao', cell: nc => byId(inspections, nc.inspectionId)?.title }, { header: 'Item', cell: nc => nc.item }, { header: 'Cliente', cell: nc => byId(clients, nc.clientId)?.name }, { header: 'Criticidade', cell: nc => <SeverityBadge severity={nc.severity} /> }, { header: 'Status', cell: nc => nc.status }, { header: 'Data', cell: nc => nc.date }, { header: 'Acoes', cell: nc => <Button variant="ghost" className="h-8 px-2" onClick={() => setSelected(nc)}><Eye size={16} />Detalhes</Button> }]
  function clearFilters() { setQuery(''); setSeverity(''); setStatus(''); setClient(''); setPeriod('') }
  return <div className="space-y-6"><PageHeader title="Nao conformidades" description="Acompanhe desvios encontrados em campo." /><Card className="grid gap-4 p-4 xl:grid-cols-5"><Input label="Busca" id="nc-search" value={query} onChange={e => setQuery(e.target.value)} /><Select label="Criticidade" id="nc-sev" value={severity} onChange={e => setSeverity(e.target.value)}><option value="">Todas</option>{Object.values(Severity).map(value => <option key={value}>{value}</option>)}</Select><Select label="Status" id="nc-status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos</option><option>Aberta</option><option>Em tratamento</option><option>Resolvida</option></Select><Select label="Cliente" id="nc-client" value={client} onChange={e => setClient(e.target.value)}><option value="">Todos</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><Input label="Periodo" id="nc-period" type="date" value={period} onChange={e => setPeriod(e.target.value)} />{hasFilters && <div className="xl:col-span-5"><Button variant="ghost" onClick={clearFilters}>Limpar filtros</Button></div>}</Card><DataTable columns={columns} rows={filtered} /><Modal open={Boolean(selected)} title="Detalhes da nao conformidade" onClose={() => setSelected(null)}>{selected && <div className="space-y-3"><SeverityBadge severity={selected.severity} /><p className="text-lg font-semibold">{selected.title}</p><p className="text-sm text-muted">Item: {selected.item}</p><p className="text-sm text-muted">Cliente: {byId(clients, selected.clientId)?.name}</p><p className="text-sm text-muted">Status: {selected.status}</p></div>}</Modal></div>
}
