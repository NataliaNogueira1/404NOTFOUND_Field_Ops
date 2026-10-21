/**
 * ForgotPasswordPage — issue #257
 *
 * Self-service password recovery flow for the web admin panel.
 * Architecture: page → hook (useForgotPassword) → authApi → client.ts
 *
 * States:
 *   idle    — form visible, button enabled
 *   loading — spinner label, submit disabled
 *   success — neutral confirmation card (never reveals if e-mail exists)
 *   error   — alert message below form, user can retry
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

// ─── Schema ───────────────────────────────────────────────────────────────────

const forgotPasswordSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
})
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

// ─── Success view ─────────────────────────────────────────────────────────────

function SuccessView() {
  return (
    <Card className="mx-auto w-full max-w-md px-6 py-8 sm:px-9 sm:py-12">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <Mail size={24} className="text-success" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-text">Verifique seu e-mail</h1>
        <p className="text-sm text-muted">
          Se o endereço informado estiver cadastrado, você receberá as instruções
          para redefinir sua senha em breve.
        </p>
        <p className="text-xs text-muted">Não esqueça de verificar a caixa de spam.</p>
      </div>
      <Link
        to="/login"
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-fieldops text-sm font-medium text-primary hover:text-primary-dark"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Voltar para o login
      </Link>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function submit(data: ForgotPasswordForm) {
    setServerError('')
    try {
      await authApi.forgotPassword(data.email)
      setSubmitted(true)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'NETWORK_ERROR') {
          setServerError('Servidor indisponível. Verifique sua conexão e tente novamente.')
        } else {
          setServerError('Não foi possível enviar o e-mail. Tente novamente mais tarde.')
        }
      } else {
        setServerError('Não foi possível enviar o e-mail. Tente novamente mais tarde.')
      }
    }
  }

  if (submitted) return <SuccessView />

  return (
    <Card className="mx-auto w-full max-w-md px-6 py-8 sm:px-9 sm:py-12">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-text">Esqueci minha senha</h1>
        <p className="mt-2 text-sm text-muted">
          Informe seu e-mail cadastrado e enviaremos as instruções de recuperação.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        <Input
          id="email"
          type="email"
          label="E-mail"
          autoComplete="email"
          autoFocus
          placeholder="seu@email.com"
          error={errors.email?.message}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />

        {serverError && (
          <p
            role="alert"
            className="rounded-fieldops border border-danger-light/40 bg-danger-light/10 px-3 py-2 text-sm font-medium text-danger"
          >
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
        </Button>
      </form>

      <div className="mt-5 flex justify-center">
        <Link
          to="/login"
          className="focus-ring flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:text-primary-dark"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Voltar para o login
        </Link>
      </div>
    </Card>
  )
}
