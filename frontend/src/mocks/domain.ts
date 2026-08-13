import { InspectionStatus, Priority, ResponseType, Severity, UserRole, type AuditLog, type Client, type Equipment, type Inspection, type InspectionTemplate, type NonConformity, type ReviewAnswer, type Site, type User } from '@/types/domain'

export const users: User[] = [
  { id: 'usr-marina', name: 'Marina Silva', email: 'marina@fieldops.com', role: UserRole.SUPERVISOR, phone: '(11) 94000-1000', active: true },
  { id: 'usr-carlos', name: 'Carlos Henrique', email: 'carlos@fieldops.com', role: UserRole.TECHNICIAN, phone: '(15) 99777-2000', active: true },
  { id: 'usr-ana', name: 'Ana Costa', email: 'ana@fieldops.com', role: UserRole.ADMIN, phone: '(11) 93333-4455', active: true },
  { id: 'usr-joao', name: 'Joao Pedro', email: 'joao@fieldops.com', role: UserRole.TECHNICIAN, phone: '(19) 98888-0101', active: false },
]

export const clients: Client[] = [
  { id: 'cli-industria', name: 'Industria Modelo', document: '12.345.678/0001-90', email: 'operacoes@industriamodelo.com.br', active: true, siteIds: ['site-sorocaba', 'site-sp'] },
  { id: 'cli-logistica', name: 'Logistica ABC', document: '23.456.789/0001-10', email: 'manutencao@logisticaabc.com.br', active: true, siteIds: ['site-campinas'] },
  { id: 'cli-delta', name: 'Comercial Delta', document: '34.567.890/0001-22', email: 'facilities@delta.com.br', active: true, siteIds: [] },
  { id: 'cli-horizonte', name: 'Metalurgica Horizonte', document: '45.678.901/0001-33', email: 'seguranca@horizonte.com.br', active: false, siteIds: ['site-jundiai'] },
]

export const sites: Site[] = [
  { id: 'site-sorocaba', name: 'Unidade Sorocaba', clientId: 'cli-industria', city: 'Sorocaba', state: 'SP', contact: 'Paula Martins', active: true },
  { id: 'site-campinas', name: 'CD Campinas', clientId: 'cli-logistica', city: 'Campinas', state: 'SP', contact: 'Roberto Lima', active: true },
  { id: 'site-sp', name: 'Unidade Sao Paulo', clientId: 'cli-industria', city: 'Sao Paulo', state: 'SP', contact: 'Marcos Alves', active: true },
  { id: 'site-jundiai', name: 'Centro Operacional Jundiai', clientId: 'cli-horizonte', city: 'Jundiai', state: 'SP', contact: 'Bianca Reis', active: false },
]

export const equipment: Equipment[] = [
  { id: 'eq-compressor', name: 'Compressor XPTO 500', patrimony: 'CMP-500', serialNumber: 'XPTO-500-2024-019', siteId: 'site-sorocaba', qrCode: 'FO-CMP-500', active: true },
  { id: 'eq-gerador', name: 'Gerador Diesel GD-002', patrimony: 'GD-002', serialNumber: 'GD002-88912', siteId: 'site-campinas', qrCode: 'FO-GD-002', active: true },
  { id: 'eq-extintor', name: 'Extintor P12', patrimony: 'EXT-P12-044', serialNumber: 'EXT-044-2026', siteId: 'site-sp', qrCode: 'FO-EXT-P12-044', active: true },
  { id: 'eq-empilhadeira', name: 'Empilhadeira 01', patrimony: 'EMP-001', serialNumber: 'EMP-01-993', siteId: 'site-jundiai', qrCode: 'FO-EMP-001', active: false },
]

export const compressorSections = [
  { id: 'sec-gerais', title: 'Condicoes Gerais', items: [
    { id: 'item-1', question: 'A placa de identificacao esta legivel?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-2', question: 'Equipamento limpo e conservado?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-3', question: 'Estrutura externa sem danos?', responseType: ResponseType.BOOLEAN, required: true, requireObservationOnFailure: false, requireEvidenceOnFailure: false },
  ] },
  { id: 'sec-seguranca', title: 'Seguranca', items: [
    { id: 'item-4', question: 'Protecoes das partes moveis instaladas?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-5', question: 'Etiquetas de advertencia visiveis?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-6', question: 'Botao de emergencia funcionando?', responseType: ResponseType.SINGLE_CHOICE, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: false, options: ['Funcionando', 'Intermitente', 'Nao funcionando'] },
  ] },
  { id: 'sec-eletrico', title: 'Sistema Eletrico', items: [
    { id: 'item-7', question: 'Cabos eletricos integros?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-8', question: 'Conexoes sem sinais de aquecimento?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-9', question: 'Resistencia do aterramento?', description: 'Informar resistencia em ohms.', responseType: ResponseType.NUMBER, required: true, requireObservationOnFailure: false, requireEvidenceOnFailure: false },
  ] },
  { id: 'sec-operacao', title: 'Operacao', items: [
    { id: 'item-10', question: 'Pressao dentro da faixa?', responseType: ResponseType.NUMBER, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: false },
    { id: 'item-11', question: 'Vibracao dentro do limite?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-12', question: 'Equipamento operando sem ruidos anormais?', responseType: ResponseType.TEXT_SHORT, required: false, requireObservationOnFailure: false, requireEvidenceOnFailure: false },
  ] },
] satisfies InspectionTemplate['sections']

export const templates: InspectionTemplate[] = [
  { id: 'tpl-compressor', title: 'Inspecao Preventiva de Compressor', category: 'Manutencao', description: 'Checklist preventivo para compressores industriais.', version: 3, status: 'Ativa', sections: compressorSections },
  { id: 'tpl-extintor', title: 'Inspecao de Extintor', category: 'Seguranca', description: 'Verificacao periodica de extintores portateis.', version: 2, status: 'Ativa', sections: compressorSections.slice(0, 3) },
  { id: 'tpl-gerador', title: 'Checklist Gerador Diesel', category: 'Energia', description: 'Inspecao operacional de geradores diesel.', version: 1, status: 'Rascunho', sections: compressorSections.slice(1) },
]

export const inspections: Inspection[] = [
  { id: 'ins-compressor', title: 'Inspecao Preventiva - Compressor XPTO 500', templateId: 'tpl-compressor', clientId: 'cli-industria', siteId: 'site-sorocaba', equipmentId: 'eq-compressor', technicianId: 'usr-carlos', status: InspectionStatus.SUBMITTED, priority: Priority.HIGH, dueDate: '2026-08-10', progress: 100, overdue: true },
  { id: 'ins-gerador', title: 'Inspecao Gerador Diesel', templateId: 'tpl-gerador', clientId: 'cli-logistica', siteId: 'site-campinas', equipmentId: 'eq-gerador', technicianId: 'usr-carlos', status: InspectionStatus.ASSIGNED, priority: Priority.MEDIUM, dueDate: '2026-08-14', progress: 0 },
  { id: 'ins-extintor', title: 'Inspecao Extintor P12', templateId: 'tpl-extintor', clientId: 'cli-industria', siteId: 'site-sp', equipmentId: 'eq-extintor', technicianId: 'usr-joao', status: InspectionStatus.UNDER_REVIEW, priority: Priority.LOW, dueDate: '2026-08-11', progress: 100, overdue: true },
  { id: 'ins-empilhadeira', title: 'Inspecao Empilhadeira 01', templateId: 'tpl-compressor', clientId: 'cli-horizonte', siteId: 'site-jundiai', equipmentId: 'eq-empilhadeira', technicianId: 'usr-carlos', status: InspectionStatus.IN_PROGRESS, priority: Priority.CRITICAL, dueDate: '2026-08-12', progress: 58 },
  { id: 'ins-aprovada', title: 'Inspecao Preventiva - Compressor XPTO 500', templateId: 'tpl-compressor', clientId: 'cli-industria', siteId: 'site-sorocaba', equipmentId: 'eq-compressor', technicianId: 'usr-carlos', status: InspectionStatus.APPROVED, priority: Priority.HIGH, dueDate: '2026-08-05', progress: 100 },
]

export const nonConformities: NonConformity[] = [
  { id: 'nc-cabo', title: 'Cabo eletrico danificado', inspectionId: 'ins-compressor', item: 'Cabos eletricos integros?', clientId: 'cli-industria', severity: Severity.CRITICAL, status: 'Aberta', date: '2026-08-10' },
  { id: 'nc-etiqueta', title: 'Etiqueta de seguranca danificada', inspectionId: 'ins-compressor', item: 'Etiquetas de advertencia visiveis?', clientId: 'cli-industria', severity: Severity.MEDIUM, status: 'Em tratamento', date: '2026-08-10' },
  { id: 'nc-vibracao', title: 'Vibracao acima do padrao', inspectionId: 'ins-compressor', item: 'Vibracao dentro do limite?', clientId: 'cli-industria', severity: Severity.HIGH, status: 'Aberta', date: '2026-08-10' },
  { id: 'nc-oleo', title: 'Acumulo de oleo', inspectionId: 'ins-compressor', item: 'Equipamento limpo e conservado?', clientId: 'cli-industria', severity: Severity.LOW, status: 'Resolvida', date: '2026-08-10' },
]

export const reviewAnswers: ReviewAnswer[] = compressorSections.flatMap(section => section.items.map((item, index) => {
  const nc = nonConformities.find(value => value.item === item.question)
  return { id: item.id, section: section.title, question: item.question, result: nc ? 'NAO CONFORME' : index % 4 === 0 ? '4.2' : 'CONFORME', observation: nc ? nc.title : 'Item verificado em campo sem restricoes.', evidence: `foto-${item.id}.jpg`, nonConformityId: nc?.id }
}))

export const auditLogs: AuditLog[] = [
  { id: 'aud-1', timestamp: '2026-08-10 09:15', user: 'Carlos Henrique', action: 'INSPECTION_STARTED', entity: 'Inspection', entityId: 'ins-compressor' },
  { id: 'aud-2', timestamp: '2026-08-10 10:05', user: 'Carlos Henrique', action: 'INSPECTION_COMPLETED', entity: 'Inspection', entityId: 'ins-compressor' },
  { id: 'aud-3', timestamp: '2026-08-10 10:12', user: 'Sistema', action: 'SYNC_RECEIVED', entity: 'Inspection', entityId: 'ins-compressor' },
  { id: 'aud-4', timestamp: '2026-08-10 14:00', user: 'Marina Silva', action: 'REVIEW_STARTED', entity: 'Inspection', entityId: 'ins-compressor' },
  { id: 'aud-5', timestamp: '2026-08-10 14:30', user: 'Marina Silva', action: 'INSPECTION_APPROVED', entity: 'Inspection', entityId: 'ins-aprovada' },
  { id: 'aud-6', timestamp: '2026-08-11 08:30', user: 'Marina Silva', action: 'INSPECTION_REJECTED', entity: 'Inspection', entityId: 'ins-extintor' },
]

export const dashboardStats = { total: 12, pending: 3, overdue: 5, critical: 2 }
export const inspectionsByStatus = [
  { name: 'Atribuidas', value: 4, fill: '#2563EB' },
  { name: 'Em andamento', value: 3, fill: '#F59E0B' },
  { name: 'Enviadas', value: 3, fill: '#64748B' },
  { name: 'Aprovadas', value: 2, fill: '#16A34A' },
]
export const nonConformitiesBySeverity = [
  { label: 'Critica', value: 2, tone: 'danger' },
  { label: 'Alta', value: 5, tone: 'warning' },
  { label: 'Media', value: 8, tone: 'primary' },
  { label: 'Baixa', value: 3, tone: 'success' },
] as const

export function byId<T extends { id: string }>(list: T[], id: string) {
  return list.find(item => item.id === id)
}
