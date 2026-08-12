export enum UserRole { ADMIN = 'ADMIN', SUPERVISOR = 'SUPERVISOR', TECHNICIAN = 'TECHNICIAN' }
export enum InspectionStatus { DRAFT = 'DRAFT', ASSIGNED = 'ASSIGNED', IN_PROGRESS = 'IN_PROGRESS', SUBMITTED = 'SUBMITTED', UNDER_REVIEW = 'UNDER_REVIEW', APPROVED = 'APPROVED', REJECTED = 'REJECTED', CANCELED = 'CANCELED' }
export enum Priority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }

export interface User { id: string; name: string; email: string; role: UserRole }
export interface Client { id: string; name: string; active: boolean }
export interface Site { id: string; name: string; clientId: string; city: string; state: string }
export interface Equipment { id: string; name: string; siteId: string; tag: string }
export interface InspectionTemplate { id: string; name: string; equipmentType: string; version: number }
export interface Inspection { id: string; templateId: string; equipmentId: string; technicianId: string; status: InspectionStatus; priority: Priority; dueDate: string }
export interface NonConformity { id: string; inspectionId: string; title: string; priority: Priority; resolved: boolean }
