import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Select } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { auditLogs } from '@/mocks/domain'
import type { AuditLog } from '@/types/domain'

export function AuditPage() {
  const [action, setAction] = useState('')
  const [entity, setEntity] = useState('')
  const [user, setUser] = useState('')
  const [period, setPeriod] = useState('')
  const hasFilters = Boolean(action || entity || user || period)
  const filtered = useMemo(() => auditLogs.filter(log => (!action || log.action === action) && (!entity || log.entity === entity) && (!user || log.user === user) && (!period || log.timestamp.slice(0, 10) === period)), [action, entity, user, period])
  const columns: Column<AuditLog>[] = [{ header: 'Data / hora', cell: log => log.timestamp }, { header: 'Usuario', cell: log => log.user }, { header: 'Acao', cell: log => <span className="font-mono text-xs font-semibold text-primary-dark">{log.action}</span> }, { header: 'Entidade', cell: log => log.entity }, { header: 'ID', cell: log => <span className="font-mono text-xs">{log.entityId}</span> }]
  function clearFilters() { setAction(''); setEntity(''); setUser(''); setPeriod('') }
  return <div className="space-y-6"><PageHeader title="Auditoria" description="Eventos do prototipo administrativo." action={<Button variant="secondary"><Download size={17} />Exportar</Button>} /><Card className="grid gap-4 p-4 md:grid-cols-4"><Select label="Acao" id="audit-action" value={action} onChange={e => setAction(e.target.value)}><option value="">Todas</option>{Array.from(new Set(auditLogs.map(log => log.action))).map(value => <option key={value}>{value}</option>)}</Select><Select label="Entidade" id="audit-entity" value={entity} onChange={e => setEntity(e.target.value)}><option value="">Todas</option>{Array.from(new Set(auditLogs.map(log => log.entity))).map(value => <option key={value}>{value}</option>)}</Select><Select label="Usuario" id="audit-user" value={user} onChange={e => setUser(e.target.value)}><option value="">Todos</option>{Array.from(new Set(auditLogs.map(log => log.user))).map(value => <option key={value}>{value}</option>)}</Select><Input label="Periodo" id="audit-period" type="date" value={period} onChange={e => setPeriod(e.target.value)} />{hasFilters && <div className="md:col-span-4"><Button variant="ghost" onClick={clearFilters}>Limpar filtros</Button></div>}</Card><DataTable columns={columns} rows={filtered} /></div>
}
