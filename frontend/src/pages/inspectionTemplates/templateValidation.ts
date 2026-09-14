import { ResponseType, type TemplateSection } from '@/types/domain'

export function validateTemplateMetadata(title: string, category: string): string {
  return templateMetadataIssues(title, category)[0] ?? ''
}

export function validateInspectionTemplate(title: string, category: string, sections: TemplateSection[]): string {
  return inspectionTemplatePendingIssues(title, category, sections)[0] ?? ''
}

export function inspectionTemplatePendingIssues(title: string, category: string, sections: TemplateSection[]): string[] {
  const issues: string[] = []
  issues.push(...templateMetadataIssues(title, category))
  if (sections.length === 0) issues.push('Adicione pelo menos uma secao.')
  if (sections.some(section => !section.title.trim())) issues.push('Todas as secoes precisam de titulo.')
  if (sections.some(section => section.items.length === 0)) issues.push('Todas as secoes precisam de pelo menos um item.')
  if (sections.some(section => section.items.some(item => !item.question.trim()))) issues.push('Todos os itens precisam de pergunta.')
  if (sections.some(section => section.items.some(item => !item.responseType))) issues.push('Todos os itens precisam de um tipo de resposta.')
  if (sections.some(section => section.items.some(item => item.responseType === ResponseType.SINGLE_CHOICE && (item.options ?? []).filter(option => option.trim()).length < 2))) issues.push('Itens SINGLE_CHOICE precisam de pelo menos duas opcoes.')
  return issues
}

function templateMetadataIssues(title: string, category: string): string[] {
  const issues: string[] = []
  if (!title.trim()) issues.push('Informe o titulo do modelo.')
  if (title.length > 200) issues.push('Use no maximo 200 caracteres no titulo.')
  if (!category.trim()) issues.push('Informe a categoria do modelo.')
  return issues
}
