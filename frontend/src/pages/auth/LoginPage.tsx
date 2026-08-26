import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { authSession, roleHome } from '@/auth/session'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

const loginSchema = z.object({ email: z.email('Informe um e-mail valido'), password: z.string().min(1, 'A senha e obrigatoria').min(6, 'A senha deve ter no minimo 6 caracteres') })
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  async function submit(data: LoginForm) {
    setServerError('')
    try {
      const user = await authSession.login(data.email, data.password)
      navigate(roleHome(user.role))
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.code === 'INVALID_CREDENTIALS') setServerError('E-mail ou senha invalidos.')
        else if (error.status === 400 || error.code === 'VALIDATION_ERROR') setServerError('Revise os dados informados.')
        else if (error.code === 'NETWORK_ERROR') setServerError('Servidor indisponivel. Verifique a API e tente novamente.')
        else setServerError('Nao foi possivel entrar agora. Tente novamente.')
        return
      }
      setServerError('Nao foi possivel entrar agora. Tente novamente.')
    }
  }
  function fillProfile(email: string) {
    setValue('email', email, { shouldValidate: true })
    setValue('password', '123456', { shouldValidate: true })
  }
  return <Card className="mx-auto w-full max-w-md p-7 sm:p-9"><div className="mb-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-card bg-primary text-white shadow-fieldops"><ShieldCheck size={29} /></div><h1 className="text-2xl font-semibold text-primary">FieldOps</h1><p className="mt-1 text-sm text-muted">Acesso web integrado a API</p></div><div className="mb-6 grid gap-2 sm:grid-cols-2"><Button variant="secondary" onClick={() => fillProfile('marina@fieldops.com')}>Supervisor</Button><Button variant="secondary" onClick={() => fillProfile('carlos@fieldops.com')}>Tecnico</Button></div><form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate><Input id="email" type="email" label="E-mail" autoComplete="email" error={errors.email?.message} {...register('email')} /><Input id="password" type="password" label="Senha" autoComplete="current-password" error={errors.password?.message} {...register('password')} />{serverError && <p className="rounded-fieldops border border-danger-light/40 bg-danger-light/10 px-3 py-2 text-sm font-medium text-danger">{serverError}</p>}<div className="flex justify-end"><button type="button" className="focus-ring rounded text-sm font-medium text-primary hover:text-primary-dark">Esqueci a senha</button></div><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Entrando...' : 'Entrar'} <ArrowRight size={17} /></Button></form><div className="mt-7 rounded-fieldops bg-slate-50 p-3 text-xs text-muted"><p>Use credenciais cadastradas no backend.</p><p>O perfil e o redirecionamento vêm da API.</p></div></Card>
}
