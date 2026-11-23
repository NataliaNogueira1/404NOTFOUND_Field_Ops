import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { EquipmentQrCode } from '@/components/equipment/EquipmentQrCode'

afterEach(cleanup)

function qrPathData(code: string) {
  const { unmount } = render(<EquipmentQrCode name="Compressor" qrCode={code} />)
  const pathData = screen
    .getByRole('img', { name: `QR Code ${code}` })
    .querySelector('path:last-of-type')
    ?.getAttribute('d')
  unmount()
  return pathData
}

describe('EquipmentQrCode', () => {
  it('renders a scannable QR image named after the equipment code', () => {
    render(<EquipmentQrCode name="Compressor XPTO" qrCode="FO-QR-001" />)

    const image = screen.getByRole('img', { name: 'QR Code FO-QR-001' })
    expect(image.tagName.toLowerCase()).toBe('svg')
    expect(image.querySelector('path')).not.toBeNull()
    expect(screen.getByText('Compressor XPTO')).not.toBeNull()
    expect(screen.getByText('FO-QR-001')).not.toBeNull()
  })

  it('encodes the equipment code, so different codes produce different images', () => {
    const first = qrPathData('FO-QR-001')
    const second = qrPathData('FO-QR-002')

    expect(first).toBeTruthy()
    expect(first).not.toBe(second)
  })
})
