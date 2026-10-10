import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Lightbox, PhotoThumbnails, type LightboxPhoto } from './Lightbox'

/**
 * Regression tests for the photo lightbox (PBI-058).
 *
 * The photos use `https://` sources so the component renders real <img> elements
 * whose `alt` equals the linked item. That gives us accessible, behavior-oriented
 * queries to assert which photo is currently shown.
 */
const photos: LightboxPhoto[] = [
  {
    src: 'https://example.test/photo-1.jpg',
    item: 'Extintor de incendio',
    capturedAt: '2026-09-23T10:15:00',
    location: 'Sala tecnica',
  },
  {
    src: 'https://example.test/photo-2.jpg',
    item: 'Botao de emergencia',
    capturedAt: '2026-09-23T11:30:00',
    location: 'Linha de producao',
  },
  {
    src: 'https://example.test/photo-3.jpg',
    item: 'Painel eletrico',
    capturedAt: '2026-09-23T12:45:00',
    location: 'Subestacao',
  },
]

/** Returns the <img> rendered in the main viewing area (not a thumbnail). */
function getMainPhoto() {
  const dialog = screen.getByRole('dialog')
  // The main image is the only <img> not inside a thumbnail button labelled "Foto N".
  const images = within(dialog).getAllByRole('img')
  const main = images.find(img => {
    const button = img.closest('button')
    return !button?.getAttribute('aria-label')?.startsWith('Foto ')
  })
  if (!main) throw new Error('Main photo image not found')
  return main as HTMLImageElement
}

afterEach(cleanup)

describe('Lightbox', () => {
  it('does not render when closed', () => {
    render(<Lightbox photos={photos} initialIndex={-1} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens as a dialog on the requested photo', () => {
    render(<Lightbox photos={photos} initialIndex={0} onClose={() => {}} />)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(getMainPhoto().alt).toBe('Extintor de incendio')
    expect(within(dialog).getByText('1 / 3')).toBeInTheDocument()
  })

  it('navigates to the previous photo with the "Foto anterior" button', async () => {
    render(<Lightbox photos={photos} initialIndex={1} onClose={() => {}} />)
    expect(getMainPhoto().alt).toBe('Botao de emergencia')

    await userEvent.click(screen.getByRole('button', { name: 'Foto anterior' }))

    expect(getMainPhoto().alt).toBe('Extintor de incendio')
  })

  it('navigates to the next photo with the "Proxima foto" button', async () => {
    render(<Lightbox photos={photos} initialIndex={1} onClose={() => {}} />)
    expect(getMainPhoto().alt).toBe('Botao de emergencia')

    await userEvent.click(screen.getByRole('button', { name: 'Proxima foto' }))

    expect(getMainPhoto().alt).toBe('Painel eletrico')
  })

  it('navigates with the ArrowRight and ArrowLeft keys', async () => {
    render(<Lightbox photos={photos} initialIndex={1} onClose={() => {}} />)
    expect(getMainPhoto().alt).toBe('Botao de emergencia')

    await userEvent.keyboard('{ArrowRight}')
    expect(getMainPhoto().alt).toBe('Painel eletrico')

    await userEvent.keyboard('{ArrowLeft}')
    expect(getMainPhoto().alt).toBe('Botao de emergencia')

    await userEvent.keyboard('{ArrowLeft}')
    expect(getMainPhoto().alt).toBe('Extintor de incendio')
  })

  it('toggles zoom with the zoom button', async () => {
    render(<Lightbox photos={photos} initialIndex={0} onClose={() => {}} />)

    // Zoom off initially: the button offers to zoom in.
    expect(screen.getByRole('button', { name: 'Aumentar zoom' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reduzir zoom' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Aumentar zoom' }))

    // Zoom on: the button now offers to zoom out.
    expect(screen.getByRole('button', { name: 'Reduzir zoom' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reduzir zoom' }))

    expect(screen.getByRole('button', { name: 'Aumentar zoom' })).toBeInTheDocument()
  })

  it('enables zoom with the "+" key and disables it with the "-" key', async () => {
    render(<Lightbox photos={photos} initialIndex={0} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'Aumentar zoom' })).toBeInTheDocument()

    await userEvent.keyboard('{+}')
    expect(screen.getByRole('button', { name: 'Reduzir zoom' })).toBeInTheDocument()

    await userEvent.keyboard('{-}')
    expect(screen.getByRole('button', { name: 'Aumentar zoom' })).toBeInTheDocument()
  })

  it('shows the linked item, formatted date and location in the metadata bar', () => {
    render(<Lightbox photos={photos} initialIndex={0} onClose={() => {}} />)

    const dialog = screen.getByRole('dialog')
    // The linked item appears in the top bar and in the metadata bar.
    expect(within(dialog).getAllByText('Extintor de incendio').length).toBeGreaterThan(0)
    // Date formatted as pt-BR dd/mm/yyyy HH:MM (09/23 -> 23/09/2026).
    expect(within(dialog).getByText(/23\/09\/2026/)).toBeInTheDocument()
    expect(within(dialog).getByText('Sala tecnica')).toBeInTheDocument()
  })

  it('closes when the X button is clicked', async () => {
    function Harness() {
      const [index, setIndex] = useState(0)
      return <Lightbox photos={photos} initialIndex={index} onClose={() => setIndex(-1)} />
    }
    render(<Harness />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Fechar lightbox' }))

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes when the Escape key is pressed', async () => {
    function Harness() {
      const [index, setIndex] = useState(0)
      return <Lightbox photos={photos} initialIndex={index} onClose={() => setIndex(-1)} />
    }
    render(<Harness />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('wraps around when navigating past the last photo', async () => {
    render(<Lightbox photos={photos} initialIndex={2} onClose={() => {}} />)
    expect(getMainPhoto().alt).toBe('Painel eletrico')

    await userEvent.click(screen.getByRole('button', { name: 'Proxima foto' }))

    expect(getMainPhoto().alt).toBe('Extintor de incendio')
  })

  it('hides navigation controls when there is a single photo', () => {
    render(<Lightbox photos={[photos[0]]} initialIndex={0} onClose={() => {}} />)

    expect(screen.queryByRole('button', { name: 'Foto anterior' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Proxima foto' })).toBeNull()
    expect(getMainPhoto().alt).toBe('Extintor de incendio')
  })
})

describe('PhotoThumbnails', () => {
  it('renders one accessible button per photo', () => {
    render(<PhotoThumbnails photos={photos} onOpen={() => {}} />)

    expect(screen.getByRole('button', { name: 'Abrir foto 1: Extintor de incendio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir foto 2: Botao de emergencia' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir foto 3: Painel eletrico' })).toBeInTheDocument()
  })

  it('calls onOpen with the clicked thumbnail index', async () => {
    const opened: number[] = []
    render(<PhotoThumbnails photos={photos} onOpen={index => opened.push(index)} />)

    await userEvent.click(screen.getByRole('button', { name: 'Abrir foto 2: Botao de emergencia' }))

    expect(opened).toEqual([1])
  })

  it('renders nothing when there are no photos', () => {
    const { container } = render(<PhotoThumbnails photos={[]} onOpen={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
