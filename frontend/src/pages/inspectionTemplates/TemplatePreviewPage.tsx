import { ArrowLeft, Camera, MessageSquare } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminCatalogApi, type ManagedInspectionTemplate } from '@/api/adminCatalog'
import { ConfirmDialog } from '@/components/feedback/Modal'
import { Select, Textarea } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { byId, templates } from '@/mocks/domain'
import { PublicationIssuesDialog } from '@/pages/inspectionTemplates/PublicationIssuesDialog'
import { inspectionTemplatePendingIssues } from '@/pages/inspectionTemplates/templateValidation'
import { templateDraftStore } from '@/state/mockStores'
import { ResponseType, type InspectionTemplate, type TemplateItem, type TemplateSection } from '@/types/domain'

export function TemplatePreviewPage() {
  const navigate = useNavigate()
  const { id = 'tpl-compressor' } = useParams()
  const localTemplate = templateDraftStore.get(id) ?? byId(templates, id)
  const persistedTemplate = /^\d+$/.test(id)
  const [template, setTemplate] = useState<InspectionTemplate | null>(localTemplate ?? null)
  const [loading, setLoading] = useState(persistedTemplate)
  const [loadError, setLoadError] = useState('')
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [showPublicationIssues, setShowPublicationIssues] = useState(false)
  const publicationIssues = useMemo(() => template
    ? inspectionTemplatePendingIssues(template.title, template.category, template.sections)
    : [], [template])

  useEffect(() => {
    if (!persistedTemplate) return
    void adminCatalogApi.getTemplate(id)
      .then(response => setTemplate(toInspectionTemplate(response)))
      .catch(() => setLoadError('Nao foi possivel carregar a previa do modelo.'))
      .finally(() => setLoading(false))
  }, [id, persistedTemplate])

  async function publishTemplate() {
    if (!template || publicationIssues.length > 0 || publishing) return
    setPublishing(true)
    setPublishError('')
    try {
      const versionNumber = persistedTemplate
        ? (await adminCatalogApi.publishTemplate(id)).versionNumber
        : template.version + 1
      templateDraftStore.set({ ...template, status: 'Ativa', version: versionNumber })
      setConfirmPublish(false)
      navigate('/app/inspection-templates')
    } catch {
      setPublishError('Nao foi possivel publicar o modelo.')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return <Card className="p-8 text-center text-sm text-muted">Carregando previa...</Card>
  if (loadError) return <p role="alert" className="text-sm font-medium text-danger">{loadError}</p>
  if (!template) return <p role="alert" className="text-sm font-medium text-danger">Modelo nao encontrado.</p>

  const sections = orderedSections(template.sections)
  const itemCount = sections.reduce((total, section) => total + section.items.length, 0)

  return <div className="space-y-6">
    <Card className="p-5">
      <h1 className="text-2xl font-semibold">Previa: {template.title}</h1>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        <p>Categoria: {template.category}</p>
        <p>Secoes: {sections.length} | Itens: {itemCount}</p>
      </div>
    </Card>

    {publicationIssues.length > 0 && <Card className="flex flex-wrap items-center justify-between gap-3 border-danger-light/40 bg-danger-light/10 p-4 text-sm font-medium text-danger-dark" role="alert"><p>O modelo possui {publicationIssues.length} pendencia(s) para publicacao.</p><Button variant="secondary" onClick={() => setShowPublicationIssues(true)}>Ver pendencias</Button></Card>}
    {publishError && <p role="alert" className="text-sm font-medium text-danger">{publishError}</p>}

    <div className="mx-auto max-w-[460px] rounded-[28px] border border-border bg-slate-100 p-3 shadow-fieldops" aria-label="Previa do aplicativo do tecnico">
      <div className="overflow-hidden rounded-[22px] bg-app-bg">
        <div className="bg-primary px-5 py-5 text-white">
          <p className="text-sm opacity-85">FieldOps Mobile</p>
          <h2 className="mt-1 text-lg font-semibold">{template.title}</h2>
          <p className="text-sm opacity-85">v{template.version} - {template.category}</p>
          {template.description && <p className="mt-2 text-xs opacity-80">{template.description}</p>}
        </div>
        <div className="space-y-4 p-4">
          {sections.map((section, sectionIndex) => {
            const previousItemCount = sections.slice(0, sectionIndex)
              .reduce((total, previousSection) => total + previousSection.items.length, 0)
            return <Card key={section.id} className="p-4 shadow-none">
              <h3 className="mb-1 font-semibold">Secao {sectionIndex + 1}: {section.title}</h3>
              {section.description && <p className="mb-3 text-xs text-muted">{section.description}</p>}
              <div className="space-y-4">
                {section.items.map((item, itemIndex) => <PreviewItem key={item.id} item={item} number={previousItemCount + itemIndex + 1} />)}
              </div>
            </Card>
          })}
        </div>
      </div>
    </div>

    <div className="flex flex-wrap justify-between gap-3">
      <Link to={`/app/inspection-templates/${template.id}/edit`}><Button variant="secondary"><ArrowLeft size={16} />Voltar para edicao</Button></Link>
      <Button disabled={template.status !== 'Rascunho' || publicationIssues.length > 0 || publishing} onClick={() => setConfirmPublish(true)}>{publishing ? 'Publicando...' : 'Publicar versao'}</Button>
    </div>

    <ConfirmDialog open={confirmPublish} title="Publicar modelo?" description="Ao publicar, a versao nao podera ser alterada. Continuar?" confirmLabel="Continuar e publicar" onCancel={() => setConfirmPublish(false)} onConfirm={() => void publishTemplate()} />
    <PublicationIssuesDialog issues={publicationIssues} open={showPublicationIssues} onClose={() => setShowPublicationIssues(false)} />
  </div>
}

function PreviewItem({ item, number }: { item: TemplateItem; number: number }) {
  return <div className="border-t border-border pt-3 first:border-t-0 first:pt-0">
    <p className="text-sm font-medium">{number}. {item.question}{item.required && ' *'}</p>
    {item.description && <p className="mt-1 text-xs text-muted">{item.description}</p>}
    <div className="mt-3">{previewControl(item)}</div>
    <div className="mt-2 flex flex-wrap gap-2">
      {item.requireObservationOnFailure && <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-dark"><MessageSquare size={14} />Obs. na falha</span>}
      {item.requireEvidenceOnFailure && <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-dark"><Camera size={14} />Evid. na falha</span>}
    </div>
  </div>
}

function previewControl(item: TemplateItem): ReactNode {
  if (item.responseType === ResponseType.TEXT_SHORT) return <Input label="Resposta curta" id={`preview-${item.id}`} placeholder="Texto curto" disabled />
  if (item.responseType === ResponseType.TEXT_LONG) return <Textarea label="Resposta longa" id={`preview-${item.id}`} placeholder="Texto longo" disabled />
  if (item.responseType === ResponseType.NUMBER) return <Input label="Numero" id={`preview-${item.id}`} type="number" placeholder="0" disabled />
  if (item.responseType === ResponseType.BOOLEAN) return <div className="grid grid-cols-2 gap-2"><Button variant="secondary" className="h-9 px-2 text-xs" disabled>Sim</Button><Button variant="secondary" className="h-9 px-2 text-xs" disabled>Nao</Button></div>
  if (item.responseType === ResponseType.CONFORMITY) return <div className="grid grid-cols-3 gap-2"><Button variant="secondary" className="h-9 px-2 text-xs" disabled>Conforme</Button><Button variant="secondary" className="h-9 px-2 text-xs" disabled>Nao Conforme</Button><Button variant="secondary" className="h-9 px-2 text-xs" disabled>N/A</Button></div>
  if (item.responseType === ResponseType.SINGLE_CHOICE) return <Select label="Selecao unica" id={`preview-${item.id}`} disabled><option>Selecione</option>{(item.options ?? []).map(option => <option key={option}>{option}</option>)}</Select>
  return <Input label="Data" id={`preview-${item.id}`} type="date" disabled />
}

function orderedSections(sections: TemplateSection[]): TemplateSection[] {
  return [...sections]
    .sort((first, second) => (first.displayOrder ?? 0) - (second.displayOrder ?? 0))
    .map(section => ({
      ...section,
      items: [...section.items].sort((first, second) => (first.displayOrder ?? 0) - (second.displayOrder ?? 0)),
    }))
}

function toInspectionTemplate(template: ManagedInspectionTemplate): InspectionTemplate {
  return {
    id: template.id,
    title: template.title,
    category: template.category,
    description: template.description,
    version: template.currentVersion,
    status: template.status === 'DRAFT' ? 'Rascunho' : 'Ativa',
    sections: template.sections,
  }
}
