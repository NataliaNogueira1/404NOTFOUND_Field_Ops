import { Bell, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const titles: Record<string, string> = { dashboard: 'Dashboard', users: 'Usuários', clients: 'Clientes', sites: 'Locais', equipment: 'Equipamentos', 'inspection-templates': 'Modelos de inspeção', inspections: 'Inspeções', 'non-conformities': 'Não conformidades', audit: 'Auditoria' }

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const segment = useLocation().pathname.split('/')[2] || 'dashboard'
  return <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-border bg-white/95 px-5 backdrop-blur lg:px-8">
    <div className="flex items-center gap-3"><button className="focus-ring rounded-fieldops p-2 text-muted hover:bg-slate-100 lg:hidden" onClick={onMenuClick} aria-label="Abrir menu"><Menu /></button><div><p className="text-xs text-muted">FieldOps / <span className="text-text">{titles[segment]}</span></p><p className="font-semibold text-text">{titles[segment]}</p></div></div>
    <div className="flex items-center gap-3"><button className="focus-ring relative rounded-full p-2 text-muted hover:bg-slate-100" aria-label="Notificações"><Bell size={20} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-white" /></button><div className="h-8 w-px bg-border" /><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">MS</span><div className="hidden sm:block"><p className="text-sm font-semibold leading-tight">Marina Silva</p><p className="text-xs text-muted">Supervisora</p></div></div></div>
  </header>
}
