import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InspectionsPage } from '@/pages/inspections/InspectionsPage'

describe('InspectionsPage filters', () => {
  it('searches inspections by related equipment name', async () => {
    render(<MemoryRouter><InspectionsPage /></MemoryRouter>)

    await userEvent.type(screen.getByLabelText(/busca/i), 'Gerador Diesel')

    expect(screen.getByText(/inspecao gerador diesel/i)).not.toBeNull()
    expect(screen.queryByText(/inspecao extintor p12/i)).toBeNull()
  })
})
