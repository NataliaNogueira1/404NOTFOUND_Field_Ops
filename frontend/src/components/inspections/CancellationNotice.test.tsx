import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CancellationNotice } from '@/components/inspections/CancellationNotice'

describe('CancellationNotice', () => {
  afterEach(cleanup)

  it('exibe motivo, quem cancelou e a data formatada em pt-BR', () => {
    render(
      <CancellationNotice
        reason="Cliente cancelou a visita técnica."
        canceledBy="Marina Supervisora"
        canceledAt="2026-11-02T12:00:00Z"
      />,
    )

    expect(screen.getByRole('alert', { name: /justificativa de cancelamento/i })).toBeInTheDocument()
    expect(screen.getByText('Cliente cancelou a visita técnica.')).toBeInTheDocument()
    expect(screen.getByText('Marina Supervisora')).toBeInTheDocument()
    // Data renderizada no locale pt-BR (dd/mm/aaaa ...)
    expect(screen.getByText(/02\/11\/2026/)).toBeInTheDocument()
  })

  it('degrada graciosamente quando os campos vêm ausentes', () => {
    render(<CancellationNotice />)

    expect(screen.getByText('Motivo não informado')).toBeInTheDocument()
    expect(screen.getByText('Usuário não identificado')).toBeInTheDocument()
    expect(screen.getByText('Data não registrada')).toBeInTheDocument()
  })
})
