import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataTable } from '@/components/tables/DataTable'

const columns = [
  { header: 'Nome', sortKey: 'name', cell: (row: { name: string }) => row.name },
]

afterEach(cleanup)

describe('DataTable', () => {
  it('shows the server page range and reusable page-size options', async () => {
    const changeSize = vi.fn()
    render(<DataTable columns={columns} rows={[{ name: 'Atlas' }]} page={2} pageSize={10}
      totalRows={42} totalPages={5} onPageChange={vi.fn()} onPageSizeChange={changeSize} />)

    expect(screen.getByText('Mostrando 11-20 de 42')).not.toBeNull()
    expect(screen.getByText('Pagina 2 de 5')).not.toBeNull()
    expect(screen.getByLabelText('Itens por pagina')).toHaveTextContent('10')
    expect(screen.getByLabelText('Itens por pagina')).toHaveTextContent('25')
    expect(screen.getByLabelText('Itens por pagina')).toHaveTextContent('50')
    await userEvent.selectOptions(screen.getByLabelText('Itens por pagina'), '25')
    expect(changeSize).toHaveBeenCalledWith(25)
  })

  it('sorts through a configurable column header', async () => {
    const sort = vi.fn()
    render(<DataTable columns={columns} rows={[{ name: 'Atlas' }]} sort="name,asc" onSortChange={sort} />)

    expect(screen.getByRole('columnheader', { name: 'Nome' })).toHaveAttribute('aria-sort', 'ascending')
    await userEvent.click(screen.getByRole('button', { name: 'Nome' }))
    expect(sort).toHaveBeenCalledWith('name')
  })

  it('renders standardized loading and empty states', () => {
    const { rerender } = render(<DataTable columns={columns} rows={[]} loading loadingLabel="Carregando registros..." />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando registros...')
    rerender(<DataTable columns={columns} rows={[]} />)
    expect(screen.getByText('Nenhum registro encontrado')).not.toBeNull()
  })
})
