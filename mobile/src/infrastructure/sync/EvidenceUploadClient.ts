import { File, UploadType } from 'expo-file-system';

import { tokenStorage } from '@/infrastructure/storage/tokenStorage';

/**
 * Isolated client for uploading an evidence file to the server (PBI-044, RN-078).
 *
 * The server endpoint persists the binary and metadata idempotently. The outbox
 * supplies a stable UUID so retries remain safe after connectivity failures.
 *
 * Why `File.upload` instead of `fetch` + `FormData` (Expo SDK 57 / RN 0.86 new
 * architecture): the new-architecture `FormData` rejects the React Native file
 * part shape (`{ uri, name, type }`) at runtime with
 * "Unsupported FormDataPart implementation". `expo-file-system`'s native
 * multipart upload reads the file directly from disk and builds the
 * multipart/form-data body on the native side, so the binary part is valid.
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

    const url = `${BASE_URL}/api/v1/inspections/${input.inspectionId}/evidence`;

    // Non-file multipart parts (the backend EvidenceUploadRequest fields). The
    // binary `file` part is added by expo-file-system from the File reference.
    const parameters: Record<string, string> = {
      itemId: input.itemId,
      capturedAtDevice: input.capturedAtDevice,
      operationId: input.operationId,
    };
    if (input.description) parameters.description = input.description;
    if (input.mimeType) parameters.mimeType = input.mimeType;

    const file = new File(input.localUri);
    const result = await file.upload(url, {
      uploadType: UploadType.MULTIPART,
      // Must match @RequestPart("file") on EvidenceUploadController.
      fieldName: 'file',
      mimeType: input.mimeType ?? 'image/jpeg',
      parameters,
      headers: freshToken ? { Authorization: `Bearer ${freshToken}` } : {},
    });

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Upload falhou (API ${result.status}): ${result.body}`);
    }

    const data = parseResponse(result.body);
    return { status: 'APPLIED', storageKey: data.checksum ?? String(data.id ?? '') };
  }
}

/** Parse the EvidenceUploadResponse JSON body, tolerating an empty/invalid body. */
function parseResponse(body: string): { id?: number; checksum?: string } {
  try {
    return JSON.parse(body) as { id?: number; checksum?: string };
  } catch {
    return {};
  }
}

export const evidenceUploadClient = new EvidenceUploadClient();
