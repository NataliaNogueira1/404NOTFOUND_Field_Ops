import { ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adminCatalogApi } from '@/api/adminCatalog'
import { Badge } from '@/components/badges/Badge'
import { ConfirmDialog, Modal } from '@/components/feedback/Modal'
import { Toast } from '@/components/feedback/Toast'
import { Select, Textarea } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { byId, templates } from '@/mocks/domain'
import { templateDraftStore } from '@/state/mockStores'
import { ResponseType, type InspectionTemplate, type TemplateItem, type TemplateSection } from '@/types/domain'

type SectionDraft = Pick<TemplateSection, 'id' | 'title' | 'description'>

export function TemplateBuilderPage() {
  const navigate = useNavigate()
  const { id = 'tpl-compressor' } = useParams()
  const source = templateDraftStore.get(id) ?? byId(templates, id) ?? emptyPersistedDraft(id)
  const [title, setTitle] = useState(source.title)
  const [category, setCategory] = useState(source.category)
  const [description, setDescription] = useState(source.description)
  const [sections, setSections] = useState<TemplateSection[]>(orderedSections(source.sections))
  const [isDraft, setIsDraft] = useState(source.status === 'Rascunho')
  const [sectionDraft, setSectionDraft] = useState<SectionDraft | null>(null)
  const [deletingSection, setDeletingSection] = useState<TemplateSection | null>(null)
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: TemplateItem } | null>(null)
  const [publish, setPublish] = useState(false)
  const [toast, setToast] = useState(false)
  const [saveError, setSaveError] = useState('')
  const metadataValidation = useMemo(() => validateMetadata(title, category), [title, category])
  const publishValidation = useMemo(() => validateTemplate(title, category, sections), [title, category, sections])
  const persistedTemplate = /^\d+$/.test(id)

  useEffect(() => {
    if (!persistedTemplate) return
    void adminCatalogApi.getTemplate(id).then(template => {
      setTitle(template.title)
      setCategory(template.category)
      setDescription(template.description)
      setIsDraft(template.status === 'DRAFT')
      setSections(template.sections.map(section => ({ ...section, items: [] })))
    }).catch(() => setSaveError('Nao foi possivel carregar o modelo.'))
  }, [id, persistedTemplate])

  function draft(): InspectionTemplate {
    return { id, title, category, description, version: source.version, status: isDraft ? 'Rascunho' : 'Ativa', sections }
  }

  async function saveDraft(showToast = true) {
    templateDraftStore.set(draft())
    setSaveError('')
    try {
      if (persistedTemplate) {
        await adminCatalogApi.updateTemplate(id, {
          title: title.trim(), category: category.trim(), description: description.trim(),
        })
      }
      if (showToast) showSuccess()
    } catch {
      setSaveError('Nao foi possivel salvar o rascunho.')
    }
  }

  async function saveSection(section: SectionDraft) {
    const existingIndex = sections.findIndex(candidate => candidate.id === section.id)
    const displayOrder = existingIndex >= 0 ? existingIndex + 1 : sections.length + 1
    const input = { title: section.title.trim(), description: section.description?.trim() ?? '', displayOrder }
    setSaveError('')
    try {
      if (existingIndex >= 0) {
        if (persistedTemplate) await adminCatalogApi.updateTemplateSection(id, section.id, input)
        setSections(current => current.map(candidate => candidate.id === section.id
          ? { ...candidate, ...input }
          : candidate))
      } else {
        const created = persistedTemplate
          ? await adminCatalogApi.createTemplateSection(id, input)
          : { ...input, id: `sec-${Date.now()}` }
        setSections(current => [...current, { ...created, items: [] }])
      }
      setSectionDraft(null)
      showSuccess()
    } catch {
      setSaveError('Nao foi possivel salvar a secao.')
    }
  }

  async function moveSection(sectionId: string, direction: -1 | 1) {
    const currentIndex = sections.findIndex(section => section.id === sectionId)
    const targetIndex = currentIndex + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const original = sections
    const reordered = normalizeDisplayOrder(swap(sections, currentIndex, targetIndex))
    const moved = reordered[targetIndex]
    setSections(reordered)
    setSaveError('')
    try {
      if (persistedTemplate) {
        await adminCatalogApi.updateTemplateSection(id, moved.id, {
          title: moved.title, description: moved.description ?? '', displayOrder: targetIndex + 1,
        })
      }
    } catch {
      setSections(original)
      setSaveError('Nao foi possivel reordenar a secao.')
    }
  }

  async function deleteSection() {
    if (!deletingSection) return
    setSaveError('')
    try {
      if (persistedTemplate) await adminCatalogApi.deleteTemplateSection(id, deletingSection.id)
      setSections(current => normalizeDisplayOrder(current.filter(section => section.id !== deletingSection.id)))
      setDeletingSection(null)
      showSuccess()
    } catch {
      setSaveError('Nao foi possivel excluir a secao.')
    }
  }

  function moveItem(sectionId: string, itemId: string, direction: -1 | 1) {
    setSections(current => current.map(section => {
      if (section.id !== sectionId) return section
      const index = section.items.findIndex(item => item.id === itemId)
      const target = index + direction
      return target < 0 || target >= section.items.length
        ? section
        : { ...section, items: swap(section.items, index, target) }
    }))
  }

  function saveItem(sectionId: string, item: TemplateItem) {
    setSections(current => current.map(section => section.id === sectionId
      ? { ...section, items: section.items.some(candidate => candidate.id === item.id)
          ? section.items.map(candidate => candidate.id === item.id ? item : candidate)
          : [...section.items, item] }
      : section))
    setEditingItem(null)
  }

  function showSuccess() {
    setToast(true)
    setTimeout(() => setToast(false), 1800)
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/inspection-templates"><ArrowLeft size={16} />Modelos</Link>
        <div className="flex items-center gap-3"><h1 className="text-2xl font-semibold">{title || 'Modelo sem titulo'}</h1><Badge tone={isDraft ? 'warning' : 'success'}>{isDraft ? 'Rascunho' : 'Ativo'}</Badge></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => { void saveDraft(false).then(() => navigate(`/app/inspection-templates/${id}/preview`)) }}>Previa</Button>
        <Button variant="secondary" onClick={() => void saveDraft(true)} disabled={!isDraft || Boolean(metadataValidation)}>Salvar</Button>
        <Button onClick={() => setPublish(true)} disabled={!isDraft || Boolean(publishValidation)}>Publicar</Button>
      </div>
    </div>
    {publishValidation && <Card className="border-danger-light/40 bg-danger-light/10 p-4 text-sm font-medium text-danger-dark">{publishValidation}</Card>}
    {saveError && <p role="alert" className="text-sm font-medium text-danger">{saveError}</p>}
    <Card className="grid gap-4 p-5 md:grid-cols-2">
      <Input label="Titulo" id="tpl-title" maxLength={200} value={title} disabled={!isDraft} onChange={event => setTitle(event.target.value)} />
      <Input label="Categoria" id="tpl-category" value={category} disabled={!isDraft} onChange={event => setCategory(event.target.value)} />
      <div className="md:col-span-2"><Textarea label="Descricao" id="tpl-description" value={description} disabled={!isDraft} onChange={event => setDescription(event.target.value)} /></div>
    </Card>
    <div className="space-y-4">
      {sections.map((section, index) => <SectionCard key={section.id} section={section} index={index} count={sections.length} editable={isDraft}
        onMove={direction => void moveSection(section.id, direction)}
        onEdit={() => setSectionDraft(section)} onDelete={() => setDeletingSection(section)}
        onAddItem={() => setEditingItem({ sectionId: section.id, item: blankItem() })}
        onMoveItem={(itemId, direction) => moveItem(section.id, itemId, direction)}
        onEditItem={item => setEditingItem({ sectionId: section.id, item })}
        onDeleteItem={itemId => setSections(current => current.map(candidate => candidate.id === section.id ? { ...candidate, items: candidate.items.filter(item => item.id !== itemId) } : candidate))} />)}
      <Button variant="secondary" disabled={!isDraft} onClick={() => setSectionDraft({ id: '', title: '', description: '' })}><Plus size={17} />Adicionar secao</Button>
    </div>
    {sectionDraft && <SectionModal key={sectionDraft.id || 'new'} draft={sectionDraft} onClose={() => setSectionDraft(null)} onSave={section => void saveSection(section)} />}
    {editingItem && <ItemModal key={editingItem.item.id} data={editingItem} onClose={() => setEditingItem(null)} onSave={saveItem} />}
    <ConfirmDialog open={Boolean(deletingSection)} title="Excluir secao?" description="Esta acao tambem exclui os itens vinculados a secao." confirmLabel="Excluir secao" variant="danger" onCancel={() => setDeletingSection(null)} onConfirm={() => void deleteSection()} />
    <ConfirmDialog open={publish} title="Publicar modelo?" description="Validacao simulada concluida. Uma nova versao ficara disponivel para agendamento." confirmLabel="Publicar" onCancel={() => setPublish(false)} onConfirm={() => { void saveDraft(false); setPublish(false); showSuccess() }} />
    <Toast show={toast} message="Alteracao salva com sucesso" />
  </div>
}

function SectionCard({ section, index, count, editable, onMove, onEdit, onDelete, onAddItem, onMoveItem, onEditItem, onDeleteItem }: {
  section: TemplateSection; index: number; count: number; editable: boolean
  onMove: (direction: -1 | 1) => void; onEdit: () => void; onDelete: () => void; onAddItem: () => void
  onMoveItem: (itemId: string, direction: -1 | 1) => void; onEditItem: (item: TemplateItem) => void; onDeleteItem: (itemId: string) => void
}) {
  return <Card className="p-5">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase text-muted">Secao {index + 1}</p><h2 className="mt-1 text-lg font-semibold">{section.title}</h2>{section.description && <p className="mt-1 text-sm text-muted">{section.description}</p>}</div>
      <div className="flex flex-wrap gap-1">
        <Button variant="ghost" className="h-9 px-2" aria-label={`Mover ${section.title} para cima`} disabled={!editable || index === 0} onClick={() => onMove(-1)}><ArrowUp size={16} /></Button>
        <Button variant="ghost" className="h-9 px-2" aria-label={`Mover ${section.title} para baixo`} disabled={!editable || index === count - 1} onClick={() => onMove(1)}><ArrowDown size={16} /></Button>
        <Button variant="ghost" className="h-9 px-2" aria-label={`Editar ${section.title}`} disabled={!editable} onClick={onEdit}><Pencil size={16} /></Button>
        <Button variant="ghost" className="h-9 px-2" aria-label={`Excluir ${section.title}`} disabled={!editable} onClick={onDelete}><Trash2 size={16} /></Button>
      </div>
    </div>
    <div className="space-y-3">
      {section.items.map((item, itemIndex) => <div key={item.id} className="rounded-fieldops border border-border bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div><p className="font-medium">{itemIndex + 1}. {item.question || 'Item sem pergunta'}</p><div className="mt-2 flex flex-wrap gap-2"><Badge tone="primary">{item.responseType}</Badge>{item.required && <Badge tone="warning">Obrigatorio</Badge>}{item.requireObservationOnFailure && <Badge tone="danger">Observacao na falha</Badge>}{item.requireEvidenceOnFailure && <Badge tone="danger">Evidencia na falha</Badge>}</div></div>
          <div className="flex gap-1"><Button variant="ghost" className="h-8 px-2" onClick={() => onMoveItem(item.id, -1)}><ArrowUp size={16} /></Button><Button variant="ghost" className="h-8 px-2" onClick={() => onMoveItem(item.id, 1)}><ArrowDown size={16} /></Button><Button variant="ghost" className="h-8 px-2" onClick={() => onEditItem(item)}><Pencil size={16} /></Button><Button variant="ghost" className="h-8 px-2" onClick={() => onDeleteItem(item.id)}><Trash2 size={16} /></Button></div>
        </div>
      </div>)}
      {section.items.length === 0 && <p className="rounded-fieldops border border-dashed border-border p-4 text-sm text-muted">Itens serao adicionados aqui.</p>}
    </div>
    <Button variant="secondary" className="mt-4" disabled={!editable} onClick={onAddItem}><Plus size={16} />Adicionar item a secao</Button>
  </Card>
}

function SectionModal({ draft, onClose, onSave }: { draft: SectionDraft; onClose: () => void; onSave: (draft: SectionDraft) => void }) {
  const [form, setForm] = useState<SectionDraft>(draft)
  return <Modal open title={draft.id ? 'Editar secao' : 'Adicionar secao'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={!form.title.trim()} onClick={() => onSave(form)}>Salvar secao</Button></>}>
    <div className="space-y-4"><Input label="Titulo da secao" id="section-title" maxLength={200} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /><Textarea label="Descricao da secao" id="section-description" value={form.description ?? ''} onChange={event => setForm({ ...form, description: event.target.value })} /></div>
  </Modal>
}

function emptyPersistedDraft(id: string): InspectionTemplate {
  return { id, title: '', category: '', description: '', version: 0, status: 'Rascunho', sections: [] }
}

function orderedSections(sections: TemplateSection[]) {
  return normalizeDisplayOrder([...sections].sort((first, second) => (first.displayOrder ?? 0) - (second.displayOrder ?? 0)))
}

function normalizeDisplayOrder(sections: TemplateSection[]) {
  return sections.map((section, index) => ({ ...section, displayOrder: index + 1 }))
}

function swap<T>(values: T[], first: number, second: number) {
  const result = [...values]
  ;[result[first], result[second]] = [result[second], result[first]]
  return result
}

function validateMetadata(title: string, category: string) {
  if (!title.trim()) return 'Informe o titulo do modelo.'
  if (title.length > 200) return 'Use no maximo 200 caracteres no titulo.'
  if (!category.trim()) return 'Informe a categoria do modelo.'
  return ''
}

function validateTemplate(title: string, category: string, sections: TemplateSection[]) {
  const metadataError = validateMetadata(title, category)
  if (metadataError) return metadataError
  if (sections.length === 0) return 'Adicione pelo menos uma secao.'
  if (sections.some(section => !section.title.trim())) return 'Todas as secoes precisam de titulo.'
  if (sections.some(section => section.items.length === 0)) return 'Todas as secoes precisam de pelo menos um item.'
  if (sections.some(section => section.items.some(item => !item.question.trim()))) return 'Todos os itens precisam de pergunta.'
  if (sections.some(section => section.items.some(item => item.responseType === ResponseType.SINGLE_CHOICE && (!item.options || item.options.length === 0)))) return 'Itens SINGLE_CHOICE precisam de opcoes.'
  return ''
}

function blankItem(): TemplateItem { return { id: `item-${Date.now()}`, question: '', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: false, requireEvidenceOnFailure: false } }

function ItemModal({ data, onClose, onSave }: { data: { sectionId: string; item: TemplateItem }; onClose: () => void; onSave: (sectionId: string, item: TemplateItem) => void }) {
  const [draft, setDraft] = useState<TemplateItem>(data.item)
  const error = !draft.question.trim() ? 'Informe a pergunta do item.' : draft.responseType === ResponseType.SINGLE_CHOICE && (!draft.options || draft.options.length === 0) ? 'Informe pelo menos uma opcao.' : ''
  return <Modal open title="Item do checklist" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(error)} onClick={() => onSave(data.sectionId, draft)}>Salvar item</Button></>}><div className="space-y-4"><Input label="Pergunta" id="item-question" value={draft.question} onChange={event => setDraft({ ...draft, question: event.target.value })} /><Textarea label="Descricao" id="item-desc" value={draft.description ?? ''} onChange={event => setDraft({ ...draft, description: event.target.value })} /><Select label="Tipo de resposta" id="item-type" value={draft.responseType} onChange={event => setDraft({ ...draft, responseType: event.target.value as ResponseType })}>{Object.values(ResponseType).map(value => <option key={value}>{value}</option>)}</Select><div className="grid gap-3 sm:grid-cols-3">{[['required','Item obrigatorio'], ['requireObservationOnFailure','Observacao obrigatoria na falha'], ['requireEvidenceOnFailure','Evidencia obrigatoria na falha']].map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-fieldops border border-border p-3 text-sm"><input type="checkbox" checked={Boolean(draft[key as keyof TemplateItem])} onChange={event => setDraft({ ...draft, [key]: event.target.checked })} />{label}</label>)}</div>{draft.responseType === ResponseType.SINGLE_CHOICE && <Input label="Opcoes" id="item-options" value={(draft.options ?? []).join(', ')} onChange={event => setDraft({ ...draft, options: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} />}{error && <p className="text-sm font-medium text-danger">{error}</p>}</div></Modal>
}
