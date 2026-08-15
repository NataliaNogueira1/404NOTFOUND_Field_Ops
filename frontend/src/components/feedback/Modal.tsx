import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

export function Modal({ open, title, children, onClose, footer }: { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-card border border-border bg-white shadow-fieldops"><div className="flex items-center justify-between border-b border-border px-5 py-4"><h2 className="text-base font-semibold">{title}</h2><button className="focus-ring rounded-fieldops p-2 text-muted hover:bg-primary-light/30" onClick={onClose} aria-label="Fechar"><X size={18} /></button></div><div className="max-h-[68vh] overflow-y-auto p-5">{children}</div>{footer && <div className="flex justify-end gap-3 border-t border-border bg-slate-50 px-5 py-4">{footer}</div>}</div></div>
}

export function ConfirmDialog({ open, title, description, confirmLabel, variant = 'primary', onCancel, onConfirm }: { open: boolean; title: string; description: string; confirmLabel: string; variant?: 'primary' | 'danger'; onCancel: () => void; onConfirm: () => void }) {
  return <Modal open={open} title={title} onClose={onCancel} footer={<><Button variant="secondary" onClick={onCancel}>Cancelar</Button><Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button></>}><p className="text-sm text-muted">{description}</p></Modal>
}
