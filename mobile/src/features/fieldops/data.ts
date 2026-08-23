import { InspectionStatus, Priority, ResponseType, Severity, type Client, type Equipment, type Inspection, type InspectionTemplate, type NonConformity, type Site, type SyncOperation, type User } from './types';

export const technician: User = { id: 'usr-carlos', name: 'Carlos Henrique Silva', email: 'tecnico@fieldops.local', role: 'Técnico' };
export const supervisor: User = { id: 'usr-marina', name: 'Marina Silva', email: 'marina@fieldops.local', role: 'Supervisora' };
export const clients: Client[] = [{ id: 'cli-industria', name: 'Indústria Modelo' }, { id: 'cli-logistica', name: 'Logística ABC' }, { id: 'cli-horizonte', name: 'Metalúrgica Horizonte' }];
export const sites: Site[] = [
  { id: 'site-sorocaba', name: 'Unidade Sorocaba', city: 'Sorocaba', state: 'SP', clientId: 'cli-industria' },
  { id: 'site-campinas', name: 'CD Campinas', city: 'Campinas', state: 'SP', clientId: 'cli-logistica' },
  { id: 'site-sp', name: 'Unidade São Paulo', city: 'São Paulo', state: 'SP', clientId: 'cli-industria' },
  { id: 'site-jundiai', name: 'Centro Operacional Jundiaí', city: 'Jundiaí', state: 'SP', clientId: 'cli-horizonte' },
];
export const equipment: Equipment[] = [
  { id: 'eq-compressor', name: 'Compressor XPTO 500', patrimony: 'COMP-004', serialNumber: 'XPTO-500-2024-019', siteId: 'site-sorocaba', qrCode: 'FO-CMP-500', active: true },
  { id: 'eq-gerador', name: 'Gerador Diesel GD-002', patrimony: 'GD-002', serialNumber: 'GD002-88912', siteId: 'site-campinas', qrCode: 'FO-GD-002', active: true },
  { id: 'eq-extintor', name: 'Extintor P12', patrimony: 'EXT-P12-044', serialNumber: 'EXT-044-2026', siteId: 'site-sp', qrCode: 'FO-EXT-P12-044', active: true },
  { id: 'eq-empilhadeira', name: 'Empilhadeira 01', patrimony: 'EMP-001', serialNumber: 'EMP-01-993', siteId: 'site-jundiai', qrCode: 'FO-EMP-001', active: true },
];
export const compressorTemplate: InspectionTemplate = { id: 'tpl-compressor', title: 'Inspeção Preventiva de Compressor', category: 'Manutenção', version: 3, sections: [
  { id: 'sec-gerais', title: 'Condições Gerais', items: [
    { id: 'item-1', question: 'A placa de identificação está legível?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-2', question: 'Equipamento limpo e conservado?', responseType: ResponseType.TEXT_LONG, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-3', question: 'Estrutura externa sem danos?', responseType: ResponseType.BOOLEAN, required: true, requireObservationOnFailure: false, requireEvidenceOnFailure: false },
  ] },
  { id: 'sec-seguranca', title: 'Segurança', items: [
    { id: 'item-4', question: 'Proteções das partes móveis instaladas?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-5', question: 'Etiquetas de advertência visíveis?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-6', question: 'Botão de emergência funcionando?', responseType: ResponseType.SINGLE_CHOICE, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: false, options: ['Funcionando', 'Intermitente', 'Não funcionando'] },
  ] },
  { id: 'sec-eletrico', title: 'Sistema Elétrico', items: [
    { id: 'item-7', question: 'Cabos elétricos íntegros?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-8', question: 'Conexões sem sinais de aquecimento?', responseType: ResponseType.DATE, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-9', question: 'Resistência do aterramento?', description: 'Informar resistência em ohms.', responseType: ResponseType.NUMBER, required: true, requireObservationOnFailure: false, requireEvidenceOnFailure: false },
  ] },
  { id: 'sec-operacao', title: 'Operação', items: [
    { id: 'item-10', question: 'Pressão dentro da faixa?', responseType: ResponseType.NUMBER, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: false },
    { id: 'item-11', question: 'Vibração dentro do limite?', responseType: ResponseType.CONFORMITY, required: true, requireObservationOnFailure: true, requireEvidenceOnFailure: true },
    { id: 'item-12', question: 'Equipamento operando sem ruídos anormais?', responseType: ResponseType.TEXT_SHORT, required: true, requireObservationOnFailure: false, requireEvidenceOnFailure: false },
  ] },
] };
export const templates = [compressorTemplate];
// Datas relativas à data atual para o mock sempre funcionar nos filtros
const today = new Date();
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const initialInspections: Inspection[] = [
  { id: 'ins-compressor', title: 'Inspeção Preventiva — Compressor XPTO 500', templateId: 'tpl-compressor', clientId: 'cli-industria', clientName: 'Indústria Modelo', siteId: 'site-sorocaba', siteName: 'Unidade Sorocaba', equipmentId: 'eq-compressor', equipmentName: 'Compressor XPTO 500', technicianId: 'usr-carlos', supervisorId: 'usr-marina', supervisorName: 'Marina Silva', status: InspectionStatus.ASSIGNED, priority: Priority.HIGH, dueDate: fmt(today), dueTime: '09:00', createdAt: fmt(addDays(today, -3)), progress: 0, syncStatus: 'pending', pendingSyncCount: 3, supervisorInstructions: 'Verificar condição da bateria com atenção especial. Último relatório indicou corrosão.' },
  { id: 'ins-gerador', title: 'Inspeção Gerador Diesel', templateId: 'tpl-compressor', clientId: 'cli-logistica', clientName: 'Logística ABC', siteId: 'site-campinas', siteName: 'CD Campinas', equipmentId: 'eq-gerador', equipmentName: 'Gerador Diesel GD-002', technicianId: 'usr-carlos', supervisorId: 'usr-marina', supervisorName: 'Marina Silva', status: InspectionStatus.ASSIGNED, priority: Priority.MEDIUM, dueDate: fmt(addDays(today, 1)), dueTime: '14:00', createdAt: fmt(addDays(today, -2)), progress: 0, syncStatus: 'synced', pendingSyncCount: 0, supervisorInstructions: 'Validar nível de combustível e resposta em carga.' },
  { id: 'ins-extintor', title: 'Inspeção Extintor P12', templateId: 'tpl-compressor', clientId: 'cli-industria', clientName: 'Indústria Modelo', siteId: 'site-sp', siteName: 'Unidade São Paulo', equipmentId: 'eq-extintor', equipmentName: 'Extintor P12', technicianId: 'usr-carlos', supervisorId: 'usr-marina', supervisorName: 'Marina Silva', status: InspectionStatus.REJECTED, priority: Priority.LOW, dueDate: fmt(addDays(today, -2)), dueTime: '11:30', createdAt: fmt(addDays(today, -5)), progress: 84, overdue: true, syncStatus: 'error', pendingSyncCount: 1, supervisorInstructions: 'Corrigir evidência do lacre e reenviar.' },
  { id: 'ins-empilhadeira', title: 'Inspeção Empilhadeira 01', templateId: 'tpl-compressor', clientId: 'cli-horizonte', clientName: 'Metalúrgica Horizonte', siteId: 'site-jundiai', siteName: 'Centro Operacional Jundiaí', equipmentId: 'eq-empilhadeira', equipmentName: 'Empilhadeira 01', technicianId: 'usr-carlos', supervisorId: 'usr-marina', supervisorName: 'Marina Silva', status: InspectionStatus.IN_PROGRESS, priority: Priority.CRITICAL, dueDate: fmt(addDays(today, 3)), dueTime: '16:00', createdAt: fmt(addDays(today, -1)), progress: 58, syncStatus: 'pending', pendingSyncCount: 2, supervisorInstructions: 'Priorizar verificação de freio e sinais sonoros.' },
];
export const initialNonConformities: NonConformity[] = [
  { id: 'nc-cabo', title: 'Cabo elétrico danificado', inspectionId: 'ins-compressor', itemId: 'item-7', severity: Severity.CRITICAL, description: 'Desgaste na cobertura do cabo.', evidenceCount: 1 },
  { id: 'nc-etiqueta', title: 'Etiqueta de segurança danificada', inspectionId: 'ins-compressor', itemId: 'item-5', severity: Severity.MEDIUM, description: 'Etiqueta sem leitura completa.', evidenceCount: 1 },
  { id: 'nc-vibracao', title: 'Vibração acima do padrão', inspectionId: 'ins-compressor', itemId: 'item-11', severity: Severity.MEDIUM, description: 'Vibração perceptível em operação.', evidenceCount: 1 },
  { id: 'nc-oleo', title: 'Acúmulo de óleo', inspectionId: 'ins-compressor', itemId: 'item-2', severity: Severity.LOW, description: 'Resíduo próximo à base.', evidenceCount: 1 },
];
export const initialSyncOperations: SyncOperation[] = [
  { id: 'sync-1', title: 'Resposta item 1', status: 'Enviada' },
  { id: 'sync-2', title: 'Foto item 2', status: 'Upload concluído' },
  { id: 'sync-3', title: 'Resposta item 5', status: 'Pendente' },
  { id: 'sync-4', title: 'Foto item 7', status: 'Erro' },
];
export function byId<T extends { id: string }>(list: T[], id: string) { return list.find((item) => item.id === id); }
export function allTemplateItems(template: InspectionTemplate) { return template.sections.flatMap((section) => section.items); }
