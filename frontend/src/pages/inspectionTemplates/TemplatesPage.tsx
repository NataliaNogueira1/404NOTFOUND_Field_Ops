import { Copy, Eye, FileClock, Pencil, Plus } from 'lucide-react'
import { useMemo, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/badges/Badge'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { templates } from '@/mocks/domain'
import { templateDraftStore } from '@/state/mockStores'
import type { InspectionTemplate } from '@/types/domain'

export function TemplatesPage() {
  const navigate = useNavigate()
  const drafts = useSyncExternalStore(templateDraftStore.subscribe, templateDraftStore.snapshot, templateDraftStore.snapshot)
  const rows = useMemo(() => [...drafts, ...templates.filter(template => !drafts.some(draft => draft.id === template.id))], [drafts])
  const columns: Column<InspectionTemplate>[] = [
    { header: 'Titulo', cell: template => <span className="font-medium">{template.title || 'Modelo sem titulo'}</span> },
    { header: 'Categoria', cell: template => template.category || '-' },
    { header: 'Versao atual', cell: template => `v${template.version}` },
    { header: 'Secoes', cell: template => template.sections.length },
    { header: 'Itens', cell: template => template.sections.reduce((sum, section) => sum + section.items.length, 0) },
    { header: 'Status', cell: template => <Badge tone={template.status === 'Ativa' ? 'success' : 'warning'}>{template.status}</Badge> },
    { header: 'Acoes', cell: template => <div className="flex flex-wrap gap-2"><Button variant="ghost" className="h-8 px-2" onClick={() => navigate(`/app/inspection-templates/${template.id}/edit`)}><Pencil size={16} />Editar</Button><Button variant="ghost" className="h-8 px-2" onClick={() => navigate(`/app/inspection-templates/${template.id}/preview`)}><Eye size={16} />Previa</Button><Button variant="ghost" className="h-8 px-2"><FileClock size={16} />Versoes</Button><Button variant="ghost" className="h-8 px-2"><Copy size={16} />Duplicar</Button></div> },
  ]
  function createTemplate() {
    const template = templateDraftStore.createBlank()
    navigate(`/app/inspection-templates/${template.id}/edit`)
  }
  return <div className="space-y-6"><PageHeader title="Modelos de inspecao" description="Crie e publique checklists utilizados pelos tecnicos." action={<Button onClick={createTemplate}><Plus size={17} />Novo modelo</Button>} /><DataTable columns={columns} rows={rows} /></div>
}
