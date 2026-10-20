import { Platform } from 'react-native';

/**
 * Isolated client for uploading an evidence file to the server (PBI-044, RN-078).
 *
 * Contract: POST /api/v1/inspections/{id}/evidence (multipart/form-data)
 *   - file            (required) — binary file blob
 *   - itemId          (required) — Long id of the snapshot item
 *   - capturedAtDevice (required) — ISO-8601 timestamp from the device (RN-074)
 *   - operationId     (required) — UUID for idempotent re-sends (RN-068)
 *   - responseId      (optional) — ties the evidence to a specific answer
 *   - mimeType        (optional) — defaults to image/jpeg on the server
 *   - description     (optional) — free-text caption
 *   - latitude        (optional) — must accompany longitude
 *   - longitude       (optional) — must accompany latitude
 *
 * Response 201: { id: number, checksum: string }
 * Response 409: already applied — treated as idempotent success (RN-068).
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

export interface EvidenceUploadInput {
  inspectionId: string;
  itemId: string;
  /** ISO-8601 timestamp captured on the device — mapped to capturedAtDevice in FormData (RN-074). */
  capturedAt: string;
  /** UUID used as the server-side idempotency key (RN-068). */
  operationId: string;
  responseId?: string;
  localUri: string;
  description?: string;
  mimeType?: string;
  /** Latitude (optional — must accompany longitude). */
  latitude?: number;
  /** Longitude (optional — must accompany latitude). */
  longitude?: number;
}

export interface EvidenceUploadResult {
  /** Server-confirmed status. Only 'APPLIED' allows marking the evidence SYNCED. */
  status: 'APPLIED';
  storageKey?: string;
  /** Numeric id of the evidence on the server (field "id" from the 201 response). */
  serverId?: number;
}

export class EvidenceUploadClient {
  /**
   * Uploads a single evidence file. Resolves only when the server confirms
   * APPLIED; otherwise it throws so the caller keeps the photo pending/failed.
   */
  async upload(token: string, input: EvidenceUploadInput): Promise<EvidenceUploadResult> {
    if (!input.localUri) {
      throw new Error('Evidence has no local file to upload.');
    }

    const form = new FormData();
    form.append('itemId', input.itemId);
    form.append('capturedAtDevice', input.capturedAt);
    form.append('operationId', input.operationId);
    if (input.responseId) form.append('responseId', input.responseId);
    if (input.description) form.append('description', input.description);
    if (input.mimeType) form.append('mimeType', input.mimeType);
    if (input.latitude !== undefined && input.longitude !== undefined) {
      form.append('latitude', String(input.latitude));
      form.append('longitude', String(input.longitude));
    }
    // React Native FormData file shape.
    form.append('file', {
      uri: input.localUri,
      name: input.localUri.split('/').pop() ?? 'evidence.jpg',
      type: input.mimeType ?? 'image/jpeg',
    } as unknown as Blob);

    // TODO(#229): o backend espera um Long no path param {id}, mas o mobile
    // identifica inspeções por UUID. Essa chamada usa o UUID como fallback;
    // se o backend rejeitar (404/400), será necessário persistir o id numérico
    // do servidor ao sincronizar inspeções.
    const response = await fetch(
      `${BASE_URL}/api/v1/inspections/${input.inspectionId}/evidence`,
      {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // NOTE: do not set Content-Type; the platform sets the multipart boundary.
          ...(Platform.OS === 'web' ? {} : {}),
        },
        body: form,
      },
    );

    // 409 = already applied on the server → idempotent success (RN-068).
    if (response.status === 409) {
      return { status: 'APPLIED' };
    }

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`Upload falhou (API ${response.status}): ${message}`);
    }

    // 201 → { id: number, checksum: string }
    const data = (await response.json().catch(() => ({}))) as { id?: number; checksum?: string };
    return { status: 'APPLIED', storageKey: data.checksum, serverId: data.id };
  }
}

export const evidenceUploadClient = new EvidenceUploadClient();
