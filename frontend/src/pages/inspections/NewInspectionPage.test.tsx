import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NewInspectionPage } from '@/pages/inspections/NewInspectionPage'

describe('NewInspectionPage chained selects', () => {
  it('filters sites by client and equipment by site', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      content: [
        { id: 'cli-industria', name: 'Industria Modelo' },
        { id: 'cli-logistica', name: 'Logistica ABC' },
      ], totalElements: 2, totalPages: 1, number: 0, size: 100,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><NewInspectionPage /></MemoryRouter>)

    const siteSelect = screen.getByLabelText(/^local$/i)
    const equipmentSelect = screen.getByLabelText(/equipamento/i)

    expect(siteSelect).toHaveProperty('disabled', true)
    expect(equipmentSelect).toHaveProperty('disabled', true)
    expect(screen.queryByRole('option', { name: /metalurgica horizonte/i })).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('status=ACTIVE'), expect.anything())

    await userEvent.selectOptions(screen.getByLabelText(/cliente/i), 'cli-industria')
    expect(siteSelect).toHaveProperty('disabled', false)
    expect(screen.getByRole('option', { name: /unidade sorocaba/i })).not.toBeNull()

    await userEvent.selectOptions(siteSelect, 'site-sorocaba')
    expect(equipmentSelect).toHaveProperty('disabled', false)
    expect(screen.getByRole('option', { name: /compressor xpto 500/i })).not.toBeNull()
  })
})
