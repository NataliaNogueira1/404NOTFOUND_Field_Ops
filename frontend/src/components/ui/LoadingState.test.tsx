import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { LoadingState } from '@/components/ui/LoadingState'

afterEach(cleanup)

describe('LoadingState', () => {
  it('renders with default label', () => {
    render(<LoadingState />)
    expect(screen.getByRole('status', { name: 'Carregando...' })).toBeInTheDocument()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('renders a custom label', () => {
    render(<LoadingState label="Buscando usuários..." />)
    expect(screen.getByRole('status', { name: 'Buscando usuários...' })).toBeInTheDocument()
    expect(screen.getByText('Buscando usuários...')).toBeInTheDocument()
  })
})
