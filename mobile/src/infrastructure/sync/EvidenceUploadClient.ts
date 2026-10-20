import * as FileSystem from 'expo-file-system';

/**
 * Uploads an evidence photo to the backend using the two-step protocol (issue #229 / RN-078):
 *
 *  Step 1 — Binary upload via FileSystem.uploadAsync (multipart/form-data):
 *    POST /api/v1/mobile/evidence/upload
 *    ← { fileRef: "abc123.jpg" }
 *
 *  Step 2 — Metadata sync via POST /api/v1/mobile/sync/push (EVIDENCE_CREATE):
 *    ← { results: [{ status: "APPLIED" | "ALREADY_APPLIED" | ... }] }
 *
 * FileSystem.uploadAsync is the correct way to send multipart files in Expo/Hermes.
 * Using fetch() + FormData with { uri, name, type } causes "Unsupported FormDataPart
 * implementation" on the New Architecture / Hermes engine.
 *
 * Resolves only when the server confirms APPLIED or ALREADY_APPLIED; any other
 * outcome throws so the outbox keeps the photo as FAILED and available for retry
 * (PBI-044 / RN-047).
 *
 * itemId note: the mobile stores item ids as "<inspectionId>::<templateItemId>"
 * (scopedId). The server expects the numeric templateItemId only.
 * extractTemplateItemId() strips the scope prefix before sending.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

export interface EvidenceUploadInput {
  operationId: string;
  inspectionId: string;
  /** Scoped local item id: "<inspectionId>::<templateItemId>" or plain numeric string */
  itemId: string;
  responseId?: string;
  localUri: string;
  description?: string;
  mimeType?: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
}

export interface EvidenceUploadResult {
  status: 'APPLIED' | 'ALREADY_APPLIED';
  fileRef: string;
}

// ─── Public client class ───────────────────────────────────────────────────────

export class EvidenceUploadClient {
  /**
   * Uploads a single evidence photo end-to-end (binary + metadata).
   * Throws on any non-terminal server outcome so the outbox marks it FAILED.
   */
  async upload(token: string, input: EvidenceUploadInput): Promise<EvidenceUploadResult> {
    if (!input.localUri) {
      throw new Error('Evidence has no local file to upload.');
    }

    // Step 1 — upload the binary via FileSystem.uploadAsync and get the fileRef.
    const fileRef = await this.uploadBinary(token, input);

    // Step 2 — push the EVIDENCE_CREATE metadata through the sync batch endpoint.
    const status = await this.pushMetadata(token, input, fileRef);

    return { status, fileRef };
  }

  // ─── Step 1: multipart binary upload via FileSystem.uploadAsync ──────────

  private async uploadBinary(token: string, input: EvidenceUploadInput): Promise<string> {
    const uploadUrl = `${BASE_URL}/api/v1/mobile/evidence/upload`;

    // FileSystem.uploadAsync is the Expo-recommended way to send multipart files.
    // It handles the multipart boundary correctly on both Android and iOS with
    // Hermes/New Architecture, avoiding "Unsupported FormDataPart implementation".
    const result = await FileSystem.uploadAsync(uploadUrl, input.localUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: input.mimeType ?? 'image/jpeg',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (result.status === 0) {
      throw new Error('Binary upload failed: no response from server (network error).');
    }
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Binary upload failed (API ${result.status}): ${result.body}`);
    }

    let data: { fileRef?: string } = {};
    try {
      data = JSON.parse(result.body) as { fileRef?: string };
    } catch {
      throw new Error('Binary upload succeeded but server returned invalid JSON.');
    }

    if (!data.fileRef) {
      throw new Error('Binary upload succeeded but server returned no fileRef.');
    }

    return data.fileRef;
  }

  // ─── Step 2: EVIDENCE_CREATE via sync/push ────────────────────────────────

  private async pushMetadata(
    token: string,
    input: EvidenceUploadInput,
    fileRef: string,
  ): Promise<'APPLIED' | 'ALREADY_APPLIED'> {
    // The server expects the numeric templateItemId, not the scoped local id.
    const templateItemId = extractTemplateItemId(input.itemId);

    const body = {
      operations: [
        {
          operationId: input.operationId,
          type: 'EVIDENCE_CREATE' as const,
          baseVersion: 0,
          dependencyIds: input.responseId ? [input.responseId] : [],
          payload: {
            inspectionId: Number(input.inspectionId),
            itemId: templateItemId,
            fileRef,
            capturedAt: input.capturedAt,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
            description: input.description ?? null,
          },
        },
      ],
    };

    const response = await fetch(`${BASE_URL}/api/v1/mobile/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(`Metadata sync failed (API ${response.status}): ${message}`);
    }

    const data = (await response.json()) as {
      results?: Array<{
        operationId: string;
        status: 'APPLIED' | 'ALREADY_APPLIED' | 'CONFLICT' | 'DEFERRED' | 'FAILED';
        detail?: string | null;
      }>;
    };
    const result = data.results?.[0];

    if (!result) {
      throw new Error('Server returned no result for EVIDENCE_CREATE operation.');
    }
    if (result.status === 'APPLIED' || result.status === 'ALREADY_APPLIED') {
      return result.status;
    }
    throw new Error(
      `EVIDENCE_CREATE ${result.status}: ${result.detail ?? 'no detail'}`,
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
