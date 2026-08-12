import { ClipboardCheck, ClipboardList, FileSearch, Gauge, HardHat, MapPin, ShieldCheck, TriangleAlert, Users, Warehouse, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/utils/cn'

const navigation = [
  { items: [{ label: 'Dashboard', to: '/app/dashboard', icon: Gauge }, { label: 'Inspeções', to: '/app/inspections', icon: ClipboardCheck }] },
  { label: 'OPERAÇÕES', items: [{ label: 'Modelos de inspeção', to: '/app/inspection-templates', icon: ClipboardList }, { label: 'Não conformidades', to: '/app/non-conformities', icon: TriangleAlert }] },
  { label: 'CADASTROS', items: [{ label: 'Clientes', to: '/app/clients', icon: Warehouse }, { label: 'Locais', to: '/app/sites', icon: MapPin }, { label: 'Equipamentos', to: '/app/equipment', icon: HardHat }] },
  { label: 'ADMINISTRAÇÃO', roles: ['ADMIN', 'SUPERVISOR'], items: [{ label: 'Usuários', to: '/app/users', icon: Users }, { label: 'Auditoria', to: '/app/audit', icon: FileSearch }] },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <><div className={cn('fixed inset-0 z-30 bg-slate-950/50 lg:hidden', open ? 'block' : 'hidden')} onClick={onClose} />
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-slate-300 transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex h-18 items-center justify-between border-b border-slate-700 px-5">
        <div className="flex items-center gap-3"><span className="rounded-fieldops bg-primary p-2 text-white"><ShieldCheck size={21} /></span><span className="text-xl font-bold text-white">FieldOps</span></div>
        <button className="focus-ring rounded p-1 lg:hidden" onClick={onClose} aria-label="Fechar menu"><X /></button>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Menu principal">
        {navigation.map((group, index) => <div key={group.label ?? index}>
          {group.label && <p className="mb-2 px-3 text-[11px] font-bold tracking-widest text-slate-500">{group.label}</p>}
          <div className="space-y-1">{group.items.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => cn('focus-ring flex items-center gap-3 rounded-fieldops px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-primary text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white')}><Icon size={18} />{label}</NavLink>)}</div>
        </div>)}
      </nav>
      <div className="border-t border-slate-700 px-5 py-4 text-xs text-slate-500">Interface Administrativa</div>
    </aside></>
  )
}
