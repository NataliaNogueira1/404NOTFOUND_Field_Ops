import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorState } from '@/components/ui/ErrorState'

afterEach(cleanup)

describe('ErrorState', () => {
  it('renders the default message', () => {
    render(<ErrorState />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Ocorreu um erro ao carregar os dados.')).toBeInTheDocument()
  })

  it('renders a custom message', () => {
    render(<ErrorState message="Não foi possível carregar os usuários." />)
    expect(screen.getByText('Não foi possível carregar os usuários.')).toBeInTheDocument()
  })

  it('does not render a retry button when onRetry is not provided', () => {
    render(<ErrorState />)
    expect(screen.queryByRole('button', { name: /tentar novamente/i })).not.toBeInTheDocument()
  })

  it('renders a retry button when onRetry is provided', () => {
    render(<ErrorState onRetry={() => {}} />)
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('calls onRetry when the retry button is clicked', async () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
