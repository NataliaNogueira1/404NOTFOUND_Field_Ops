import { Bell, LogOut } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authSession } from '@/auth/session'
import { MobileMenuButton } from '@/components/layout/Sidebar'

const titles: Record<string, string> = { dashboard: 'Dashboard', users: 'Usuarios', clients: 'Clientes', sites: 'Locais', equipment: 'Equipamentos', 'inspection-templates': 'Modelos de inspecao', inspections: 'Inspecoes', 'non-conformities': 'Nao conformidades', audit: 'Auditoria' }

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const segment = useLocation().pathname.split('/')[2] || 'dashboard'
  const navigate = useNavigate()
  const session = useSyncExternalStore(authSession.subscribe, authSession.snapshot, authSession.snapshot)
  const user = session.user
  const initials = (user?.name ?? 'FieldOps').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()
  function logout() {
    authSession.logout()
    navigate('/login')
  }
  return <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-border bg-white/95 px-5 backdrop-blur lg:px-8"><div className="flex items-center gap-3"><MobileMenuButton onClick={onMenuClick} /><div><p className="text-xs text-muted">FieldOps / <span className="text-text">{titles[segment]}</span></p><p className="font-semibold text-text">{titles[segment]}</p></div></div><div className="flex items-center gap-3"><button className="focus-ring relative rounded-full p-2 text-muted hover:bg-primary-light/30" aria-label="Notificacoes"><Bell size={20} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" /></button><div className="h-8 w-px bg-border" /><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">{initials}</span><div className="hidden sm:block"><p className="text-sm font-semibold leading-tight">{user?.name ?? 'Usuario'}</p><p className="text-xs text-muted">{user?.role ?? 'Sessao'}</p></div></div><button className="focus-ring rounded-fieldops p-2 text-muted hover:bg-danger-light/20 hover:text-danger" onClick={logout} aria-label="Sair"><LogOut size={18} /></button></div></header>
}
