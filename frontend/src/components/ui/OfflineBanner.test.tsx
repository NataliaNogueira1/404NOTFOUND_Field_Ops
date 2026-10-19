import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OfflineBanner } from '@/components/ui/OfflineBanner'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('OfflineBanner', () => {
  it('renders nothing when online', () => {
    vi.stubGlobal('navigator', { onLine: true })
    const { container } = render(<OfflineBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the offline banner when offline', () => {
    vi.stubGlobal('navigator', { onLine: false })
    render(<OfflineBanner />)
    expect(screen.getByRole('status', { name: /sem conexão/i })).toBeInTheDocument()
    expect(screen.getByText(/você está offline/i)).toBeInTheDocument()
  })

  it('shows the banner when the "offline" event fires while online', () => {
    vi.stubGlobal('navigator', { onLine: true })
    render(<OfflineBanner />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/você está offline/i)).toBeInTheDocument()
  })

  it('hides the banner when the "online" event fires while offline', () => {
    vi.stubGlobal('navigator', { onLine: false })
    render(<OfflineBanner />)
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
