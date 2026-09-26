import type { SQLiteDatabase } from 'expo-sqlite';

import { apiClient } from '@/infrastructure/api/client';
import { randomUuidV4 } from './uuid';
import {
  InspectionRepository,
  AnswerRepository,
  EvidenceRepository,
  NonConformityRepository,
  SyncQueueRepository,
} from '@/infrastructure/database/repositories';
import type {
  Inspection,
  InspectionTemplate,
  TemplateSection,
  TemplateItem,
  ChecklistValue,
  Evidence,
  NonConformity,
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
  template: ApiTemplate;
}

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

/** One operation in a sync batch. Only INSPECTION_STATUS is supported server-side today. */
interface SyncPushOperation {
  operationId: string;
  type: 'INSPECTION_STATUS';
  dependencyIds: string[];
  payload: { inspectionId: string; status: string };
}

interface SyncPushBody {
  operations: SyncPushOperation[];
}

interface SyncPushResult {
  results: Array<{
    operationId: string;
    status: 'APPLIED' | 'ALREADY_APPLIED' | 'DEFERRED' | 'FAILED';
    detail?: string | null;
  }>;
}

// ─── Service ───────────────────────────────────────────────────────────────────

/**
 * Handles bidirectional sync between the API and local SQLite:
 * - Pull: fetches assigned inspections from API → saves to SQLite
 * - Push: sends local answers/evidences/non-conformities → API
 */
export class InspectionSyncService {
  private inspectionRepo: InspectionRepository;
  private answerRepo: AnswerRepository;
  private evidenceRepo: EvidenceRepository;
  private ncRepo: NonConformityRepository;
  private syncQueueRepo: SyncQueueRepository;

  constructor(db: SQLiteDatabase) {
    this.inspectionRepo = new InspectionRepository(db);
    this.answerRepo = new AnswerRepository(db);
    this.evidenceRepo = new EvidenceRepository(db);
    this.ncRepo = new NonConformityRepository(db);
    this.syncQueueRepo = new SyncQueueRepository(db);
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
      syncStatus: 'synced',
      pendingSyncCount: 0,
      overdue: false,
    });

    // Save template snapshot (sections + items) if available
    if (apiInsp.template) {
      const template = this.mapApiTemplate(apiInsp.template);
      await this.inspectionRepo.saveTemplate(apiInsp.id, template);
    }
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
    const pending = await this.syncQueueRepo.getPending();
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const operation of pending) {
      try {
        await this.syncQueueRepo.markInProgress(operation.id);
        await this.sendOperation(token, operation);
        await this.syncQueueRepo.markSent(operation.id);
        sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        await this.syncQueueRepo.markError(operation.id, msg);
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
    operation: { operationType: string; entityType: string; entityId: string; payload: string },
  ): Promise<void> {
    const payload = JSON.parse(operation.payload);

    switch (operation.entityType) {
      case 'inspection':
        if (operation.operationType === 'UPDATE' || operation.operationType === 'TRANSITION') {
          await this.pushInspectionStatus(token, operation.entityId, payload);
        }
        break;
      // answer/evidence/non_conformity have no server endpoint yet: only
      // INSPECTION_STATUS is implemented in POST /mobile/sync/push (PBI-051/052).
      // They stay queued (marked error → retried) until their endpoints exist.
      case 'answer':
      case 'evidence':
      case 'non_conformity':
        throw new Error(
          `Sync for '${operation.entityType}' is not supported by the API yet; keeping it queued.`,
        );
      default:
        throw new Error(`Unknown entity type: ${operation.entityType}`);
    }
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
    payload: { operationId?: string; status: string },
  ): Promise<void> {
    const operationId = payload.operationId ?? randomUuidV4();
    const body: SyncPushBody = {
      operations: [
        {
          operationId,
          type: 'INSPECTION_STATUS',
          dependencyIds: [],
          payload: { inspectionId, status: payload.status },
        },
      ],
    };

    const response = await apiClient.post<SyncPushResult>(
      '/api/v1/mobile/sync/push',
      body,
      token,
    );

    const result = response.results?.[0];
    if (result && result.status === 'FAILED') {
      throw new Error(result.detail ?? `Inspection status transition failed for ${inspectionId}`);
    }
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

    // Then pull (to get server-side updates)
    const pullResult = await this.pullInspections(token);
    errors.push(...pullResult.errors);

    return {
      pulled: pullResult.downloaded,
      pushed: pushResult.sent,
      errors,
    };
  }

  // ─── Helper: enqueue operations ──────────────────────────────────────────

  /**
   * Enqueue an answer to be synced later.
   */
  async enqueueAnswer(
    inspectionId: string,
    itemId: string,
    value: ChecklistValue,
    observation?: string,
  ): Promise<void> {
    const id = `answer-${inspectionId}-${itemId}-${Date.now()}`;
    await this.syncQueueRepo.enqueue(id, 'CREATE', 'answer', `${inspectionId}-${itemId}`, {
      inspectionId,
      itemId,
      value,
      observation,
    });
  }

  /**
   * Enqueue an evidence to be synced later.
   */
  async enqueueEvidence(evidence: Evidence): Promise<void> {
    const id = `evidence-${evidence.id}`;
    await this.syncQueueRepo.enqueue(id, 'CREATE', 'evidence', evidence.id, {
      inspectionId: evidence.inspectionId,
      itemId: evidence.itemId,
      description: evidence.description,
      uri: evidence.uri,
      capturedAt: evidence.capturedAt,
    });
  }

  /**
   * Enqueue a non-conformity to be synced later.
   */
  async enqueueNonConformity(nc: NonConformity): Promise<void> {
    const id = `nc-${nc.id}`;
    await this.syncQueueRepo.enqueue(id, 'CREATE', 'non_conformity', nc.id, {
      inspectionId: nc.inspectionId,
      itemId: nc.itemId,
      title: nc.title,
      description: nc.description,
      severity: nc.severity,
    });
  }

  /**
   * Enqueue a status change to be synced later.
   */
  async enqueueStatusChange(inspectionId: string, status: string): Promise<void> {
    const id = `status-${inspectionId}-${Date.now()}`;
    await this.syncQueueRepo.enqueue(id, 'UPDATE', 'inspection', inspectionId, {
      status,
    });
  }

  /**
   * Enqueue an inspection TRANSITION (e.g. start → IN_PROGRESS) into the outbox,
   * carrying the device timestamp and the optional start location (PBI-034).
   */
  async enqueueTransition(
    inspectionId: string,
    input: {
      status: string;
      startedAtDevice: string;
      location: { latitude: number; longitude: number; accuracy?: number } | null;
    },
  ): Promise<void> {
    const id = `transition-${inspectionId}-${Date.now()}`;
    // operationId is the server-side idempotency key (PBI-052): a stable UUID kept
    // in the payload so a resend of this same outbox row never applies twice.
    // startedAtDevice/location are kept locally for now; the batch endpoint only
    // consumes {inspectionId, status} today — location persistence is PBI-045.
    await this.syncQueueRepo.enqueue(id, 'TRANSITION', 'inspection', inspectionId, {
      operationId: randomUuidV4(),
      status: input.status,
      startedAtDevice: input.startedAtDevice,
      location: input.location,
    });
  }
}
