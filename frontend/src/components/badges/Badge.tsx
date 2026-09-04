import type { HTMLAttributes } from 'react'
import { InspectionStatus, Priority, Severity, UserRole, UserStatus } from '@/types/domain'
import { cn } from '@/utils/cn'

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
const tones: Record<BadgeTone, string> = { neutral: 'bg-slate-100 text-muted', primary: 'bg-primary-light/55 text-primary-dark', success: 'bg-success-light/35 text-success-dark', warning: 'bg-amber-100 text-warning-dark', danger: 'bg-danger-light/25 text-danger-dark' }
export function Badge({ className, tone = 'neutral', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) { return <span className={cn('inline-flex rounded-md px-2.5 py-1 text-xs font-semibold', tones[tone], className)} {...props} /> }
const statusLabel: Record<InspectionStatus, string> = { DRAFT: 'Rascunho', ASSIGNED: 'Atribuida', IN_PROGRESS: 'Em andamento', SUBMITTED: 'Enviada', UNDER_REVIEW: 'Em revisao', APPROVED: 'Aprovada', REJECTED: 'Reprovada', CANCELED: 'Cancelada' }
const statusTone: Record<InspectionStatus, BadgeTone> = { DRAFT: 'neutral', ASSIGNED: 'primary', IN_PROGRESS: 'warning', SUBMITTED: 'primary', UNDER_REVIEW: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELED: 'neutral' }
const priorityLabel: Record<Priority, string> = { LOW: 'Baixa', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Critica' }
const priorityTone: Record<Priority, BadgeTone> = { LOW: 'success', MEDIUM: 'primary', HIGH: 'warning', CRITICAL: 'danger' }
const severityLabel: Record<Severity, string> = { LOW: 'Baixa', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Critica' }
const roleLabel: Record<UserRole, string> = { ADMIN: 'ADMIN', SUPERVISOR: 'SUPERVISOR', TECHNICIAN: 'TECHNICIAN' }
export function StatusBadge({ status }: { status: InspectionStatus }) { return <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge> }
export function PriorityBadge({ priority }: { priority: Priority }) { return <Badge tone={priorityTone[priority]}>{priorityLabel[priority]}</Badge> }
export function SeverityBadge({ severity }: { severity: Severity }) { return <Badge tone={priorityTone[severity]}>{severityLabel[severity]}</Badge> }
export function RoleBadge({ role }: { role: UserRole }) { return <Badge tone={role === UserRole.ADMIN ? 'danger' : role === UserRole.SUPERVISOR ? 'primary' : 'success'}>{roleLabel[role]}</Badge> }
export function ActiveBadge({ active }: { active: boolean }) { return <Badge tone={active ? 'success' : 'neutral'}>{active ? 'Ativo' : 'Inativo'}</Badge> }
const userStatusLabel: Record<UserStatus, string> = { ACTIVE: 'Ativo', INACTIVE: 'Inativo', BLOCKED: 'Bloqueado' }
const userStatusTone: Record<UserStatus, BadgeTone> = { ACTIVE: 'success', INACTIVE: 'neutral', BLOCKED: 'danger' }
export function UserStatusBadge({ status }: { status: UserStatus }) { return <Badge tone={userStatusTone[status]}>{userStatusLabel[status]}</Badge> }
