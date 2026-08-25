import { ArrowLeft, Camera, MessageSquare } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/badges/Badge'
import { Select, Textarea } from '@/components/forms/Fields'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { byId, templates } from '@/mocks/domain'
import { templateDraftStore } from '@/state/mockStores'
import { ResponseType, type TemplateItem } from '@/types/domain'

export function TemplatePreviewPage() {
  const { id = 'tpl-compressor' } = useParams()
  const template = templateDraftStore.get(id) ?? byId(templates, id) ?? templates[0]
  return <div className="space-y-6"><div><Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to={`/app/inspection-templates/${template.id}/edit`}><ArrowLeft size={16} />Voltar para edicao</Link><h1 className="text-2xl font-semibold">Previa do checklist</h1><p className="text-sm text-muted">Visual aproximado para o app do tecnico, usando o draft atual em memoria.</p></div><div className="mx-auto max-w-[460px] rounded-[28px] border border-border bg-slate-100 p-3 shadow-fieldops"><div className="overflow-hidden rounded-[22px] bg-app-bg"><div className="bg-primary px-5 py-5 text-white"><p className="text-sm opacity-85">FieldOps Mobile</p><h2 className="mt-1 text-lg font-semibold">{template.title}</h2><p className="text-sm opacity-85">v{template.version} - {template.category}</p>{template.description && <p className="mt-2 text-xs opacity-80">{template.description}</p>}</div><div className="space-y-4 p-4">{template.sections.map(section => <Card key={section.id} className="p-4 shadow-none"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{section.title}</h3><Badge tone="primary">{section.items.length} itens</Badge></div><div className="space-y-4">{section.items.map((item, itemIndex) => <div key={item.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0"><p className="text-sm font-medium">{itemIndex + 1}. {item.question}{item.required && ' *'}</p>{item.description && <p className="mt-1 text-xs text-muted">{item.description}</p>}<div className="mt-3">{previewControl(item)}</div>{item.requireObservationOnFailure && <p className="mt-2 flex items-center gap-2 text-xs text-warning-dark"><MessageSquare size={14} />Observacao obrigatoria na falha</p>}{item.requireEvidenceOnFailure && <p className="mt-1 flex items-center gap-2 text-xs text-danger-dark"><Camera size={14} />Evidencia obrigatoria na falha</p>}</div>)}</div></Card>)}</div></div></div></div>
}

function previewControl(item: TemplateItem) {
  if (item.responseType === ResponseType.TEXT_SHORT) return <Input label="Resposta curta" id={`preview-${item.id}`} placeholder="Texto curto" readOnly />
  if (item.responseType === ResponseType.TEXT_LONG) return <Textarea label="Resposta longa" id={`preview-${item.id}`} placeholder="Texto longo" readOnly />
  if (item.responseType === ResponseType.NUMBER) return <Input label="Numero" id={`preview-${item.id}`} type="number" placeholder="0" readOnly />
  if (item.responseType === ResponseType.BOOLEAN) return <div className="grid grid-cols-2 gap-2"><Button variant="secondary" className="h-9 px-2 text-xs">Sim</Button><Button variant="secondary" className="h-9 px-2 text-xs">Nao</Button></div>
  if (item.responseType === ResponseType.CONFORMITY) return <div className="grid grid-cols-3 gap-2"><Button variant="secondary" className="h-9 px-2 text-xs">Conforme</Button><Button variant="secondary" className="h-9 px-2 text-xs">Nao Conforme</Button><Button variant="secondary" className="h-9 px-2 text-xs">N/A</Button></div>
  if (item.responseType === ResponseType.SINGLE_CHOICE) return <Select label="Opcao" id={`preview-${item.id}`} disabled><option>Selecione</option>{(item.options ?? []).map(option => <option key={option}>{option}</option>)}</Select>
  return <Input label="Data" id={`preview-${item.id}`} type="date" readOnly />
}
