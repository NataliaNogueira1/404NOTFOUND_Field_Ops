import { Construction } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'

export function PlaceholderPage({ title, mode }: { title: string; mode?: string }) {
  const fullTitle = mode ? `${title} — ${mode}` : title
  return <div className="space-y-6"><PageHeader title={fullTitle} description="Esta área já está preparada para a próxima etapa do projeto." /><EmptyState icon={Construction} title="Em construção" description={`A tela de ${fullTitle.toLowerCase()} será implementada em uma próxima etapa.`} /></div>
}
