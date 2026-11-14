import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InspectionIdCell } from '@/components/inspections/InspectionIdCell'

describe('InspectionIdCell', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('exibe o ID curto por extenso com prefixo #', () => {
    render(<InspectionIdCell id="9" />)
    expect(screen.getByText('#9')).toBeInTheDocument()
  })

  it('abrevia IDs longos (UUID) e mantém o valor completo no tooltip', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000'
    render(<InspectionIdCell id={uuid} />)

    const label = screen.getByText('123e4567…')
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('title', uuid)
  })

  it('copia o ID completo para a área de transferência ao clicar', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.assign(navigator, { clipboard: { writeText } })

    render(<InspectionIdCell id="42" />)
    await userEvent.click(screen.getByRole('button', { name: /copiar id 42/i }))

    expect(writeText).toHaveBeenCalledWith('42')
    expect(await screen.findByRole('button', { name: /id 42 copiado/i })).toBeInTheDocument()
  })
})
