import { ClipboardCheck, ClipboardList, FileSearch, Gauge, Menu, ShieldCheck, TriangleAlert, Users, Warehouse, Wrench, X } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { NavLink } from 'react-router-dom'
import { authSession } from '@/auth/session'
import { cn } from '@/utils/cn'

const navigation = [
  { label: 'GERAL', items: [{ label: 'Dashboard', to: '/app/dashboard', icon: Gauge }, { label: 'Inspecoes', to: '/app/inspections', icon: ClipboardCheck }] },
  { label: 'OPERACOES', items: [{ label: 'Modelos de inspecao', to: '/app/inspection-templates', icon: ClipboardList }, { label: 'Nao conformidades', to: '/app/non-conformities', icon: TriangleAlert }] },
  { label: 'CADASTROS', items: [{ label: 'Clientes', to: '/app/clients', icon: Warehouse }, { label: 'Equipamentos', to: '/app/equipment', icon: Wrench }, { label: 'Usuarios', to: '/app/users', icon: Users, adminOnly: true }] },
  { label: 'ADMINISTRACAO', items: [{ label: 'Auditoria', to: '/app/audit', icon: FileSearch }] },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const session = useSyncExternalStore(authSession.subscribe, authSession.snapshot, authSession.snapshot)
  return <><div className={cn('fixed inset-0 z-30 bg-slate-950/30 lg:hidden', open ? 'block' : 'hidden')} onClick={onClose} /><aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar text-text transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}><div className="flex h-18 items-center justify-between border-b border-border px-5"><div className="flex items-center gap-3"><span className="rounded-fieldops bg-primary p-2 text-white"><ShieldCheck size={21} /></span><div><span className="block text-xl font-semibold text-primary">FieldOps</span><span className="text-xs text-muted">Web Admin</span></div></div><button className="focus-ring rounded p-1 text-muted lg:hidden" onClick={onClose} aria-label="Fechar menu"><X /></button></div><nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Menu principal">{navigation.map(group => <div key={group.label}><p className="mb-2 px-3 text-[11px] font-bold tracking-widest text-muted">{group.label}</p><div className="space-y-1">{group.items.filter(item => !('adminOnly' in item) || !item.adminOnly || session.user?.role === 'ADMIN').map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => cn('focus-ring flex items-center gap-3 rounded-fieldops px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-primary-light/65 text-primary-dark' : 'text-muted hover:bg-primary-light/25 hover:text-text')}><Icon size={18} />{label}</NavLink>)}</div></div>)}</nav></aside></>
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) { return <button className="focus-ring rounded-fieldops p-2 text-muted hover:bg-primary-light/30 lg:hidden" onClick={onClick} aria-label="Abrir menu"><Menu /></button> }
