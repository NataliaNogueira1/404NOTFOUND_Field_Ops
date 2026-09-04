import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminCatalogApi } from '@/api/adminCatalog'
import { ApiError } from '@/api/client'
import { Select, Textarea } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

const categories = ['Manutencao Preventiva', 'Seguranca', 'Eletrica']

export function NewTemplatePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [requestError, setRequestError] = useState('')

  const titleError = submitted && !title.trim()
    ? 'Informe o titulo do modelo.'
    : title.length > 200 ? 'Use no maximo 200 caracteres.' : ''
  const categoryError = submitted && !category ? 'Selecione uma categoria.' : ''

  async function submit() {
    setSubmitted(true)
    setRequestError('')
    if (!title.trim() || title.length > 200 || !category) return
    setSaving(true)
    try {
      const created = await adminCatalogApi.createTemplate({
        title: title.trim(),
        description: description.trim(),
        category,
      })
      navigate(`/app/inspection-templates/${created.id}/edit`)
    } catch (cause) {
      setRequestError(templateError(cause))
    } finally {
      setSaving(false)
    }
  }

  return <div className="space-y-6">
    <div>
      <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary" to="/app/inspection-templates"><ArrowLeft size={16} />Modelos</Link>
      <PageHeader title="Novo modelo de inspecao" description="Defina os dados iniciais. O checklist sera criado como rascunho." />
    </div>
    <form className="space-y-5" onSubmit={event => { event.preventDefault(); void submit() }} noValidate>
      <Card className="grid gap-4 p-5 md:grid-cols-2">
        <Input label="Titulo" id="template-title" required maxLength={200} value={title} error={titleError} onChange={event => setTitle(event.target.value)} placeholder="Inspecao Preventiva de Compressor" />
        <Select label="Categoria" id="template-category" required value={category} error={categoryError} onChange={event => setCategory(event.target.value)}>
          <option value="">Selecione</option>
          {categories.map(value => <option key={value} value={value}>{value}</option>)}
        </Select>
        <div className="md:col-span-2">
          <Textarea label="Descricao" id="template-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Checklist para inspecao mensal de compressores" />
        </div>
      </Card>
      {requestError && <p role="alert" className="text-sm font-medium text-danger">{requestError}</p>}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate('/app/inspection-templates')}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Criando...' : 'Criar modelo'}</Button>
      </div>
    </form>
  </div>
}

function templateError(cause: unknown) {
  if (cause instanceof ApiError && cause.fieldErrors.length) {
    return cause.fieldErrors.map(error => error.message).join(' ')
  }
  return 'Nao foi possivel criar o modelo. Tente novamente.'
}
