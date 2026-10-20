import type { SQLiteDatabase } from 'expo-sqlite';

import { apiClient } from '@/infrastructure/api/client';
import { randomUuidV4 } from './uuid';
import { evidenceUploadClient } from './EvidenceUploadClient';
import {
  InspectionRepository,
  AnswerRepository,
  EvidenceRepository,
  NonConformityRepository,
  ReviewCommentRepository,
  SyncQueueRepository,
  SyncMetadataRepository,
} from '@/infrastructure/database/repositories';
import type {
  Inspection,
  InspectionTemplate,
  TemplateSection,
  TemplateItem,
  ChecklistValue,
  Evidence,
  NonConformity,
  ReviewComment,
} from '@/features/fieldops/types';

// ─── API Response types ────────────────────────────────────────────────────────

interface ApiInspection {
  id: string;
  title: string;
  templateId: string;
  clientId: string;
  clientName: string;
  siteId: string;
  siteName: string;
  equipmentId: string;
  equipmentName: string;
  equipmentQrCode?: string;
  technicianId: string;
  supervisorId: string;
  supervisorName: string;
  status: string;
  priority: string;
  dueDate: string;
  dueTime?: string;
  createdAt: string;
  startedAt?: string;
  progress: number;
  supervisorInstructions?: string;
  /** Reason the supervisor rejected the inspection (PBI-061 → PBI-062). */
  rejectionReason?: string;
  /** Who rejected the inspection (supervisor name). */
  rejectedBy?: string;
  /** When the inspection was rejected (ISO date/time). */
  rejectedAt?: string;
  version: number;
  template: ApiTemplate;
  reviewComments?: ApiReviewComment[];
}

interface ApiReviewComment { id: string; itemId: string; comment: string; createdBy: string; createdAt: string }

interface ApiTemplate {
  id: string;
  title: string;
  category: string;
  version: number;
  sections: ApiSection[];
}

interface ApiSection {
  id: string;
  title: string;
  items: ApiItem[];
}

interface ApiItem {
  id: string;
  question: string;
  description?: string;
  responseType: string;
  required: boolean;
  requireObservationOnFailure: boolean;
  requireEvidenceOnFailure: boolean;
  options?: string[];
}

// ─── Batch sync (POST /mobile/sync/push) — PBI-051/052 ───────────────────────────

/** Operation types accepted by the backend sync applicators (PBI-051, #223). */
type SyncPushType = 'INSPECTION_STATUS' | 'ANSWER_UPSERT' | 'NON_CONFORMITY_CREATE';

/**
 * One-shot GPS reading sent with a start/conclusion transition (PBI-045).
 * Mirrors the backend {@code CapturedLocation}. Null/omitted when the technician
 * opted out or was denied the permission (RN-059).
 */
interface SyncLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  capturedAt?: string;
}

/** Type-specific payloads mirror the backend DTOs (AnswerUpsertPayload, etc.). */
type SyncPushPayload =
  | { inspectionId: string; status: string; location?: SyncLocation | null }
  | { inspectionId: string; itemId: string; value: string; observation?: string }
  | { inspectionId: string; itemId: string; title: string; description: string; severity: string };

/** One operation in a sync batch. */
interface SyncPushOperation {
  operationId: string;
  type: SyncPushType;
  baseVersion: number;
  dependencyIds: string[];
  payload: SyncPushPayload;
}

interface SyncPushBody {
  operations: SyncPushOperation[];
}

interface SyncPushResult {
  results: Array<{
    operationId: string;
    status: 'APPLIED' | 'ALREADY_APPLIED' | 'CONFLICT' | 'DEFERRED' | 'FAILED';
    detail?: string | null;
  }>;
}

// ─── Incremental pull (GET /mobile/sync/pull) — PBI-053 ──────────────────────────

/**
 * Server-side classification of each change (SyncPullService.classify):
 * - INSPECTION: ordinary create/update
 * - REVIEW: supervisor decision (status APPROVED/REJECTED)
 * - CANCELLATION: inspection cancelled (status CANCELED)
 */
type SyncChangeType = 'INSPECTION' | 'REVIEW' | 'CANCELLATION';

interface SyncChange {
  type: SyncChangeType;
  /** Same DTO (MobileInspectionResponse) consumed by GET /mobile/inspections. */
  inspection: ApiInspection;
}

interface SyncPullResponse {
  changes: SyncChange[];
  /**
   * Opaque Base64 URL-safe cursor for the NEXT page. `null` means "no more
   * changes to hand out" — in that case the previous cursor is kept as-is.
   */
  nextCursor: string | null;
  hasMore: boolean;
}

/** Safety net so a server/bug that keeps returning hasMore never loops forever. */
const MAX_PULL_PAGES = 1000;

// ─── Service ───────────────────────────────────────────────────────────────────

/**
 * Handles bidirectional sync between the API and local SQLite:
 * - Pull: fetches assigned inspections from API → saves to SQLite
 * - Push: sends local answers/evidences/non-conformities → API
 */
export class InspectionSyncService {
  private db: SQLiteDatabase;
  private inspectionRepo: InspectionRepository;
  private answerRepo: AnswerRepository;
  private evidenceRepo: EvidenceRepository;
  private ncRepo: NonConformityRepository;
  private reviewCommentRepo: ReviewCommentRepository;
  private syncQueueRepo: SyncQueueRepository;
  private metadataRepo: SyncMetadataRepository;

  constructor(db: SQLiteDatabase) {
    // Kept so the incremental pull can wrap a whole changes batch in a single
    // SQLite transaction (db.withTransactionAsync), PBI-053.
    this.db = db;
    this.inspectionRepo = new InspectionRepository(db);
    this.answerRepo = new AnswerRepository(db);
    this.evidenceRepo = new EvidenceRepository(db);
    this.ncRepo = new NonConformityRepository(db);
    this.reviewCommentRepo = new ReviewCommentRepository(db);
    this.syncQueueRepo = new SyncQueueRepository(db);
    this.metadataRepo = new SyncMetadataRepository(db);
  }

  // ─── Pull: API → SQLite ──────────────────────────────────────────────────

  /**
   * Fetch inspections assigned to the current technician and store locally.
   * This is the main "download" operation.
   */
  async pullInspections(token: string): Promise<{ downloaded: number; errors: string[] }> {
    const errors: string[] = [];
    let downloaded = 0;

    try {
      const apiInspections = await apiClient.get<ApiInspection[]>(
        '/api/v1/mobile/inspections',
        token,
      );
      for (const apiInsp of apiInspections) {
        try {
          await this.saveInspectionLocally(apiInsp);
          downloaded++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`[${apiInsp.id}] ${msg}`);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch inspections';
      errors.push(msg);
    }

    return { downloaded, errors };
  }

  /**
   * Fetch a single inspection by ID and update local data.
   */
  async pullInspection(token: string, inspectionId: string): Promise<void> {
    const apiInsp = await apiClient.get<ApiInspection>(
      `/api/v1/mobile/inspections/${inspectionId}`,
      token,
    );
    await this.saveInspectionLocally(apiInsp);
  }

  /**
   * Incremental pull by opaque cursor (PBI-053, GET /mobile/sync/pull).
   *
   * Reads the stored cursor and fetches the delta for the authenticated
   * technician. The FIRST sync (no local cursor) is issued WITHOUT the `cursor`
   * query param, so the server returns the full initial set. Each page's whole
   * `changes` batch is written inside a SINGLE SQLite transaction; the cursor is
   * advanced ONLY after that transaction commits. On ANY error (network, parse,
   * 422 INVALID_CURSOR, or a write/rollback) the cursor is left untouched and the
   * loop stops — a resend re-applies idempotently via upsert-by-id. Pagination
   * continues while `hasMore` is true.
   */
  async pullChanges(token: string): Promise<{ downloaded: number; errors: string[] }> {
    const errors: string[] = [];
    let downloaded = 0;

    // The first sync has no cursor → start WITHOUT the query param.
    let cursor = await this.metadataRepo.getPullCursor();

    for (let page = 0; page < MAX_PULL_PAGES; page++) {
      let response: SyncPullResponse;
      try {
        // `limit` is omitted → server default (100). `cursor` is only sent when
        // present, URL-encoded because it is an opaque Base64 URL-safe string.
        const query = cursor !== null ? `?cursor=${encodeURIComponent(cursor)}` : '';
        response = await apiClient.get<SyncPullResponse>(
          `/api/v1/mobile/sync/pull${query}`,
          token,
        );
      } catch (err) {
        // Network failure or a non-2xx (e.g. 422 INVALID_CURSOR) — do NOT advance.
        const msg = err instanceof Error ? err.message : 'Failed to pull changes';
        errors.push(msg);
        break;
      }

      const changes = response.changes ?? [];
      try {
        // Atomic per-page write: either the whole batch lands or none of it does,
        // so a mid-batch failure cannot leave a half-applied page behind.
        await this.db.withTransactionAsync(async () => {
          for (const change of changes) {
            await this.applyChange(change);
          }
        });
      } catch (err) {
        // Rollback already ran; keep the old cursor so the page is retried.
        const msg = err instanceof Error ? err.message : 'Failed to persist changes';
        errors.push(msg);
        break;
      }

      downloaded += changes.length;

      // Only AFTER a successful commit do we move the cursor forward. A null
      // nextCursor means "nothing new to hand out" → keep the previous cursor.
      if (response.nextCursor !== null) {
        cursor = response.nextCursor;
        await this.metadataRepo.setPullCursor(cursor);
      }

      if (!response.hasMore) break;
    }

    return { downloaded, errors };
  }

  /**
   * Apply one change to the local store. INSPECTION/REVIEW/CANCELLATION all go
   * through the same {@link saveInspectionLocally} upsert: the extended
   * InspectionRepository.upsert applies REJECTED/APPROVED/CANCELED coming from
   * the server while preserving the technician's pending child rows (RN-077).
   */
  private async applyChange(change: SyncChange): Promise<void> {
    await this.saveInspectionLocally(change.inspection);
  }

  private async saveInspectionLocally(apiInsp: ApiInspection): Promise<void> {
    // Save the inspection record
    await this.inspectionRepo.upsert({
      id: apiInsp.id,
      title: apiInsp.title,
      templateId: apiInsp.templateId,
      clientId: apiInsp.clientId,
      clientName: apiInsp.clientName,
      siteId: apiInsp.siteId,
      siteName: apiInsp.siteName,
      equipmentId: apiInsp.equipmentId,
      equipmentName: apiInsp.equipmentName,
      equipmentQrCode: apiInsp.equipmentQrCode,
      technicianId: apiInsp.technicianId,
      supervisorId: apiInsp.supervisorId,
      supervisorName: apiInsp.supervisorName,
      status: apiInsp.status as Inspection['status'],
      priority: apiInsp.priority as Inspection['priority'],
      dueDate: apiInsp.dueDate,
      dueTime: apiInsp.dueTime ?? '',
      createdAt: apiInsp.createdAt,
      startedAt: apiInsp.startedAt,
      progress: apiInsp.progress,
      supervisorInstructions: apiInsp.supervisorInstructions ?? '',
      // PBI-062: bring the rejection state/reason down from the server so the
      // technician sees why the inspection was rejected and can correct it.
      rejectionReason: apiInsp.rejectionReason,
      rejectedBy: apiInsp.rejectedBy,
      rejectedAt: apiInsp.rejectedAt,
      serverVersion: apiInsp.version,
      syncStatus: 'synced',
      pendingSyncCount: 0,
      overdue: false,
    });

    // Save the template snapshot (sections + items) only if we don't already have
    // one locally. The snapshot is immutable once assigned (RN-021), and rewriting
    // it deletes the items — which cascade-deletes the technician's evidences
    // (RN-047). Skipping the rewrite preserves captured photos across re-pulls and
    // app restarts.
    if (apiInsp.template && !(await this.inspectionRepo.hasSnapshot(apiInsp.id))) {
      const template = this.mapApiTemplate(apiInsp.template);
      await this.inspectionRepo.saveTemplate(apiInsp.id, template);
    }
    await this.reviewCommentRepo.replaceForInspection(apiInsp.id, (apiInsp.reviewComments ?? []).map((comment): ReviewComment => ({ ...comment, inspectionId: apiInsp.id, itemId: `${apiInsp.id}::${comment.itemId}` })));
  }

  private mapApiTemplate(api: ApiTemplate): InspectionTemplate {
    return {
      id: api.id,
      title: api.title,
      category: api.category,
      version: api.version,
      sections: api.sections.map(this.mapApiSection),
    };
  }

  private mapApiSection = (api: ApiSection): TemplateSection => ({
    id: api.id,
    title: api.title,
    items: api.items.map(this.mapApiItem),
  });

  private mapApiItem = (api: ApiItem): TemplateItem => ({
    id: api.id,
    question: api.question,
    description: api.description,
    responseType: api.responseType as TemplateItem['responseType'],
    required: api.required,
    requireObservationOnFailure: api.requireObservationOnFailure,
    requireEvidenceOnFailure: api.requireEvidenceOnFailure,
    options: api.options,
  });

  // ─── Push: SQLite → API ──────────────────────────────────────────────────

  /**
   * Process the outbox: send all pending operations to the API.
   * Returns the number of operations successfully sent and any errors.
   */
  async pushPendingOperations(token: string): Promise<{ sent: number; failed: number; errors: string[] }> {
    // Only operations whose dependencies are already applied are eligible: a
    // photo UPLOAD stays deferred while its answer op is still pending/failed
    // (RN-069). This is enforced by the sync worker, not just the UI.
    const pending = await this.syncQueueRepo.getReady();
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const operation of pending) {
      try {
        await this.syncQueueRepo.markInProgress(operation.id);
        await this.sendOperation(token, operation);
        await this.syncQueueRepo.markSent(operation.id);
        // For an evidence UPLOAD, success means the server confirmed APPLIED, so
        // the evidence row is marked SYNCED (its file may now be released).
        if (operation.entityType === 'evidence') {
          await this.evidenceRepo.markSyncedById(operation.entityId);
        }
        sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (err instanceof VersionConflictError) {
          await this.syncQueueRepo.markConflict(operation.id, msg);
          errors.push(`[${operation.entityType}:${operation.entityId}] ${msg}`);
          continue;
        }
        // Failure never deletes the file or the evidence: we only flag it FAILED
        // and persist the error so the photo stays available for retry (RN-047).
        await this.syncQueueRepo.markError(operation.id, msg);
        if (operation.entityType === 'evidence') {
          await this.evidenceRepo.markFailed(operation.entityId, msg);
        }
        failed++;
        errors.push(`[${operation.entityType}:${operation.entityId}] ${msg}`);
      }
    }

    // Cleanup successfully sent operations
    if (sent > 0) {
      await this.syncQueueRepo.removeSent();
    }

    return { sent, failed, errors };
  }

  private async sendOperation(
    token: string,
    operation: { id: string; operationType: string; entityType: string; entityId: string; payload: string; dependencyIds: string[] },
  ): Promise<void> {
    const payload = JSON.parse(operation.payload);

    switch (operation.entityType) {
      case 'inspection':
        if (operation.operationType === 'UPDATE' || operation.operationType === 'TRANSITION') {
          await this.pushInspectionStatus(token, operation.entityId, payload);
        }
        break;
      case 'evidence':
        // Photo upload — separate from the structured data (RN-078). Only marks
        // the evidence SYNCED when the server confirms APPLIED (see caller). If
        // the upload endpoint is unavailable it throws, keeping the photo FAILED.
        await this.uploadEvidence(token, operation.entityId, payload);
        break;
      // Checklist answer → ANSWER_UPSERT (PBI-051, backend #223). Marks the local
      // answer row SYNCED only after the server confirms APPLIED/ALREADY_APPLIED.
      case 'answer':
        await this.pushAnswer(token, payload);
        await this.answerRepo.markSynced([operation.entityId]);
        break;
      // Non-conformity → NON_CONFORMITY_CREATE (PBI-051, backend #223). Same rule:
      // the local NC row is flipped SYNCED only on a confirmed result.
      case 'non_conformity':
        await this.pushNonConformity(token, payload);
        await this.ncRepo.markSynced([operation.entityId]);
        break;
      default:
        throw new Error(`Unknown entity type: ${operation.entityType}`);
    }
  }

  /**
   * Upload a single evidence photo through the isolated {@link evidenceUploadClient}.
   * Resolves only if the server confirms APPLIED; any failure propagates so the
   * outbox marks it FAILED and the file is preserved (PBI-044).
   */
  private async uploadEvidence(
    token: string,
    evidenceId: string,
    payload: {
      inspectionId: string;
      itemId: string;
      responseId?: string;
      uri?: string;
      description?: string;
    },
  ): Promise<void> {
    // Prefer the freshest URI from the DB (retry reuses the persisted file).
    const evidence = await this.evidenceRepo.getById(evidenceId);
    const localUri = evidence?.uri ?? payload.uri;
    if (!localUri) {
      throw new Error('Evidence has no local file to upload.');
    }

    await evidenceUploadClient.upload(token, {
      inspectionId: payload.inspectionId,
      itemId: payload.itemId,
      responseId: payload.responseId,
      localUri,
      description: payload.description,
    });
  }

  /**
   * Push a single inspection status transition through the batch endpoint
   * (POST /api/v1/mobile/sync/push, PBI-051/052). The server is idempotent on
   * {@code operationId}, so re-sending the same queued row never applies twice.
   * A FAILED result (e.g. illegal transition) is surfaced as an error so the
   * outbox can flag it instead of silently dropping the operation.
   */
  private async pushInspectionStatus(
    token: string,
    inspectionId: string,
    payload: { operationId?: string; status: string; baseVersion?: number; location?: SyncLocation | null },
  ): Promise<void> {
    // Tolerate a missing baseVersion instead of throwing. Legacy outbox rows
    // enqueued before PBI-055 (server version tracking) have no baseVersion;
    // rejecting them would wedge the operation as a permanent error that never
    // drains. Default to 0 — the same `?? 0` fallback the enqueue path uses —
    // which matches a never-bumped inspection (version 0). Any real divergence
    // still comes back as CONFLICT below and is preserved, never lost.
    const operationId = payload.operationId ?? randomUuidV4();
    const body: SyncPushBody = {
      operations: [
        {
          operationId,
          type: 'INSPECTION_STATUS',
          baseVersion: payload.baseVersion ?? 0,
          dependencyIds: [],
          // Carry the one-shot GPS location so the server persists it with the
          // transition (PBI-045). `?? null` keeps the field present and explicit
          // when the technician skipped or was denied the capture (RN-059).
          payload: { inspectionId, status: payload.status, location: payload.location ?? null },
        },
      ],
    };

    const response = await apiClient.post<SyncPushResult>(
      '/api/v1/mobile/sync/push',
      body,
      token,
    );

    const result = response.results?.[0];
    if (result && result.status === 'CONFLICT') {
      throw new VersionConflictError(result.detail ?? `Inspection changed on the server for ${inspectionId}`);
    }
    if (result && result.status === 'FAILED') {
      throw new Error(result.detail ?? `Inspection status transition failed for ${inspectionId}`);
    }
  }

  /**
   * Push a single checklist answer through the batch endpoint as ANSWER_UPSERT
   * (PBI-051, backend applicator #223). The server is idempotent on
   * {@code operationId}, so a resend of the same queued row returns
   * ALREADY_APPLIED instead of duplicating the answer (RN-068). The stable
   * {@code operationId}/{@code baseVersion} come from the enqueued payload.
   */
  private async pushAnswer(
    token: string,
    payload: { operationId?: string; inspectionId: string; itemId: string; value: ChecklistValue; observation?: string; baseVersion?: number },
  ): Promise<void> {
    await this.pushContentOperation(token, {
      operationId: payload.operationId,
      baseVersion: payload.baseVersion,
      type: 'ANSWER_UPSERT',
      payload: {
        inspectionId: payload.inspectionId,
        itemId: payload.itemId,
        value: serializeAnswerValue(payload.value),
        observation: payload.observation,
      },
      failureMessage: `Answer upsert failed for item ${payload.itemId}`,
    });
  }

  /**
   * Push a single non-conformity through the batch endpoint as
   * NON_CONFORMITY_CREATE (PBI-051, backend applicator #223). Idempotent on
   * {@code operationId} so a resend never creates a duplicate NC (RN-068).
   */
  private async pushNonConformity(
    token: string,
    payload: { operationId?: string; inspectionId: string; itemId: string; title: string; description: string; severity: string; baseVersion?: number },
  ): Promise<void> {
    await this.pushContentOperation(token, {
      operationId: payload.operationId,
      baseVersion: payload.baseVersion,
      type: 'NON_CONFORMITY_CREATE',
      payload: {
        inspectionId: payload.inspectionId,
        itemId: payload.itemId,
        title: payload.title,
        description: payload.description,
        severity: payload.severity,
      },
      failureMessage: `Non-conformity create failed for item ${payload.itemId}`,
    });
  }

  /**
   * Shared sender for content operations (answers, non-conformities) through
   * {@code POST /api/v1/mobile/sync/push}. A single operation per call keeps the
   * dependency ordering simple: the server already applied earlier operations in
   * previous calls and recognises resends by {@code operationId}. CONFLICT is
   * surfaced as a {@link VersionConflictError}; FAILED as a plain error so the
   * outbox flags it instead of silently dropping the operation.
   */
  private async pushContentOperation(
    token: string,
    input: {
      operationId?: string;
      baseVersion?: number;
      type: SyncPushType;
      payload: SyncPushPayload;
      failureMessage: string;
    },
  ): Promise<void> {
    const body: SyncPushBody = {
      operations: [
        {
          operationId: input.operationId ?? randomUuidV4(),
          type: input.type,
          baseVersion: input.baseVersion ?? 0,
          dependencyIds: [],
          payload: input.payload,
        },
      ],
    };

    const response = await apiClient.post<SyncPushResult>(
      '/api/v1/mobile/sync/push',
      body,
      token,
    );

    const result = response.results?.[0];
    if (result && result.status === 'CONFLICT') {
      throw new VersionConflictError(result.detail ?? input.failureMessage);
    }
    if (result && result.status === 'FAILED') {
      throw new Error(result.detail ?? input.failureMessage);
    }
    // APPLIED / ALREADY_APPLIED → success. DEFERRED is not expected for a
    // single-operation batch with no dependencyIds; treat it like success-wait
    // by leaving the row for the next cycle (no throw, no mark).
  }

  // ─── Full sync (pull + push) ─────────────────────────────────────────────

  /**
   * Perform a full sync cycle: push pending operations, then pull latest data.
   */
  async fullSync(token: string): Promise<{
    pulled: number;
    pushed: number;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Push first (so the server has our latest data)
    const pushResult = await this.pushPendingOperations(token);
    errors.push(...pushResult.errors);

    // Then pull server-side updates incrementally by cursor (PBI-053). With no
    // local cursor this does the initial full pull; with one it only fetches the
    // delta (new inspections, reviews, cancellations). `pullInspections` is kept
    // as a recovery fallback: if the incremental pull failed AND we have never
    // stored a cursor (so there is nothing local to lose), fall back to the plain
    // full pull so a first-run sync still populates the device.
    const pullResult = await this.pullChanges(token);
    errors.push(...pullResult.errors);
    let pulled = pullResult.downloaded;

    if (pullResult.errors.length > 0 && (await this.metadataRepo.getPullCursor()) === null) {
      const fallback = await this.pullInspections(token);
      errors.push(...fallback.errors);
      pulled += fallback.downloaded;
    }

    // Record the timestamp of the last *successful* sync only when the whole
    // cycle finished with no errors (RN-072). A failed attempt must NOT advance
    // this timestamp, so the sync screen keeps showing the last real success.
    if (errors.length === 0) {
      await this.metadataRepo.setLastSuccessfulSync();
    }

    return {
      pulled,
      pushed: pushResult.sent,
      errors,
    };
  }

  /**
   * ISO timestamp of the last successful sync, or `null` when it never
   * completed successfully. Persisted across app restarts (RN-066).
   */
  async getLastSuccessfulSync(): Promise<string | null> {
    return this.metadataRepo.getLastSuccessfulSync();
  }

  // ─── Helper: enqueue operations ──────────────────────────────────────────

  /**
   * Deterministic outbox id for an answer operation. Stable per (inspection,item)
   * so an evidence upload can depend on it (RN-069) and a resend stays idempotent.
   */
  static answerOperationId(inspectionId: string, itemId: string): string {
    return `answer-${inspectionId}-${itemId}`;
  }

  /** Deterministic outbox id for an evidence upload operation. */
  static evidenceOperationId(evidenceId: string): string {
    return `evidence-${evidenceId}`;
  }

  /**
   * Enqueue an answer to be synced later. Uses a stable operation id per
   * (inspection,item) so evidences captured for the same item can declare it as
   * a dependency (RN-069) and reruns never duplicate the operation (RN-068).
   */
  async enqueueAnswer(
    inspectionId: string,
    itemId: string,
    value: ChecklistValue,
    observation?: string,
  ): Promise<void> {
    const id = InspectionSyncService.answerOperationId(inspectionId, itemId);
    // operationId is the server-side idempotency key (RN-068): a stable UUID kept
    // in the payload so a resend of this same outbox row returns ALREADY_APPLIED
    // instead of duplicating. baseVersion carries the last known server version
    // so the batch endpoint can detect a version conflict (PBI-055).
    const inspection = await this.inspectionRepo.getById(inspectionId);
    await this.syncQueueRepo.enqueue(id, 'CREATE', 'answer', `${inspectionId}-${itemId}`, {
      operationId: randomUuidV4(),
      inspectionId,
      // Send the original (unscoped) item id the backend expects as a Long.
      itemId: unscopeItemId(itemId),
      value,
      observation,
      baseVersion: inspection?.serverVersion ?? 0,
    });
  }

  /**
   * Enqueue an evidence photo UPLOAD. The operation depends on the answer op of
   * the same item, so the upload stays deferred until the answer is applied by
   * the server (RN-069). The photo is uploaded separately from the structured
   * data (RN-078), so a synced answer with a failed photo is a valid state.
   */
  async enqueueEvidence(evidence: Evidence): Promise<void> {
    const id = InspectionSyncService.evidenceOperationId(evidence.id);
    const dependencyIds = evidence.responseId ? [evidence.responseId] : [];
    await this.syncQueueRepo.enqueue(
      id,
      'UPLOAD',
      'evidence',
      evidence.id,
      {
        inspectionId: evidence.inspectionId,
        // Send the original (unscoped) item id the backend expects as a Long.
        // responseId stays scoped: it is an internal outbox dependency key, not
        // sent to the server, and must keep matching the answer operation id.
        itemId: unscopeItemId(evidence.itemId),
        responseId: evidence.responseId,
        uri: evidence.uri,
        description: evidence.description,
        capturedAt: evidence.capturedAt,
      },
      dependencyIds,
    );
  }

  /**
   * Re-enqueue a previously failed evidence upload ("Tentar novamente"). Reuses
   * the existing outbox row and file — no new capture, no duplicate evidence
   * (PBI-044). The answer dependency is still respected: if the answer is not yet
   * applied, the retried upload simply waits again.
   */
  async retryEvidenceUpload(evidence: Evidence): Promise<void> {
    const opId = evidence.operationId ?? InspectionSyncService.evidenceOperationId(evidence.id);
    // Move both the evidence row and its outbox op back to pending.
    await this.evidenceRepo.markPending(evidence.id);
    await this.syncQueueRepo.markPending(opId);
  }

  /**
   * Enqueue a non-conformity to be synced later.
   */
  async enqueueNonConformity(nc: NonConformity): Promise<void> {
    const id = `nc-${nc.id}`;
    // Stable UUID operationId for idempotent resend (RN-068) and baseVersion for
    // conflict detection (PBI-055), mirroring enqueueAnswer.
    const inspection = await this.inspectionRepo.getById(nc.inspectionId);
    await this.syncQueueRepo.enqueue(id, 'CREATE', 'non_conformity', nc.id, {
      operationId: randomUuidV4(),
      inspectionId: nc.inspectionId,
      // Send the original (unscoped) item id the backend expects as a Long.
      itemId: unscopeItemId(nc.itemId),
      title: nc.title,
      description: nc.description,
      severity: nc.severity,
      baseVersion: inspection?.serverVersion ?? 0,
    });
  }

  /**
   * Enqueue a status change to be synced later.
   */
  async enqueueStatusChange(inspectionId: string, status: string): Promise<void> {
    const inspection = await this.requireInspection(inspectionId);
    const id = `status-${inspectionId}-${Date.now()}`;
    await this.syncQueueRepo.enqueue(id, 'UPDATE', 'inspection', inspectionId, {
      status,
      baseVersion: inspection.serverVersion ?? 0,
    });
  }

  /**
   * Enqueue an inspection TRANSITION (e.g. start → IN_PROGRESS) into the outbox,
   * carrying the device timestamp and the optional start location (PBI-034). The
   * location now travels in the batch payload and is persisted server-side
   * (PBI-045); it is null when the technician opted out or was denied (RN-059).
   */
  async enqueueTransition(
    inspectionId: string,
    input: {
      status: string;
      startedAtDevice: string;
      location: SyncLocation | null;
    },
  ): Promise<void> {
    const inspection = await this.requireInspection(inspectionId);
    const id = `transition-${inspectionId}-${Date.now()}`;
    // operationId is the server-side idempotency key (PBI-052): a stable UUID kept
    // in the payload so a resend of this same outbox row never applies twice.
    await this.syncQueueRepo.enqueue(id, 'TRANSITION', 'inspection', inspectionId, {
      operationId: randomUuidV4(),
      status: input.status,
      baseVersion: inspection.serverVersion ?? 0,
      startedAtDevice: input.startedAtDevice,
      location: input.location,
    });
  }

  /**
   * Enqueue an inspection CONCLUSION transition (IN_PROGRESS → SUBMITTED) into
   * the outbox, carrying the device timestamp and the optional conclusion
   * location (PBI-040 / PBI-045). Location is null when the technician was
   * denied or opted out of the capture (RN-059).
   */
  async enqueueConclusion(
    inspectionId: string,
    input: {
      endedAtDevice: string;
      location: SyncLocation | null;
    },
  ): Promise<void> {
    const inspection = await this.requireInspection(inspectionId);
    const id = `conclusion-${inspectionId}-${Date.now()}`;
    await this.syncQueueRepo.enqueue(id, 'TRANSITION', 'inspection', inspectionId, {
      operationId: randomUuidV4(),
      status: 'SUBMITTED',
      baseVersion: inspection.serverVersion ?? 0,
      endedAtDevice: input.endedAtDevice,
      location: input.location,
    });
  }

  private async requireInspection(inspectionId: string): Promise<Inspection> {
    const inspection = await this.inspectionRepo.getById(inspectionId);
    if (!inspection) throw new Error(`Inspection not found locally: ${inspectionId}`);
    return inspection;
  }
}

/** A terminal sync outcome: preserve the local operation for technician review. */
class VersionConflictError extends Error {}

/**
 * The backend {@code AnswerUpsertPayload.value} is a String, while a local
 * {@link ChecklistValue} may be a boolean or number (BOOLEAN/NUMBER items).
 * Serialize everything to the string the server stores — booleans/numbers via
 * {@code String()}, text/enum values unchanged.
 */
function serializeAnswerValue(value: ChecklistValue): string {
  return typeof value === 'string' ? value : String(value);
}

/**
 * Local checklist item ids are stored scoped to their inspection
 * (`InspectionRepository.scopedId` → `"${inspectionId}::${itemId}"`) because an
 * item id is only unique inside a template, not across the global SQLite table.
 * The backend sync payloads (AnswerUpsertPayload/NonConformityCreatePayload)
 * expect the ORIGINAL item id (a Long), so strip the local scope prefix before
 * sending. Ids without the `::` scope (legacy/unexpected) pass through unchanged.
 */
function unscopeItemId(scopedItemId: string): string {
  const separator = scopedItemId.indexOf('::');
  return separator === -1 ? scopedItemId : scopedItemId.slice(separator + 2);
}
