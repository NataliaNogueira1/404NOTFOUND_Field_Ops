import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
const loginSchema = z.object({ email: z.email('Informe um e-mail valido'), password: z.string().min(1, 'A senha e obrigatoria').min(6, 'A senha deve ter no minimo 6 caracteres') })
type LoginForm = z.infer<typeof loginSchema>
export function LoginPage() { const navigate = useNavigate(); const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: 'marina@fieldops.com', password: '123456' } }); return <Card className="mx-auto w-full max-w-md p-7 sm:p-9"><div className="mb-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-card bg-primary text-white shadow-fieldops"><ShieldCheck size={29} /></div><h1 className="text-2xl font-semibold text-primary">FieldOps</h1><p className="mt-1 text-sm text-muted">Plataforma de Inspecao</p></div><form className="space-y-5" onSubmit={handleSubmit(() => navigate('/app/dashboard'))} noValidate><Input id="email" type="email" label="E-mail" autoComplete="email" error={errors.email?.message} {...register('email')} /><Input id="password" type="password" label="Senha" autoComplete="current-password" error={errors.password?.message} {...register('password')} /><div className="flex justify-end"><button type="button" className="focus-ring rounded text-sm font-medium text-primary hover:text-primary-dark">Esqueci a senha</button></div><Button type="submit" className="w-full" disabled={isSubmitting}>Entrar <ArrowRight size={17} /></Button></form><p className="mt-7 text-center text-xs text-muted">Protótipo web administrativo</p></Card> }
