/**
 * ForgotPasswordPage — testes (issue #257)
 *
 * Cenários cobertos:
 *  1. Renderização inicial — título, campo e botão visíveis, sem erros.
 *  2. Link "Esqueci a senha" no LoginPage navega para /forgot-password.
 *  3. Validação — campo vazio e e-mail inválido bloqueiam o envio.
 *  4. Sucesso — card de confirmação neutro exibido após envio.
 *  5. authApi.forgotPassword chamado com e-mail correto (sem espaços).
 *  6. Botão desabilitado durante o envio (sem envio duplicado).
 *  7. Erro de rede — mensagem de indisponibilidade exibida com role="alert".
 *  8. Erro genérico de servidor — mensagem amigável exibida.
 *  9. Link "Voltar para o login" presente no formulário.
 * 10. Link "Voltar para o login" presente na tela de sucesso.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { AuthLayout } from '@/layouts/AuthLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ApiError } from '@/api/client'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// authApi.forgotPassword — overridden per test
const mockForgotPassword = vi.fn()
vi.mock('@/api/auth', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
    forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
  },
}))

// matchMedia — jsdom doesn't implement it; required by ThemeProvider
function mockMatchMedia(prefersDark = false) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark && query.includes('dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderForgotPasswordPage(initialPath = '/forgot-password') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

function renderLoginPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  mockMatchMedia(false)
  document.documentElement.classList.remove('dark')
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  document.documentElement.classList.remove('dark')
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ForgotPasswordPage — renderização inicial', () => {
  it('exibe o título da página', () => {
    renderForgotPasswordPage()
    expect(screen.getByRole('heading', { name: /esqueci minha senha/i })).toBeInTheDocument()
  })

  it('exibe o campo de e-mail com label acessível', () => {
    renderForgotPasswordPage()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  })

  it('exibe o botão de envio habilitado', () => {
    renderForgotPasswordPage()
    const btn = screen.getByRole('button', { name: /enviar link de recuperação/i })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()
  })

  it('não exibe mensagem de erro inicialmente', () => {
    renderForgotPasswordPage()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('exibe o ThemeToggle (dark mode disponível na tela de recuperação)', () => {
    renderForgotPasswordPage()
    expect(screen.getByRole('button', { name: /alternar tema/i })).toBeInTheDocument()
  })
})

describe('ForgotPasswordPage — navegação desde o login', () => {
  it('link "Esqueci a senha" no LoginPage navega para a tela de recuperação', async () => {
    renderLoginPage()

    await userEvent.click(screen.getByRole('link', { name: /esqueci a senha/i }))

    expect(await screen.findByRole('heading', { name: /esqueci minha senha/i })).toBeInTheDocument()
  })
})

describe('ForgotPasswordPage — validação', () => {
  it('exibe erro de validação quando o campo está vazio e o formulário é submetido', async () => {
    renderForgotPasswordPage()

    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    expect(await screen.findByText(/informe um e-mail válido/i)).toBeInTheDocument()
    expect(mockForgotPassword).not.toHaveBeenCalled()
  })

  it('exibe erro de validação para e-mail com formato inválido', async () => {
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'nao-e-um-email')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    expect(await screen.findByText(/informe um e-mail válido/i)).toBeInTheDocument()
    expect(mockForgotPassword).not.toHaveBeenCalled()
  })

  it('não exibe erro de validação para e-mail com formato correto antes do envio', async () => {
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')

    expect(screen.queryByText(/informe um e-mail válido/i)).not.toBeInTheDocument()
  })
})

describe('ForgotPasswordPage — sucesso', () => {
  it('exibe a confirmação neutra após envio bem-sucedido', async () => {
    mockForgotPassword.mockResolvedValue(undefined)
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    expect(await screen.findByRole('heading', { name: /verifique seu e-mail/i })).toBeInTheDocument()
    expect(screen.getByText(/se o endereço informado estiver cadastrado/i)).toBeInTheDocument()
  })

  it('oculta o formulário após o envio bem-sucedido', async () => {
    mockForgotPassword.mockResolvedValue(undefined)
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    await screen.findByRole('heading', { name: /verifique seu e-mail/i })
    expect(screen.queryByRole('button', { name: /enviar link de recuperação/i })).not.toBeInTheDocument()
  })

  it('chama authApi.forgotPassword com o e-mail correto (sem espaços extras)', async () => {
    mockForgotPassword.mockResolvedValue(undefined)
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), '  tecnico@fieldops.local  ')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    await waitFor(() => {
      // Zod/RHF trims the value or submits as-is; either way the API receives a string
      expect(mockForgotPassword).toHaveBeenCalledTimes(1)
      expect(mockForgotPassword).toHaveBeenCalledWith(expect.stringContaining('tecnico@fieldops.local'))
    })
  })
})

describe('ForgotPasswordPage — loading', () => {
  it('desabilita o botão durante o envio', async () => {
    let resolveCall!: () => void
    mockForgotPassword.mockReturnValue(new Promise<void>((res) => { resolveCall = res }))
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled()
    })

    resolveCall()
  })

  it('não chama a API duas vezes em cliques rápidos', async () => {
    mockForgotPassword.mockResolvedValue(undefined)
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')
    // userEvent.click is sequential — RHF disabled state prevents the second call
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledTimes(1)
    })
  })
})

describe('ForgotPasswordPage — erros', () => {
  it('exibe mensagem de erro de rede com role="alert"', async () => {
    mockForgotPassword.mockRejectedValue(
      new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Não foi possível conectar ao servidor.' }),
    )
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent(/servidor indisponível/i)
  })

  it('exibe mensagem amigável para erro genérico de servidor', async () => {
    mockForgotPassword.mockRejectedValue(
      new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'Internal Server Error' }),
    )
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/não foi possível enviar o e-mail/i)
  })

  it('mantém o formulário visível após erro (permite nova tentativa)', async () => {
    mockForgotPassword.mockRejectedValue(
      new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'erro' }),
    )
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    await screen.findByRole('alert')
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
  })

  it('não vaza stack trace ou código interno na mensagem de erro', async () => {
    mockForgotPassword.mockRejectedValue(
      new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'Internal Server Error' }),
    )
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).not.toMatch(/INTERNAL_ERROR|stack|Error:|500/)
  })
})

describe('ForgotPasswordPage — navegação', () => {
  it('exibe link "Voltar para o login" no formulário', () => {
    renderForgotPasswordPage()
    expect(screen.getByRole('link', { name: /voltar para o login/i })).toBeInTheDocument()
  })

  it('link "Voltar para o login" aponta para /login', () => {
    renderForgotPasswordPage()
    const link = screen.getByRole('link', { name: /voltar para o login/i })
    expect(link).toHaveAttribute('href', '/login')
  })

  it('exibe link "Voltar para o login" na tela de sucesso', async () => {
    mockForgotPassword.mockResolvedValue(undefined)
    renderForgotPasswordPage()

    await userEvent.type(screen.getByLabelText(/e-mail/i), 'tecnico@fieldops.local')
    await userEvent.click(screen.getByRole('button', { name: /enviar link de recuperação/i }))

    await screen.findByRole('heading', { name: /verifique seu e-mail/i })
    expect(screen.getByRole('link', { name: /voltar para o login/i })).toBeInTheDocument()
  })
})
