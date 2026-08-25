import { ClipboardList, Home, LogOut, Menu, RefreshCw, ShieldCheck, User, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { mockSession } from '@/auth/mockSession'
import { technicianUser } from '@/mocks/technician'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'Inicio', to: '/technician/home', icon: Home },
  { label: 'Minhas Inspecoes', to: '/technician/inspections', icon: ClipboardList },
  { label: 'Sincronizacao', to: '/technician/sync', icon: RefreshCw },
  { label: 'Perfil', to: '/technician/profile', icon: User },
]

export function TechnicianLayout() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  function logout() {
    mockSession.logout()
    navigate('/login')
  }
  return <div className="min-h-screen bg-app-bg"><div className={cn('fixed inset-0 z-30 bg-slate-950/30 lg:hidden', open ? 'block' : 'hidden')} onClick={() => setOpen(false)} /><aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-white transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}><div className="flex h-18 items-center justify-between border-b border-border px-5"><div className="flex items-center gap-3"><span className="rounded-fieldops bg-primary p-2 text-white"><ShieldCheck size={21} /></span><div><span className="block text-lg font-semibold text-primary">FieldOps</span><span className="text-xs text-muted">Portal do tecnico</span></div></div><button className="focus-ring rounded p-1 text-muted lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X /></button></div><nav className="flex-1 space-y-1 px-3 py-5">{navItems.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => cn('focus-ring flex items-center gap-3 rounded-fieldops px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-primary-light/65 text-primary-dark' : 'text-muted hover:bg-primary-light/25 hover:text-text')}><Icon size={18} />{label}</NavLink>)}</nav><div className="border-t border-border p-4"><p className="text-sm font-semibold">{technicianUser.name}</p><p className="text-xs text-muted">Tecnico</p><button className="focus-ring mt-3 inline-flex items-center gap-2 rounded-fieldops px-2 py-1.5 text-sm font-semibold text-danger hover:bg-danger-light/20" onClick={logout}><LogOut size={16} />Sair</button></div></aside><div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur lg:px-8"><button className="focus-ring rounded-fieldops p-2 text-muted hover:bg-primary-light/30 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button><div><p className="text-sm font-semibold text-text">Portal do Tecnico</p><p className="text-xs text-muted">Operacao de campo web</p></div><span className="rounded-md bg-primary-light/55 px-2.5 py-1 text-xs font-semibold text-primary-dark">Mock</span></header><main className="mx-auto max-w-7xl p-5 lg:p-8"><Outlet /></main></div></div>
}
