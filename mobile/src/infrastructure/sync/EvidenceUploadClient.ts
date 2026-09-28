import { Platform } from 'react-native';

/**
 * Isolated client for uploading an evidence file to the server (PBI-044, RN-078).
 *
 * ⚠️ Contract status: the backend does **not** expose an evidence upload endpoint
 * yet (only `POST /api/v1/mobile/sync/push` with type `INSPECTION_STATUS` is
 * implemented — see `SyncOperationType.java`). The multipart contract below
 * (`POST /api/v1/inspections/{id}/evidence`) mirrors what `mobile-spec.md`
 * documents, but until the server ships it, uploads must stay PENDING/FAILED and
 * never be faked as "sent".
 *
 * To avoid inventing a live contract, the upload is **disabled by default** and
 * throws a descriptive error (which the outbox records as `last_error`, keeping
 * the photo pending). When the endpoint exists, flip `EXPO_PUBLIC_EVIDENCE_UPLOAD`
 * to `"enabled"` and the same code path performs the real multipart upload —
 * confirmation is then based on the actual HTTP response, not on the request
 * merely being started.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';
const UPLOAD_ENABLED = process.env.EXPO_PUBLIC_EVIDENCE_UPLOAD === 'enabled';

export interface EvidenceUploadInput {
  inspectionId: string;
  itemId: string;
  responseId?: string;
  localUri: string;
  description?: string;
  mimeType?: string;
}

export interface EvidenceUploadResult {
  /** Server-confirmed status. Only 'APPLIED' allows marking the evidence SYNCED. */
  status: 'APPLIED';
  storageKey?: string;
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

    if (!UPLOAD_ENABLED) {
      // No server contract available yet — do NOT fake success (PBI-044 rule).
      throw new Error(
        'Upload de evidência indisponível: o endpoint de upload ainda não existe no backend.',
      );
    }

    const form = new FormData();
    form.append('inspectionId', input.inspectionId);
    form.append('itemId', input.itemId);
    if (input.responseId) form.append('responseId', input.responseId);
    if (input.description) form.append('description', input.description);
    // React Native FormData file shape.
    form.append('file', {
      uri: input.localUri,
      name: input.localUri.split('/').pop() ?? 'evidence.jpg',
      type: input.mimeType ?? 'image/jpeg',
    } as unknown as Blob);

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

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`Upload falhou (API ${response.status}): ${message}`);
    }

    const data = (await response.json().catch(() => ({}))) as { storageKey?: string };
    return { status: 'APPLIED', storageKey: data.storageKey };
  }
}

export const evidenceUploadClient = new EvidenceUploadClient();
