import { File, UploadType } from 'expo-file-system';

/**
 * Uploads an evidence photo to the backend in a single multipart request
 * (issue #229 / RN-078), matching the real endpoint (EvidenceUploadController):
 *
 *   POST /api/v1/inspections/{inspectionId}/evidence   (multipart/form-data)
 *     file              the photo binary
 *     itemId            template item id (numeric, unscoped)
 *     mimeType          e.g. image/jpeg
 *     description       optional
 *     latitude/longitude optional, only both together
 *     capturedAtDevice  ISO-8601 device capture time
 *     operationId       UUID idempotency key: a resend returns the first result
 *                       and never creates a second evidence (RN-068)
 *   ← 201 { id, checksum }
 *
 * expo-file-system v57 removed the legacy uploadAsync (it throws at runtime).
 * The replacement is `new File(uri).createUploadTask(url, options)` with
 * `parameters` for the extra multipart fields.
 * See: https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/
 *
 * Resolves only on a 2xx response; any other outcome throws so the outbox keeps
 * the photo as FAILED and available for retry (PBI-044 / RN-047).
 *
 * itemId note: the mobile stores item ids as "<inspectionId>::<templateItemId>"
 * (scopedId). The server expects the numeric templateItemId only.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

export interface EvidenceUploadInput {
  /** UUID idempotency key, stable across retries of the same photo. */
  operationId: string;
  /** Server inspection id (numeric string). */
  inspectionId: string;
  /** Scoped local item id: "<inspectionId>::<templateItemId>" or plain numeric string */
  itemId: string;
  localUri: string;
  description?: string;
  mimeType?: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
}

export interface EvidenceUploadResult {
  status: 'APPLIED';
  evidenceId: number;
  checksum: string;
}

// ─── Public client class ───────────────────────────────────────────────────────

export class EvidenceUploadClient {
  /**
   * Uploads a single evidence photo (binary + metadata in one request).
   * Throws on any non-2xx outcome so the outbox marks it FAILED.
   */
  async upload(token: string, input: EvidenceUploadInput): Promise<EvidenceUploadResult> {
    if (!input.localUri) {
      throw new Error('Evidence has no local file to upload.');
    }
    if (!UUID_PATTERN.test(input.operationId)) {
      throw new Error(`operationId must be a UUID, got "${input.operationId}".`);
    }
    const inspectionId = Number(input.inspectionId);
    if (!Number.isInteger(inspectionId) || inspectionId <= 0) {
      throw new Error(`Cannot upload evidence: invalid inspection id "${input.inspectionId}".`);
    }

    const mimeType = input.mimeType ?? mimeTypeFromUri(input.localUri);
    const task = new File(input.localUri).createUploadTask(
      `${BASE_URL}/api/v1/inspections/${inspectionId}/evidence`,
      {
        uploadType: UploadType.MULTIPART,
        fieldName: 'file',
        mimeType,
        httpMethod: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        parameters: buildParameters(input, mimeType),
      },
    );

    const result = await task.uploadAsync();
    if (!result) {
      throw new Error('Evidence upload failed: no response from server (network error).');
    }
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Evidence upload failed (API ${result.status}): ${result.body}`);
    }
    return parseResponse(result.body);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildParameters(input: EvidenceUploadInput, mimeType: string): Record<string, string> {
  const parameters: Record<string, string> = {
    itemId: String(extractTemplateItemId(input.itemId)),
    mimeType,
    capturedAtDevice: input.capturedAt,
    operationId: input.operationId,
  };
  if (input.description) parameters.description = input.description;
  // The backend rejects latitude without longitude (and vice versa).
  if (input.latitude !== undefined && input.longitude !== undefined) {
    parameters.latitude = String(input.latitude);
    parameters.longitude = String(input.longitude);
  }
  return parameters;
}

function parseResponse(body: string): EvidenceUploadResult {
  let data: { id?: number; checksum?: string };
  try {
    data = JSON.parse(body) as { id?: number; checksum?: string };
  } catch {
    throw new Error('Evidence upload succeeded but server returned invalid JSON.');
  }
  if (typeof data.id !== 'number') {
    throw new Error('Evidence upload succeeded but server returned no evidence id.');
  }
  return { status: 'APPLIED', evidenceId: data.id, checksum: data.checksum ?? '' };
}

function mimeTypeFromUri(uri: string): string {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXTENSION[extension] ?? 'image/jpeg';
}

/**
 * Extracts the numeric templateItemId from a scoped local item id.
 *
 * InspectionRepository.saveTemplate stores item ids as
 * "<inspectionId>::<templateItemId>" (scopedId). The server expects the
 * original numeric templateItemId.
 *
 * Examples:
 *   "insp-1::42"  → 42
 *   "5::11"       → 11
 *   "42"          → 42  (already unscoped, defensive fallback)
 */
export function extractTemplateItemId(scopedItemId: string): number {
  const sep = scopedItemId.lastIndexOf('::');
  const raw = sep !== -1 ? scopedItemId.slice(sep + 2) : scopedItemId;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      `Cannot extract a valid templateItemId from "${scopedItemId}": got "${raw}".`,
    );
  }
  return id;
}

export const evidenceUploadClient = new EvidenceUploadClient();
