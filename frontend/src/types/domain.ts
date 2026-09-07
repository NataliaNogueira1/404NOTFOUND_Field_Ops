export enum UserRole { ADMIN = 'ADMIN', SUPERVISOR = 'SUPERVISOR', TECHNICIAN = 'TECHNICIAN' }
export enum UserStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE', BLOCKED = 'BLOCKED' }
export enum InspectionStatus { DRAFT = 'DRAFT', ASSIGNED = 'ASSIGNED', IN_PROGRESS = 'IN_PROGRESS', SUBMITTED = 'SUBMITTED', UNDER_REVIEW = 'UNDER_REVIEW', APPROVED = 'APPROVED', REJECTED = 'REJECTED', CANCELED = 'CANCELED' }
export enum Priority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }
export enum Severity { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }
export enum ResponseType { TEXT_SHORT = 'TEXT_SHORT', TEXT_LONG = 'TEXT_LONG', NUMBER = 'NUMBER', BOOLEAN = 'BOOLEAN', CONFORMITY = 'CONFORMITY', SINGLE_CHOICE = 'SINGLE_CHOICE', DATE = 'DATE' }

export interface User { id: string; name: string; email: string; role: UserRole; phone: string; active: boolean }
export interface Client { id: string; name: string; document: string; email: string; active: boolean; siteIds: string[] }
export interface Site { id: string; name: string; clientId: string; city: string; state: string; contact: string; active: boolean }
export interface Equipment { id: string; name: string; patrimony: string; serialNumber: string; siteId: string; qrCode: string; active: boolean }
export interface TemplateItem { id: string; question: string; description?: string; responseType: ResponseType; required: boolean; requireObservationOnFailure: boolean; requireEvidenceOnFailure: boolean; options?: string[] }
export interface TemplateSection { id: string; title: string; items: TemplateItem[] }
export interface InspectionTemplate { id: string; title: string; category: string; description: string; version: number; status: 'Ativa' | 'Rascunho'; sections: TemplateSection[] }
export type SyncStatus = 'synced' | 'pending' | 'error'
export type ChecklistValue = string | number | boolean | 'CONFORME' | 'NAO_CONFORME' | 'NA'
export interface Inspection { id: string; title: string; templateId: string; clientId: string; siteId: string; equipmentId: string; technicianId: string; status: InspectionStatus; priority: Priority; dueDate: string; progress: number; overdue?: boolean; clientName?: string; siteName?: string; equipmentName?: string; supervisorId?: string; supervisorName?: string; dueTime?: string; createdAt?: string; syncStatus?: SyncStatus; pendingSyncCount?: number; supervisorInstructions?: string; startedAt?: string }
export interface NonConformity { id: string; title: string; inspectionId: string; item: string; clientId: string; severity: Severity; status: 'Aberta' | 'Em tratamento' | 'Resolvida'; date: string }
export interface AuditLog { id: string; timestamp: string; user: string; action: string; entity: string; entityId: string }
export interface ReviewAnswer { id: string; section: string; question: string; result: string; observation?: string; evidence?: string; nonConformityId?: string }
export interface Evidence { id: string; inspectionId: string; itemId: string; description: string; capturedAt: string; syncStatus: SyncStatus }
export interface ChecklistAnswer { itemId: string; value: ChecklistValue; observation?: string; savedAt: string }
export interface SyncOperation { id: string; title: string; status: 'Enviada' | 'Upload concluido' | 'Pendente' | 'Erro' }
