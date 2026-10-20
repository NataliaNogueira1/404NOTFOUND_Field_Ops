// Equipment lookup against the FieldOps API (PBI-041 / RN-064).
//
// Used by the QR scanner as an ONLINE fallback: when a scanned/typed code is not
// present in the technician's locally synced inspections, we ask the server for
// the equipment behind that QR code (GET /api/v1/equipment/by-qr/{qrCode}).
import { apiClient } from './client';

/**
 * Equipment payload returned by the API (subset of the backend
 * `EquipmentResponse` record — only the fields the scanner displays are typed).
 */
export interface ApiEquipment {
  name: string;
  assetNumber: string;
  siteName: string;
  qrCode: string;
  status: string;
}

/**
 * Looks up an equipment by its unique QR code on the server.
 *
 * @returns the equipment when the QR exists, or `null` when the server replies
 *          404 (unknown QR). Any other error (network, auth) is re-thrown so the
 *          caller can tell "not found" apart from "could not reach the server".
 */
export async function fetchEquipmentByQrCode(
  qrCode: string,
  token: string,
): Promise<ApiEquipment | null> {
  try {
    const encoded = encodeURIComponent(qrCode);
    return await apiClient.get<ApiEquipment>(`/api/v1/equipment/by-qr/${encoded}`, token);
  } catch (error) {
    // The client throws `API 404: ...` for an unknown QR code — treat that as a
    // clean "not found", not an error, so the scanner can show its own message.
    if (error instanceof Error && error.message.startsWith('API 404')) {
      return null;
    }
    throw error;
  }
}
