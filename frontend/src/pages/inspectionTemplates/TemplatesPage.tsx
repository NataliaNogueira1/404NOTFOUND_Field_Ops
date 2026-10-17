import { Copy, Eye, FileClock, Pencil, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type TemplateListStatus, type TemplateSummary, adminCatalogApi } from '@/api/adminCatalog'
import { Badge } from '@/components/badges/Badge'
import { Select } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useDebouncedValue, useListQuery } from '@/hooks/useListQuery'

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
      setError('Nao foi possivel carregar os modelos. Tente novamente.')
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
      header: 'Titulo',
      sortKey: 'title',
      cell: (template) => <span className="font-medium">{template.title || 'Modelo sem titulo'}</span>,
    },
    { header: 'Categoria', sortKey: 'category', cell: (template) => template.category || '-' },
    { header: 'Versao atual', sortKey: 'currentVersion', cell: (template) => `v${template.version}` },
    { header: 'Secoes', cell: (template) => template.sectionCount },
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
      header: 'Acoes',
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
            Previa
          </Button>
          <Button variant="ghost" className="h-8 px-2">
            <FileClock size={16} />
            Versoes
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
        title="Modelos de inspecao"
        description="Crie e publique checklists utilizados pelos tecnicos."
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
          placeholder="Titulo ou categoria"
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
    </div>
  )
}
