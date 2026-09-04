import { Pencil, Plus, Power } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/api/client'
import { type ManagedUser, type UserInput, usersApi } from '@/api/users'
import { RoleBadge, UserStatusBadge } from '@/components/badges/Badge'
import { ConfirmDialog, Modal } from '@/components/feedback/Modal'
import { Toast } from '@/components/feedback/Toast'
import { Select } from '@/components/forms/Fields'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/tables/DataTable'
import { useDebouncedValue, useListQuery } from '@/hooks/useListQuery'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { UserRole, UserStatus } from '@/types/domain'

type EditTarget = ManagedUser | 'new' | null

export function UsersPage() {
  const [rows, setRows] = useState<ManagedUser[]>([])
  const list = useListQuery()
  const query = list.value('name')
  const debouncedQuery = useDebouncedValue(query)
  const role = list.value('role') as UserRole | ''
  const status = list.value('status') as UserStatus | ''
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [editing, setEditing] = useState<EditTarget>(null)
  const [changingStatus, setChangingStatus] = useState<ManagedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await usersApi.list({ name: debouncedQuery, role, status, page: list.page, size: list.size, sort: list.sort })
      setRows(result.content)
      setTotalElements(result.totalElements)
      setTotalPages(Math.max(result.totalPages, 1))
    } catch (cause) {
      setError(messageFor(cause, 'Nao foi possivel carregar os usuarios.'))
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, list.page, list.size, list.sort, role, status])

  useEffect(() => {
    const pendingLoad = window.setTimeout(() => void loadUsers(), 0)
    return () => window.clearTimeout(pendingLoad)
  }, [loadUsers])

  async function save(input: UserInput) {
    if (!editing) return
    const creating = editing === 'new'
    if (creating) await usersApi.create(input)
    else await usersApi.update(editing.id, input)
    setEditing(null)
    showToast(creating ? 'Usuario criado com sucesso.' : 'Usuario atualizado com sucesso.')
    await loadUsers()
  }

  async function confirmStatusChange() {
    if (!changingStatus) return
    const next = changingStatus.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE
    try {
      await usersApi.updateStatus(changingStatus.id, next)
      setChangingStatus(null)
      showToast(next === UserStatus.ACTIVE ? 'Usuario ativado com sucesso.' : 'Usuario inativado com sucesso.')
      await loadUsers()
    } catch (cause) {
      setError(messageFor(cause, 'Nao foi possivel alterar o status.'))
      setChangingStatus(null)
    }
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  const columns: Column<ManagedUser>[] = [
    { header: 'Nome', sortKey: 'name', cell: user => <span className="font-medium">{user.name}</span> },
    { header: 'E-mail', sortKey: 'email', cell: user => user.email },
    { header: 'Perfil', sortKey: 'role', cell: user => <RoleBadge role={user.role} /> },
    { header: 'Status', sortKey: 'status', cell: user => <UserStatusBadge status={user.status} /> },
    { header: 'Acoes', cell: user => <div className="flex gap-2">
      <Button aria-label={`Editar ${user.name}`} variant="ghost" className="h-8 px-2" onClick={() => setEditing(user)}><Pencil size={16} /></Button>
      <Button aria-label={`${user.status === UserStatus.ACTIVE ? 'Inativar' : 'Ativar'} ${user.name}`} variant="ghost" className="h-8 px-2" onClick={() => setChangingStatus(user)}><Power size={16} /></Button>
    </div> },
  ]

  return <div className="space-y-6">
    <PageHeader title="Usuarios" description="Gerencie os usuarios e permissoes da plataforma." action={<Button onClick={() => setEditing('new')}><Plus size={17} />Novo usuario</Button>} />
    <Card className="grid gap-4 p-4 md:grid-cols-3">
      <Input label="Buscar" id="user-search" value={query} onChange={event => list.update('name', event.target.value)} placeholder="Nome ou e-mail" />
      <Select label="Perfil" id="user-role" value={role} onChange={event => list.update('role', event.target.value)}><option value="">Todos</option>{Object.values(UserRole).map(value => <option key={value}>{value}</option>)}</Select>
      <Select label="Status" id="user-status" value={status} onChange={event => list.update('status', event.target.value)}><option value="">Todos</option><option value={UserStatus.ACTIVE}>Ativo</option><option value={UserStatus.INACTIVE}>Inativo</option><option value={UserStatus.BLOCKED}>Bloqueado</option></Select>
    </Card>
    {error && <div role="alert" className="rounded-fieldops border border-danger-light bg-danger-light/10 px-4 py-3 text-sm text-danger-dark">{error}</div>}
    <DataTable columns={columns} rows={rows} loading={loading} loadingLabel="Carregando usuarios..." page={list.page + 1} pageSize={list.size} totalRows={totalElements} totalPages={totalPages} sort={list.sort} onSortChange={list.toggleSort} onPageChange={next => list.setPage(next - 1)} onPageSizeChange={list.setSize} />
    <UserModal key={editing === 'new' ? 'new' : editing?.id ?? 'closed'} target={editing} onClose={() => setEditing(null)} onSave={save} />
    <ConfirmDialog open={Boolean(changingStatus)} title={changingStatus?.status === UserStatus.ACTIVE ? 'Inativar usuario' : 'Ativar usuario'} description={changingStatus?.status === UserStatus.ACTIVE ? `O usuario ${changingStatus?.name} perdera o acesso ao sistema.` : `O usuario ${changingStatus?.name} voltara a ter acesso ao sistema.`} confirmLabel={changingStatus?.status === UserStatus.ACTIVE ? 'Inativar' : 'Ativar'} variant={changingStatus?.status === UserStatus.ACTIVE ? 'danger' : 'primary'} onCancel={() => setChangingStatus(null)} onConfirm={() => void confirmStatusChange()} />
    <Toast show={Boolean(toast)} message={toast} />
  </div>
}

function UserModal({ target, onClose, onSave }: { target: EditTarget; onClose: () => void; onSave: (input: UserInput) => Promise<void> }) {
  const [draft, setDraft] = useState<UserInput>(() => target && target !== 'new'
    ? { name: target.name, email: target.email, password: '', role: target.role, phone: target.phone }
    : { name: '', email: '', password: '', role: UserRole.TECHNICIAN, phone: '' })
  const [emailError, setEmailError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!target) return null
  const creating = target === 'new'
  const editingId = creating ? undefined : target.id
  const nameError = !draft.name.trim() ? 'Informe o nome.' : draft.name.trim().length > 100 ? 'Use no maximo 100 caracteres.' : ''
  const formatEmailError = !draft.email.trim() ? 'Informe o e-mail.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email) ? 'Informe um e-mail valido.' : ''
  const passwordError = creating && !draft.password ? 'Informe a senha.' : draft.password && draft.password.length < 6 ? 'A senha deve ter ao menos 6 caracteres.' : ''
  const formError = nameError || formatEmailError || emailError || passwordError

  async function validateEmail() {
    if (formatEmailError) return
    try {
      const available = await usersApi.emailAvailable(draft.email.trim(), editingId)
      setEmailError(available ? '' : 'Este e-mail ja esta em uso.')
    } catch (cause) {
      setEmailError(messageFor(cause, 'Nao foi possivel validar o e-mail.'))
    }
  }

  async function submit() {
    if (formError) return
    setSaving(true)
    setSubmitError('')
    try {
      await onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.trim(), password: draft.password || undefined })
    } catch (cause) {
      setSubmitError(messageFor(cause, 'Nao foi possivel salvar o usuario.'))
    } finally {
      setSaving(false)
    }
  }

  return <Modal open title={creating ? 'Novo usuario' : 'Editar usuario'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button disabled={Boolean(formError) || saving} onClick={() => void submit()}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Nome" id="u-name" maxLength={100} value={draft.name} error={nameError} onChange={event => setDraft({ ...draft, name: event.target.value })} />
      <Input label="E-mail" id="u-email" type="email" value={draft.email} error={formatEmailError || emailError} onChange={event => { setEmailError(''); setDraft({ ...draft, email: event.target.value }) }} onBlur={() => void validateEmail()} />
      <Input label={creating ? 'Senha' : 'Nova senha (opcional)'} id="u-password" type="password" minLength={6} value={draft.password} error={passwordError} onChange={event => setDraft({ ...draft, password: event.target.value })} />
      <Select label="Perfil" id="u-role" value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as UserRole })}>{Object.values(UserRole).map(value => <option key={value}>{value}</option>)}</Select>
      <Input label="Telefone (opcional)" id="u-phone" maxLength={30} value={draft.phone} onChange={event => setDraft({ ...draft, phone: event.target.value })} />
      {submitError && <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">{submitError}</p>}
    </div>
  </Modal>
}

function messageFor(cause: unknown, fallback: string) {
  if (cause instanceof ApiError) {
    if (cause.fieldErrors.length) return cause.fieldErrors.map(error => error.message).join(' ')
    if (cause.message === 'Email is already in use') return 'Este e-mail ja esta em uso.'
  }
  return fallback
}
