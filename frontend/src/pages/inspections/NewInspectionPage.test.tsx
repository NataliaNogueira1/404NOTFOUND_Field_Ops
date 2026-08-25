import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NewInspectionPage } from '@/pages/inspections/NewInspectionPage'

describe('NewInspectionPage chained selects', () => {
  it('filters sites by client and equipment by site', async () => {
    render(<MemoryRouter><NewInspectionPage /></MemoryRouter>)

    const siteSelect = screen.getByLabelText(/^local$/i)
    const equipmentSelect = screen.getByLabelText(/equipamento/i)

    expect(siteSelect).toHaveProperty('disabled', true)
    expect(equipmentSelect).toHaveProperty('disabled', true)

    await userEvent.selectOptions(screen.getByLabelText(/cliente/i), 'cli-industria')
    expect(siteSelect).toHaveProperty('disabled', false)
    expect(screen.getByRole('option', { name: /unidade sorocaba/i })).not.toBeNull()

    await userEvent.selectOptions(siteSelect, 'site-sorocaba')
    expect(equipmentSelect).toHaveProperty('disabled', false)
    expect(screen.getByRole('option', { name: /compressor xpto 500/i })).not.toBeNull()
  })
})
