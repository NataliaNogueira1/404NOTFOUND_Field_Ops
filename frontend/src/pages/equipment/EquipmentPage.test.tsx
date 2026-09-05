import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EquipmentPage } from '@/pages/equipment/EquipmentPage'

const site = {
  id: '53bb819a-4203-4c5a-aad8-057f421f59b1', clientId: '3e2fd0ad-93f1-4c51-a8ea-2f45f08e0f10',
  clientName: 'Industria Atlas', name: 'Unidade Centro', description: null, address: null,
  city: 'Sao Paulo', state: 'SP', zipCode: null, latitude: null, longitude: null,
  contactName: null, contactPhone: null, status: 'ACTIVE', equipmentCount: 1, version: 0,
}

const equipment = {
  id: 'e162020b-afaf-4795-8263-54b36488e775', siteId: site.id, siteName: site.name,
  clientId: site.clientId, name: 'Compressor XPTO', assetNumber: 'PAT-001',
  serialNumber: 'SN-001', manufacturer: 'Atlas', model: 'XPTO', description: 'Industrial',
  qrCode: 'FO-QR-001', status: 'ACTIVE', installedAt: '2026-09-04', version: 0,
}

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  }))
}

function page(content: unknown[]) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, size: 10 }
}

function defaultFetch(input: RequestInfo | URL) {
  return String(input).includes('/api/v1/sites?') ? json(page([site])) : json(page([equipment]))
}

beforeEach(() => window.sessionStorage.setItem('fieldops:access-token', 'supervisor-token'))
afterEach(cleanup)

describe('EquipmentPage', () => {
  it('lists equipment and sends site and lifecycle filters to the server', async () => {
    const fetchMock = vi.fn(defaultFetch)
    vi.stubGlobal('fetch', fetchMock)
    render(<MemoryRouter><EquipmentPage /></MemoryRouter>)

    expect(await screen.findByText('Compressor XPTO')).not.toBeNull()
    expect(screen.getByText('PAT-001')).not.toBeNull()
    expect(screen.getByText('Unidade Centro')).not.toBeNull()
    expect(screen.getByText('FO-QR-001')).not.toBeNull()

    await userEvent.selectOptions(screen.getByLabelText('Local'), site.id)
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'DECOMMISSIONED')

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map(call => String(call[0])).filter(url => url.includes('/api/v1/equipment?'))
      expect(calls.at(-1)).toContain(`siteId=${site.id}`)
      expect(calls.at(-1)).toContain('status=DECOMMISSIONED')
    })
  })

  it('creates equipment with all fields and generates a QR code', async () => {
    let postBody: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/v1/equipment') && init?.method === 'POST') {
        postBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return json(equipment, 201)
      }
      return defaultFetch(input)
    }))
    render(<MemoryRouter><EquipmentPage /></MemoryRouter>)
    await screen.findByText('Compressor XPTO')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Novo equipamento' })).not.toBeDisabled())

    await userEvent.click(screen.getByRole('button', { name: 'Novo equipamento' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Nome'), 'Gerador Diesel')
    await userEvent.type(within(dialog).getByLabelText('Nº Patrimonio (opcional)'), 'PAT-900')
    await userEvent.type(within(dialog).getByLabelText('Nº Serie (opcional)'), 'SN-900')
    await userEvent.type(within(dialog).getByLabelText('Fabricante (opcional)'), 'Cummins')
    await userEvent.type(within(dialog).getByLabelText('Modelo (opcional)'), 'C90')
    await userEvent.type(within(dialog).getByLabelText('Descricao (opcional)'), 'Gerador principal')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Gerar QR Code' }))
    await userEvent.selectOptions(within(dialog).getByLabelText('Status'), 'ACTIVE')
    await userEvent.type(within(dialog).getByLabelText('Data de instalacao (opcional)'), '2026-09-04')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(postBody).toMatchObject({
      siteId: site.id, name: 'Gerador Diesel', assetNumber: 'PAT-900', serialNumber: 'SN-900',
      manufacturer: 'Cummins', model: 'C90', description: 'Gerador principal',
      status: 'ACTIVE', installedAt: '2026-09-04',
    }))
    expect(String(postBody?.qrCode)).toMatch(/^FO-[0-9a-f-]{36}$/)
  })

  it('requires confirmation before logical inactivation', async () => {
    let patchBody: Record<string, unknown> | undefined
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith(`/api/v1/equipment/${equipment.id}/status`)) {
        patchBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        return json({ ...equipment, status: 'INACTIVE', version: 1 })
      }
      return defaultFetch(input)
    }))
    render(<MemoryRouter><EquipmentPage /></MemoryRouter>)
    await screen.findByText('Compressor XPTO')

    await userEvent.click(screen.getByRole('button', { name: 'Inativar Compressor XPTO' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('deixara de aparecer em novas inspecoes')
    expect(patchBody).toBeUndefined()
    await userEvent.click(screen.getByRole('button', { name: 'Inativar' }))

    await waitFor(() => expect(patchBody).toEqual({ status: 'INACTIVE' }))
  })
})
