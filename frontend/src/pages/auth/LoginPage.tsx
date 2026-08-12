import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

const loginSchema = z.object({ email: z.email('Informe um e-mail válido'), password: z.string().min(1, 'A senha é obrigatória').min(6, 'A senha deve ter no mínimo 6 caracteres') })
type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  return <Card className="mx-auto w-full max-w-md p-7 sm:p-9">
    <div className="mb-8 text-center"><div className="mx-auto mb-4 grid h-13 w-13 place-items-center rounded-xl bg-primary text-white shadow-lg shadow-blue-200"><ShieldCheck size={27} /></div><h1 className="text-2xl font-bold">FieldOps</h1><p className="mt-1 text-sm text-muted">Plataforma de Inspeção</p><span className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">Interface Administrativa</span></div>
    <form className="space-y-5" onSubmit={handleSubmit(() => navigate('/app/dashboard'))} noValidate>
      <Input id="email" type="email" label="E-mail" placeholder="seu@email.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input id="password" type="password" label="Senha" placeholder="••••••••" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
      <Button type="submit" className="w-full" disabled={isSubmitting}>Entrar <ArrowRight size={17} /></Button>
    </form>
    <p className="mt-7 text-center text-xs text-muted">Ambiente acadêmico de demonstração</p>
  </Card>
}
