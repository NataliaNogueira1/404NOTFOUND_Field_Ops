import { Platform } from 'react-native';
import { tokenStorage } from '@/infrastructure/storage/tokenStorage';

/**
 * Isolated client for uploading an evidence file to the server (PBI-044, RN-078).
 *
 * The server endpoint persists the binary and metadata idempotently. The outbox
 * supplies a stable UUID so retries remain safe after connectivity failures.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';
export interface EvidenceUploadInput {
  inspectionId: string;
  itemId: string;
  localUri: string;
  description?: string;
  mimeType?: string;
  capturedAtDevice: string;
  operationId: string;
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

    // Prefer the freshest token from storage: the apiClient interceptor may have
    // renewed the access token (via /auth/refresh) during the same sync cycle
    // after a 401 on the batch push. The token parameter captured when the sync
    // started could be stale by the time the evidence upload runs.
    const freshToken = (await tokenStorage.getAccessToken()) ?? token;

    const form = new FormData();
    form.append('itemId', input.itemId);
    if (input.description) form.append('description', input.description);
    if (input.mimeType) form.append('mimeType', input.mimeType);
    form.append('capturedAtDevice', input.capturedAtDevice);
    form.append('operationId', input.operationId);
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
          ...(freshToken ? { Authorization: `Bearer ${freshToken}` } : {}),
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

    const data = (await response.json().catch(() => ({}))) as { id?: number; checksum?: string };
    return { status: 'APPLIED', storageKey: data.checksum ?? String(data.id ?? '') };
  }
}

export const evidenceUploadClient = new EvidenceUploadClient();
