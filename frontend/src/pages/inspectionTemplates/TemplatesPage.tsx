import { Copy, Eye, FileClock, Loader2, Pencil, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type TemplateListStatus, type TemplateSummary, adminCatalogApi } from '@/api/adminCatalog'
import { Badge } from '@/components/badges/Badge'
import { Modal } from '@/components/feedback/Modal'
import { Select } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue, useListQuery } from '@/hooks/useListQuery'
import { useTemplateVersions } from '@/hooks/useTemplateVersions'

export function TemplatesPage() {
  const navigate = useNavigate()
  const list = useListQuery('title,asc')
  const query = list.value('name')
  const debouncedQuery = useDebouncedValue(query)
  const status = list.value('status') as TemplateListStatus | ''
  const [rows, setRows] = useState<TemplateSummary[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Template whose published versions are shown in the modal (PBI-246). null = closed.
  const [versionsTemplate, setVersionsTemplate] = useState<TemplateSummary | null>(null)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await adminCatalogApi.listTemplates({
        name: debouncedQuery,
        status,
        page: list.page,
        size: list.size,
        sort: list.sort,
      })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch {
      setRows([])
      setTotalElements(0)
      setTotalPages(1)
      setError('Não foi possível carregar os modelos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, list.page, list.size, list.sort, status])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void loadTemplates(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [loadTemplates])

  const columns: Column<TemplateSummary>[] = [
    {
      header: 'Título',
      sortKey: 'title',
      cell: (template) => <span className="font-medium">{template.title || 'Modelo sem título'}</span>,
    },
    { header: 'Categoria', sortKey: 'category', cell: (template) => template.category || '-' },
    { header: 'Versão atual', sortKey: 'currentVersion', cell: (template) => `v${template.version}` },
    { header: 'Seções', cell: (template) => template.sectionCount },
    { header: 'Itens', cell: (template) => template.itemCount },
    {
      header: 'Status',
      sortKey: 'status',
      cell: (template) => (
        <Badge tone={template.status === 'ACTIVE' ? 'success' : 'warning'}>
          {template.status === 'ACTIVE' ? 'Ativa' : 'Rascunho'}
        </Badge>
      ),
    },
    {
      header: 'Ações',
      cell: (template) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            className="h-8 px-2"
            onClick={() => navigate(`/app/inspection-templates/${template.id}/edit`)}
          >
            <Pencil size={16} />
            Editar
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-2"
            onClick={() => navigate(`/app/inspection-templates/${template.id}/preview`)}
          >
            <Eye size={16} />
            Prévia
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-2"
            aria-label={`Ver versões do modelo ${template.title || 'sem título'}`}
            onClick={() => setVersionsTemplate(template)}
          >
            <FileClock size={16} aria-hidden />
            Versões
          </Button>
          <Button variant="ghost" className="h-8 px-2">
            <Copy size={16} />
            Duplicar
          </Button>
        </div>
      ),
    },
  ]

  function createTemplate() {
    navigate('/app/inspection-templates/new')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos de inspeção"
        description="Crie e publique checklists utilizados pelos técnicos."
        action={
          <Button onClick={createTemplate}>
            <Plus size={17} />
            Novo modelo
          </Button>
        }
      />
      <Card className="grid gap-4 p-4 md:grid-cols-2">
        <Input
          label="Buscar"
          id="template-search"
          value={query}
          onChange={(event) => list.update('name', event.target.value)}
          placeholder="Título ou categoria"
        />
        <Select
          label="Status"
          id="template-status"
          value={status}
          onChange={(event) => list.update('status', event.target.value)}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Ativa</option>
          <option value="DRAFT">Rascunho</option>
        </Select>
      </Card>
      {error && <div role="alert" className="flex items-center justify-between gap-3 text-sm text-danger"><span>{error}</span><Button variant="secondary" onClick={() => void loadTemplates()}>Tentar novamente</Button></div>}
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        loadingLabel="Carregando modelos..."
        page={list.page + 1}
        pageSize={list.size}
        totalRows={totalElements}
        totalPages={totalPages}
        sort={list.sort}
        onSortChange={list.toggleSort}
        onPageChange={(next) => list.setPage(next - 1)}
        onPageSizeChange={list.setSize}
      />
      {versionsTemplate && (
        <TemplateVersionsModal template={versionsTemplate} onClose={() => setVersionsTemplate(null)} />
      )}
    </div>
  )
}

const versionDateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function formatPublishedAt(value: string) {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : versionDateFormatter.format(parsed)
}

/**
 * Lists the published versions of an inspection template (PBI-246, Part A).
 * Consumes the existing GET /inspection-templates/{id}/versions endpoint and
 * handles loading, empty and error (with retry) states. Mounted only while open,
 * so each opening fetches fresh. Switching the active version (Part B) is out of
 * scope: it depends on a product decision and backend changes.
 */
function TemplateVersionsModal({ template, onClose }: { template: TemplateSummary; onClose: () => void }) {
  const { state, reload } = useTemplateVersions(template.id)

  return (
    <Modal open title={`Versões de ${template.title || 'modelo sem título'}`} onClose={onClose}>
      {state.status === 'loading' && (
        <p role="status" className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="animate-spin" size={16} aria-hidden />
          Carregando versões...
        </p>
      )}
      {state.status === 'empty' && (
        <p className="text-sm text-muted">Este modelo ainda não possui versões publicadas.</p>
      )}
      {state.status === 'error' && (
        <ErrorState message="Não foi possível carregar as versões do modelo." onRetry={reload} />
      )}
      {state.status === 'ready' && (
        <ol className="space-y-3">
          {state.versions.map((version) => (
            <li key={version.id} className="rounded-fieldops border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">Versão v{version.versionNumber}</p>
                <Badge tone="success">Publicada</Badge>
              </div>
              <p className="mt-1 text-sm font-medium">{version.titleSnapshot}</p>
              {version.descriptionSnapshot && (
                <p className="mt-1 text-sm text-muted">{version.descriptionSnapshot}</p>
              )}
              <dl className="mt-2 grid gap-1 text-sm text-muted">
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-muted">Publicada em</dt>
                  <dd className="text-text">{formatPublishedAt(version.publishedAt)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-muted">Publicada por</dt>
                  <dd className="text-text">{version.publishedBy || '-'}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}
