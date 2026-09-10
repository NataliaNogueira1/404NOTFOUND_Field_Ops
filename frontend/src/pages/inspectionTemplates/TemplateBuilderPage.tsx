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
import { validateInspectionTemplate, validateTemplateMetadata } from '@/pages/inspectionTemplates/templateValidation'

type SectionDraft = Pick<TemplateSection, 'id' | 'title' | 'description'>
type OptionDraft = { id: string; value: string }

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
  const metadataValidation = useMemo(() => validateTemplateMetadata(title, category), [title, category])
  const publishValidation = useMemo(() => validateInspectionTemplate(title, category, sections), [title, category, sections])
  const persistedTemplate = /^\d+$/.test(id)

  useEffect(() => {
    if (!persistedTemplate) return
    void adminCatalogApi.getTemplate(id).then(template => {
      setTitle(template.title)
      setCategory(template.category)
      setDescription(template.description)
      setIsDraft(template.status === 'DRAFT')
      setSections(template.sections.map(section => ({ ...section, items: orderedItems(section.items) })))
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

  async function moveItem(sectionId: string, itemId: string, direction: -1 | 1) {
    const section = sections.find(candidate => candidate.id === sectionId)
    if (!section) return
    const currentIndex = section.items.findIndex(item => item.id === itemId)
    const targetIndex = currentIndex + direction
    if (targetIndex < 0 || targetIndex >= section.items.length) return
    const original = sections
    const reorderedItems = normalizeItemOrder(swap(section.items, currentIndex, targetIndex))
    const moved = reorderedItems[targetIndex]
    setSections(current => current.map(candidate => candidate.id === sectionId
      ? { ...candidate, items: reorderedItems }
      : candidate))
    setSaveError('')
    try {
      if (persistedTemplate) {
        await adminCatalogApi.updateTemplateItem(id, sectionId, moved.id, itemInput(moved, targetIndex + 1))
      }
    } catch {
      setSections(original)
      setSaveError('Nao foi possivel reordenar o item.')
    }
  }

  async function saveItem(sectionId: string, item: TemplateItem) {
    const section = sections.find(candidate => candidate.id === sectionId)
    if (!section) return
    const existingIndex = section.items.findIndex(candidate => candidate.id === item.id)
    const displayOrder = existingIndex >= 0 ? existingIndex + 1 : section.items.length + 1
    setSaveError('')
    try {
      const saved = persistedTemplate
        ? existingIndex >= 0
          ? await adminCatalogApi.updateTemplateItem(id, sectionId, item.id, itemInput(item, displayOrder))
          : await adminCatalogApi.createTemplateItem(id, sectionId, itemInput(item, displayOrder))
        : { ...item, displayOrder }
      setSections(current => current.map(candidate => candidate.id === sectionId
        ? { ...candidate, items: existingIndex >= 0
            ? candidate.items.map(currentItem => currentItem.id === item.id ? saved : currentItem)
            : [...candidate.items, saved] }
        : candidate))
      setEditingItem(null)
      showSuccess()
    } catch {
      setSaveError('Nao foi possivel salvar o item.')
    }
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
        onMoveItem={(itemId, direction) => void moveItem(section.id, itemId, direction)}
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
          <div><p className="font-medium">{item.question || 'Item sem pergunta'}</p><div className="mt-2 flex flex-wrap gap-2"><Badge tone="primary">{responseTypeLabels[item.responseType]}</Badge><Badge tone="primary">Ordem {itemIndex + 1}</Badge>{item.required && <Badge tone="warning">Obrigatorio</Badge>}{item.requireObservationOnFailure && <Badge tone="danger">Observacao na falha</Badge>}{item.requireEvidenceOnFailure && <Badge tone="danger">Evidencia na falha</Badge>}</div></div>
          <div className="flex gap-1"><Button variant="ghost" className="h-8 px-2" aria-label={`Mover ${item.question} para cima`} disabled={itemIndex === 0} onClick={() => onMoveItem(item.id, -1)}><ArrowUp size={16} /></Button><Button variant="ghost" className="h-8 px-2" aria-label={`Mover ${item.question} para baixo`} disabled={itemIndex === section.items.length - 1} onClick={() => onMoveItem(item.id, 1)}><ArrowDown size={16} /></Button><Button variant="ghost" className="h-8 px-2" aria-label={`Editar ${item.question}`} onClick={() => onEditItem(item)}><Pencil size={16} /></Button><Button variant="ghost" className="h-8 px-2" aria-label={`Excluir ${item.question}`} onClick={() => onDeleteItem(item.id)}><Trash2 size={16} /></Button></div>
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

function normalizeItemOrder(items: TemplateItem[]) {
  return items.map((item, index) => ({ ...item, displayOrder: index + 1 }))
}

function orderedItems(items: TemplateItem[]) {
  return normalizeItemOrder([...items].sort((first, second) => (first.displayOrder ?? 0) - (second.displayOrder ?? 0)))
}

function itemInput(item: TemplateItem, displayOrder: number) {
  return {
    title: item.question.trim(),
    description: item.description?.trim() ?? '',
    responseType: item.responseType,
    required: item.required,
    observationRequiredOnFailure: item.requireObservationOnFailure,
    evidenceRequiredOnFailure: item.requireEvidenceOnFailure,
    optionsJson: item.responseType === ResponseType.SINGLE_CHOICE ? item.options ?? [] : null,
    displayOrder,
  }
}

function swap<T>(values: T[], first: number, second: number) {
  const result = [...values]
  ;[result[first], result[second]] = [result[second], result[first]]
  return result
}

const responseTypeLabels: Record<ResponseType, string> = {
  [ResponseType.TEXT_SHORT]: 'Texto curto',
  [ResponseType.TEXT_LONG]: 'Texto longo',
  [ResponseType.NUMBER]: 'Numero',
  [ResponseType.BOOLEAN]: 'Sim/Nao',
  [ResponseType.CONFORMITY]: 'Conforme/Nao Conforme',
  [ResponseType.SINGLE_CHOICE]: 'Selecao unica',
  [ResponseType.DATE]: 'Data',
}

function blankItem(): TemplateItem { return { id: `item-${Date.now()}`, question: '', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: false, requireEvidenceOnFailure: false } }

function ItemModal({ data, onClose, onSave }: { data: { sectionId: string; item: TemplateItem }; onClose: () => void; onSave: (sectionId: string, item: TemplateItem) => void }) {
  const [draft, setDraft] = useState<TemplateItem>(data.item)
  const [optionDrafts, setOptionDrafts] = useState<OptionDraft[]>(() => (data.item.options ?? []).map((value, index) => ({ id: `${data.item.id}-option-${index}`, value })))
  const validOptions = (draft.options ?? []).filter(option => option.trim()).length >= 2
  const error = !draft.question.trim()
    ? 'Informe a pergunta do item.'
    : draft.responseType === ResponseType.SINGLE_CHOICE && !validOptions
      ? 'Informe pelo menos duas opcoes.'
      : ''

  function changeResponseType(responseType: ResponseType) {
    const choices = optionDrafts.length > 0 ? optionDrafts : newOptions(2)
    if (responseType === ResponseType.SINGLE_CHOICE && optionDrafts.length === 0) setOptionDrafts(choices)
    setDraft({ ...draft, responseType, options: responseType === ResponseType.SINGLE_CHOICE ? choices.map(option => option.value) : undefined })
  }

  function changeOption(optionId: string, value: string) {
    const choices = optionDrafts.map(option => option.id === optionId ? { ...option, value } : option)
    setOptionDrafts(choices)
    setDraft({ ...draft, options: choices.map(option => option.value) })
  }

  function removeOption(optionId: string) {
    const choices = optionDrafts.filter(option => option.id !== optionId)
    setOptionDrafts(choices)
    setDraft({ ...draft, options: choices.map(option => option.value) })
  }

  function addOption() {
    const choices = [...optionDrafts, ...newOptions(1)]
    setOptionDrafts(choices)
    setDraft({ ...draft, options: choices.map(option => option.value) })
  }

  return <Modal open title="Item do checklist" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(error)} onClick={() => onSave(data.sectionId, draft)}>Salvar item</Button></>}>
    <div className="space-y-4">
      <Input label="Titulo (pergunta)" id="item-question" maxLength={500} value={draft.question} onChange={event => setDraft({ ...draft, question: event.target.value })} />
      <Textarea label="Descricao (ajuda)" id="item-desc" maxLength={1000} value={draft.description ?? ''} onChange={event => setDraft({ ...draft, description: event.target.value })} />
      <Select label="Tipo de resposta" id="item-type" value={draft.responseType} onChange={event => changeResponseType(event.target.value as ResponseType)}>{Object.values(ResponseType).map(value => <option key={value} value={value}>{responseTypeLabels[value]}</option>)}</Select>
      <label className="flex items-center gap-2 rounded-fieldops border border-border p-3 text-sm"><input type="checkbox" checked={draft.required} onChange={event => setDraft({ ...draft, required: event.target.checked })} />Item obrigatorio</label>
      <label className="flex items-center gap-2 rounded-fieldops border border-border p-3 text-sm"><input type="checkbox" checked={draft.requireObservationOnFailure} onChange={event => setDraft({ ...draft, requireObservationOnFailure: event.target.checked })} />Observacao obrigatoria na falha</label>
      <label className="flex items-center gap-2 rounded-fieldops border border-border p-3 text-sm"><input type="checkbox" checked={draft.requireEvidenceOnFailure} onChange={event => setDraft({ ...draft, requireEvidenceOnFailure: event.target.checked })} />Evidencia obrigatoria na falha</label>
      {draft.responseType === ResponseType.SINGLE_CHOICE && <div className="space-y-3">
        <p className="text-sm font-medium">Opcoes de resposta</p>
        {optionDrafts.map((option, index) => <div key={option.id} className="flex items-end gap-2"><div className="flex-1"><Input label={`Opcao ${index + 1}`} id={`item-option-${option.id}`} value={option.value} onChange={event => changeOption(option.id, event.target.value)} /></div><Button variant="ghost" className="mb-0.5 px-2" aria-label={`Remover opcao ${index + 1}`} onClick={() => removeOption(option.id)}><Trash2 size={16} /></Button></div>)}
        <Button variant="secondary" onClick={addOption}><Plus size={16} />Adicionar opcao</Button>
      </div>}
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
    </div>
  </Modal>
}

let optionSequence = 0
function newOptions(count: number): OptionDraft[] {
  return Array.from({ length: count }, () => ({ id: `new-option-${optionSequence++}`, value: '' }))
}
