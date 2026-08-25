import { ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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

export function TemplateBuilderPage() {
  const navigate = useNavigate()
  const { id = 'tpl-compressor' } = useParams()
  const source = templateDraftStore.get(id) ?? byId(templates, id) ?? templates[0]
  const [title, setTitle] = useState(source.title)
  const [category, setCategory] = useState(source.category)
  const [description, setDescription] = useState(source.description)
  const [sections, setSections] = useState<TemplateSection[]>(source.sections)
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: TemplateItem } | null>(null)
  const [publish, setPublish] = useState(false)
  const [toast, setToast] = useState(false)
  const validation = useMemo(() => validateTemplate(title, category, sections), [title, category, sections])

  function draft(): InspectionTemplate {
    return { id, title, category, description, version: source.version, status: 'Rascunho', sections }
  }

  function saveDraft(showToast = true) {
    templateDraftStore.set(draft())
    if (showToast) {
      setToast(true)
      setTimeout(() => setToast(false), 1800)
    }
  }

  function move(sectionId: string, itemId: string, dir: -1 | 1) {
    setSections(current => current.map(section => {
      if (section.id !== sectionId) return section
      const index = section.items.findIndex(item => item.id === itemId)
      const next = index + dir
      if (next < 0 || next >= section.items.length) return section
      const items = [...section.items]
      ;[items[index], items[next]] = [items[next], items[index]]
      return { ...section, items }
    }))
  }

  function moveSection(sectionId: string, dir: -1 | 1) {
    setSections(current => {
      const index = current.findIndex(section => section.id === sectionId)
      const next = index + dir
      if (next < 0 || next >= current.length) return current
      const sectionsDraft = [...current]
      ;[sectionsDraft[index], sectionsDraft[next]] = [sectionsDraft[next], sectionsDraft[index]]
      return sectionsDraft
    })
  }

  function saveItem(sectionId: string, item: TemplateItem) {
    setSections(current => current.map(section => section.id === sectionId ? { ...section, items: section.items.some(i => i.id === item.id) ? section.items.map(i => i.id === item.id ? item : i) : [...section.items, item] } : section))
    setEditingItem(null)
  }

  return <div className="space-y-6"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/inspection-templates"><ArrowLeft size={16} />Modelos</Link><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold">{title || 'Modelo sem titulo'}</h1><Badge tone="warning">Rascunho</Badge></div></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { saveDraft(false); navigate(`/app/inspection-templates/${id}/preview`) }}>Previa</Button><Button variant="secondary" onClick={() => saveDraft(true)} disabled={Boolean(validation)}>Salvar</Button><Button onClick={() => setPublish(true)} disabled={Boolean(validation)}>Publicar</Button></div></div>{validation && <Card className="border-danger-light/40 bg-danger-light/10 p-4 text-sm font-medium text-danger-dark">{validation}</Card>}<Card className="grid gap-4 p-5 md:grid-cols-2"><Input label="Titulo" id="tpl-title" value={title} onChange={e => setTitle(e.target.value)} /><Input label="Categoria" id="tpl-category" value={category} onChange={e => setCategory(e.target.value)} /><div className="md:col-span-2"><Textarea label="Descricao" id="tpl-description" value={description} onChange={e => setDescription(e.target.value)} /></div></Card><div className="space-y-4">{sections.map((section, sectionIndex) => <Card key={section.id} className="p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-muted">Secao {sectionIndex + 1}</p><Input label="Titulo da secao" id={`sec-${section.id}`} value={section.title} onChange={e => setSections(current => current.map(item => item.id === section.id ? { ...item, title: e.target.value } : item))} /></div><div className="flex gap-1"><Button variant="ghost" className="h-9 px-2" onClick={() => moveSection(section.id, -1)}><ArrowUp size={16} />Secao</Button><Button variant="ghost" className="h-9 px-2" onClick={() => moveSection(section.id, 1)}><ArrowDown size={16} />Secao</Button><Button variant="secondary" onClick={() => setEditingItem({ sectionId: section.id, item: blankItem() })}><Plus size={16} />Adicionar item</Button><Button variant="ghost" onClick={() => setSections(current => current.filter(item => item.id !== section.id))}><Trash2 size={16} /></Button></div></div><div className="space-y-3">{section.items.map((item, itemIndex) => <div key={item.id} className="rounded-fieldops border border-border bg-slate-50 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><p className="font-medium">{itemIndex + 1}. {item.question || 'Item sem pergunta'}</p><div className="mt-2 flex flex-wrap gap-2"><Badge tone="primary">{item.responseType}</Badge>{item.required && <Badge tone="warning">Obrigatorio</Badge>}{item.requireObservationOnFailure && <Badge tone="danger">Observacao na falha</Badge>}{item.requireEvidenceOnFailure && <Badge tone="danger">Evidencia na falha</Badge>}</div></div><div className="flex gap-1"><Button variant="ghost" className="h-8 px-2" onClick={() => move(section.id, item.id, -1)}><ArrowUp size={16} /></Button><Button variant="ghost" className="h-8 px-2" onClick={() => move(section.id, item.id, 1)}><ArrowDown size={16} /></Button><Button variant="ghost" className="h-8 px-2" onClick={() => setEditingItem({ sectionId: section.id, item })}><Pencil size={16} /></Button><Button variant="ghost" className="h-8 px-2" onClick={() => setSections(current => current.map(sec => sec.id === section.id ? { ...sec, items: sec.items.filter(i => i.id !== item.id) } : sec))}><Trash2 size={16} /></Button></div></div></div>)}</div></Card>)}<Button variant="secondary" onClick={() => setSections(current => [...current, { id: `sec-${Date.now()}`, title: 'Nova secao', items: [] }])}><Plus size={17} />Adicionar secao</Button></div><ItemModal data={editingItem} onClose={() => setEditingItem(null)} onSave={saveItem} /><ConfirmDialog open={publish} title="Publicar modelo?" description="Validacao simulada concluida. Uma nova versao ficara disponivel para agendamento." confirmLabel="Publicar" onCancel={() => setPublish(false)} onConfirm={() => { saveDraft(false); setPublish(false); setToast(true); setTimeout(() => setToast(false), 1800) }} /><Toast show={toast} message="Alteracao salva no prototipo" /></div>
}

function validateTemplate(title: string, category: string, sections: TemplateSection[]) {
  if (!title.trim()) return 'Informe o titulo do modelo.'
  if (!category.trim()) return 'Informe a categoria do modelo.'
  if (sections.length === 0) return 'Adicione pelo menos uma secao.'
  if (sections.some(section => !section.title.trim())) return 'Todas as secoes precisam de titulo.'
  if (sections.some(section => section.items.length === 0)) return 'Todas as secoes precisam de pelo menos um item.'
  if (sections.some(section => section.items.some(item => !item.question.trim()))) return 'Todos os itens precisam de pergunta.'
  if (sections.some(section => section.items.some(item => item.responseType === ResponseType.SINGLE_CHOICE && (!item.options || item.options.length === 0)))) return 'Itens SINGLE_CHOICE precisam de opcoes.'
  return ''
}

function blankItem(): TemplateItem { return { id: `item-${Date.now()}`, question: '', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: false, requireEvidenceOnFailure: false } }

function ItemModal({ data, onClose, onSave }: { data: { sectionId: string; item: TemplateItem } | null; onClose: () => void; onSave: (sectionId: string, item: TemplateItem) => void }) {
  const [draft, setDraft] = useState<TemplateItem | null>(data?.item ?? null)
  if (data && draft?.id !== data.item.id) setDraft(data.item)
  if (!data || !draft) return null
  const error = !draft.question.trim() ? 'Informe a pergunta do item.' : draft.responseType === ResponseType.SINGLE_CHOICE && (!draft.options || draft.options.length === 0) ? 'Informe pelo menos uma opcao.' : ''
  return <Modal open={Boolean(data)} title="Item do checklist" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(error)} onClick={() => onSave(data.sectionId, draft)}>Salvar item</Button></>}><div className="space-y-4"><Input label="Pergunta" id="item-question" value={draft.question} onChange={e => setDraft({ ...draft, question: e.target.value })} /><Textarea label="Descricao" id="item-desc" value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} /><Select label="Tipo de resposta" id="item-type" value={draft.responseType} onChange={e => setDraft({ ...draft, responseType: e.target.value as ResponseType })}>{Object.values(ResponseType).map(value => <option key={value}>{value}</option>)}</Select><div className="grid gap-3 sm:grid-cols-3">{[['required','Item obrigatorio'], ['requireObservationOnFailure','Observacao obrigatoria na falha'], ['requireEvidenceOnFailure','Evidencia obrigatoria na falha']].map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-fieldops border border-border p-3 text-sm"><input type="checkbox" checked={Boolean(draft[key as keyof TemplateItem])} onChange={e => setDraft({ ...draft, [key]: e.target.checked })} />{label}</label>)}</div>{draft.responseType === ResponseType.SINGLE_CHOICE && <Input label="Opcoes" id="item-options" value={(draft.options ?? []).join(', ')} onChange={e => setDraft({ ...draft, options: e.target.value.split(',').map(value => value.trim()).filter(Boolean) })} />}{error && <p className="text-sm font-medium text-danger">{error}</p>}</div></Modal>
}
