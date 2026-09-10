import { ResponseType, type TemplateSection } from '@/types/domain'

export function validateTemplateMetadata(title: string, category: string): string {
  if (!title.trim()) return 'Informe o titulo do modelo.'
  if (title.length > 200) return 'Use no maximo 200 caracteres no titulo.'
  if (!category.trim()) return 'Informe a categoria do modelo.'
  return ''
}

export function validateInspectionTemplate(title: string, category: string, sections: TemplateSection[]): string {
  const metadataError = validateTemplateMetadata(title, category)
  if (metadataError) return metadataError
  if (sections.length === 0) return 'Adicione pelo menos uma secao.'
  if (sections.some(section => !section.title.trim())) return 'Todas as secoes precisam de titulo.'
  if (sections.some(section => section.items.length === 0)) return 'Todas as secoes precisam de pelo menos um item.'
  if (sections.some(section => section.items.some(item => !item.question.trim()))) return 'Todos os itens precisam de pergunta.'
  if (sections.some(section => section.items.some(item => item.responseType === ResponseType.SINGLE_CHOICE && (item.options ?? []).filter(option => option.trim()).length < 2))) return 'Itens SINGLE_CHOICE precisam de pelo menos duas opcoes.'
  return ''
}
