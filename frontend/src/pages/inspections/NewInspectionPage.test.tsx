import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NewInspectionPage } from '@/pages/inspections/NewInspectionPage'

describe('NewInspectionPage chained selects', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('filters sites by client and equipment by site', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/versions')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                id: '11',
                versionNumber: 1,
                titleSnapshot: 'Preventiva',
                descriptionSnapshot: null,
                publishedAt: '2026-09-01T00:00:00Z',
                publishedBy: 1,
              },
            ]),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }
      const content = url.includes('/api/v1/equipment?')
        ? [{ id: 'eq-api', siteId: 'site-sorocaba', name: 'Compressor API', status: 'ACTIVE' }]
        : url.includes('/api/v1/sites?')
          ? [{ id: 'site-sorocaba', clientId: 'cli-industria', name: 'Unidade Sorocaba', status: 'ACTIVE' }]
          : url.includes('/api/v1/clients?')
            ? [
                { id: 'cli-industria', name: 'Industria Modelo' },
                { id: 'cli-logistica', name: 'Logistica ABC' },
              ]
            : url.includes('/api/v1/users?')
              ? [{ id: 3, name: 'Carlos Henrique', email: 'carlos@example.com', role: 'TECHNICIAN', status: 'ACTIVE' }]
              : [
                  {
                    id: 'tpl-1',
                    title: 'Preventiva',
                    category: 'Geral',
                    version: 1,
                    sectionCount: 1,
                    itemCount: 1,
                    status: 'ACTIVE',
                  },
                ]
      return Promise.resolve(
        new Response(
          JSON.stringify({
            content,
            totalElements: content.length,
            totalPages: 1,
            number: 0,
            size: 100,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter>
        <NewInspectionPage />
      </MemoryRouter>,
    )

    const siteSelect = screen.getByLabelText(/^local$/i)
    const equipmentSelect = screen.getByLabelText(/equipamento/i)

    expect(siteSelect).toHaveProperty('disabled', true)
    expect(equipmentSelect).toHaveProperty('disabled', true)
    expect(screen.queryByRole('option', { name: /metalurgica horizonte/i })).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('status=ACTIVE'), expect.anything())

    await screen.findByRole('option', { name: /industria modelo/i })
    await userEvent.selectOptions(screen.getByLabelText(/cliente/i), 'cli-industria')
    expect(siteSelect).toHaveProperty('disabled', false)
    expect(await screen.findByRole('option', { name: /unidade sorocaba/i })).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/sites\?.*clientId=cli-industria.*status=ACTIVE/),
      expect.anything(),
    )

    await userEvent.selectOptions(siteSelect, 'site-sorocaba')
    expect(equipmentSelect).toHaveProperty('disabled', false)
    expect(await screen.findByRole('option', { name: /compressor api/i })).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/equipment\?.*siteId=site-sorocaba.*status=ACTIVE/),
      expect.anything(),
    )
  })

  it('schedules an inspection without equipment and omits equipmentId from the payload', async () => {
    let postBody: Record<string, unknown> | undefined
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/v1/inspections') && init?.method === 'POST') {
        postBody = JSON.parse(String(init.body)) as Record<string, unknown>
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 99,
              title: 'Preventiva - Unidade Sorocaba',
              status: 'ASSIGNED',
              dueDate: '2026-09-30',
              clientName: 'Industria Modelo',
              equipmentName: null,
              technicianName: 'Carlos Henrique',
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }
      if (url.includes('/versions')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                id: '11',
                versionNumber: 1,
                titleSnapshot: 'Preventiva',
                descriptionSnapshot: null,
                publishedAt: '2026-09-01T00:00:00Z',
                publishedBy: 1,
              },
            ]),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }

      const content = url.includes('/api/v1/equipment?')
        ? []
        : url.includes('/api/v1/sites?')
          ? [{ id: 2, clientId: 1, name: 'Unidade Sorocaba', status: 'ACTIVE' }]
          : url.includes('/api/v1/clients?')
            ? [{ id: 1, name: 'Industria Modelo' }]
            : url.includes('/api/v1/users?')
              ? [{ id: 3, name: 'Carlos Henrique', email: 'carlos@example.com', role: 'TECHNICIAN', status: 'ACTIVE' }]
              : [
                  {
                    id: 'tpl-1',
                    title: 'Preventiva',
                    category: 'Geral',
                    version: 1,
                    sectionCount: 1,
                    itemCount: 1,
                    status: 'ACTIVE',
                  },
                ]
      return Promise.resolve(
        new Response(
          JSON.stringify({
            content,
            totalElements: content.length,
            totalPages: 1,
            number: 0,
            size: 100,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    render(
      <MemoryRouter>
        <NewInspectionPage />
      </MemoryRouter>,
    )

    await screen.findByRole('option', { name: /industria modelo/i })
    await userEvent.selectOptions(screen.getByLabelText(/cliente/i), '1')
    await screen.findByRole('option', { name: /unidade sorocaba/i })
    await userEvent.selectOptions(screen.getByLabelText(/^local$/i), '2')
    expect(await screen.findByRole('option', { name: /nenhum resultado/i })).not.toBeNull()
    await screen.findByRole('option', { name: /carlos henrique/i })
    await userEvent.selectOptions(screen.getByLabelText(/técnico/i), '3')
    await userEvent.type(screen.getByLabelText(/data prevista/i), '2026-09-30')
    await userEvent.click(screen.getByRole('button', { name: /agendar inspeção/i }))

    await waitFor(() =>
      expect(postBody).toMatchObject({
        title: 'Preventiva — Unidade Sorocaba',
        templateVersionId: 11,
        clientId: 1,
        siteId: 2,
        technicianId: 3,
      }),
    )
    expect(postBody).not.toHaveProperty('equipmentId')
  })
})
