export enum InspectionStatus { DRAFT = 'DRAFT', ASSIGNED = 'ASSIGNED', IN_PROGRESS = 'IN_PROGRESS', SUBMITTED = 'SUBMITTED', UNDER_REVIEW = 'UNDER_REVIEW', APPROVED = 'APPROVED', REJECTED = 'REJECTED', CANCELED = 'CANCELED' }
export enum Priority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }
export enum Severity { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }
export enum ResponseType { TEXT_SHORT = 'TEXT_SHORT', TEXT_LONG = 'TEXT_LONG', NUMBER = 'NUMBER', BOOLEAN = 'BOOLEAN', CONFORMITY = 'CONFORMITY', SINGLE_CHOICE = 'SINGLE_CHOICE', DATE = 'DATE' }

export type SyncStatus = 'synced' | 'pending' | 'error';
export type ChecklistValue = string | number | boolean | 'CONFORME' | 'NAO_CONFORME' | 'NA';

export interface Client { id: string; name: string }
export interface Site { id: string; name: string; city: string; state: string; clientId: string }
export interface Equipment { id: string; name: string; patrimony: string; serialNumber: string; siteId: string; qrCode: string; active: boolean }
export interface User { id: string; name: string; email: string; role: 'Técnico' | 'Supervisora' }
export interface TemplateItem { id: string; question: string; description?: string; responseType: ResponseType; required: boolean; requireObservationOnFailure: boolean; requireEvidenceOnFailure: boolean; options?: string[] }
export interface TemplateSection { id: string; title: string; items: TemplateItem[] }
export interface InspectionTemplate { id: string; title: string; category: string; version: number; sections: TemplateSection[] }
export interface Inspection { id: string; title: string; templateId: string; clientId: string; siteId: string; equipmentId: string; technicianId: string; supervisorId: string; status: InspectionStatus; priority: Priority; dueDate: string; dueTime: string; createdAt: string; progress: number; overdue?: boolean; syncStatus: SyncStatus; pendingSyncCount: number; supervisorInstructions: string; startedAt?: string }
export interface Evidence { id: string; inspectionId: string; itemId: string; description: string; capturedAt: string; syncStatus: SyncStatus }
export interface ChecklistAnswer { itemId: string; value: ChecklistValue; observation?: string; savedAt: string }
export interface NonConformity { id: string; inspectionId: string; itemId: string; title: string; description: string; severity: Severity; evidenceCount: number }
export interface SyncOperation { id: string; title: string; status: 'Enviada' | 'Upload concluído' | 'Pendente' | 'Erro' }
