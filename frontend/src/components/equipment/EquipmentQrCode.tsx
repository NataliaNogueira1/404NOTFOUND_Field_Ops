import { QRCodeSVG } from 'qrcode.react'

// Scanners need dark modules on a light background, so these colors stay fixed
// instead of following the theme tokens (a dark theme would invert the code).
const QR_FOREGROUND = '#000000'
const QR_BACKGROUND = '#FFFFFF'

interface EquipmentQrCodeProps {
  name: string
  qrCode: string
}

/** Scannable QR Code for an equipment, read by the mobile app to confirm identity. */
export function EquipmentQrCode({ name, qrCode }: EquipmentQrCodeProps) {
  return (
    <div className="grid place-items-center gap-4">
      <div className="rounded-card border border-border bg-white p-3">
        <QRCodeSVG
          value={qrCode}
          size={176}
          level="M"
          marginSize={2}
          fgColor={QR_FOREGROUND}
          bgColor={QR_BACKGROUND}
          role="img"
          aria-label={`QR Code ${qrCode}`}
        />
      </div>
      <div className="text-center">
        <p className="font-semibold">{name}</p>
        <p className="font-mono text-sm text-muted">{qrCode}</p>
      </div>
    </div>
  )
}
