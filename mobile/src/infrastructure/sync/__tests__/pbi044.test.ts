/**
 * PBI-044 — "Foto pendente quando upload falha".
 *
 * Runs the REAL migrations, repositories and InspectionSyncService against an
 * in-memory SQLite DB (better-sqlite3). Network (upload) and file persistence
 * are mocked so failures/successes and app-restart persistence can be asserted.
 */

// ── Module mocks (must be declared before importing the service) ──────────────

// react-native Platform is pulled in transitively by the upload client / file
// helper; stub it so the modules load in a Node environment.
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }), { virtual: true });

// The evidence upload client is mocked so each test decides success/failure.
const mockUpload = jest.fn();
jest.mock('../EvidenceUploadClient', () => ({
  evidenceUploadClient: { upload: (...args: unknown[]) => mockUpload(...args) },
}));

// The base API client (used for inspection status only) is stubbed.
jest.mock('@/infrastructure/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import type { SQLiteDatabase } from 'expo-sqlite';

import { createInMemoryDb } from '@/infrastructure/database/__tests__/inMemoryDb';
import { runMigrations } from '@/infrastructure/database/migrations';
import {
  EvidenceRepository,
  SyncQueueRepository,
  InspectionRepository,
} from '@/infrastructure/database/repositories';
import { InspectionSyncService } from '../InspectionSyncService';
import type { Evidence } from '@/features/fieldops/types';

const TOKEN = 'test-token';
const INSPECTION_ID = 'insp-1';
const ITEM_ID = 'item-7';

async function seedInspection(db: SQLiteDatabase): Promise<void> {
  const inspRepo = new InspectionRepository(db);
  await inspRepo.upsert({
    id: INSPECTION_ID,
    title: 'Inspeção teste',
    templateId: 't1',
    clientId: 'c1',
    clientName: 'Cliente',
    siteId: 's1',
    siteName: 'Local',
    equipmentId: 'e1',
    equipmentName: 'Equip',
    technicianId: 'tec1',
    supervisorId: 'sup1',
    supervisorName: 'Sup',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: '2026-09-30',
    dueTime: '',
    createdAt: '2026-09-01T00:00:00Z',
    progress: 0,
    supervisorInstructions: '',
    syncStatus: 'synced',
    pendingSyncCount: 0,
    overdue: false,
  } as never);

  // Seed the section + item snapshot the evidence FKs point to (FKs are ON).
  await db.runAsync(
    'INSERT INTO inspection_sections (id, inspection_id, title, sort_order) VALUES (?, ?, ?, ?)',
    'sec-1',
    INSPECTION_ID,
    'Seção 1',
    0,
  );
  await db.runAsync(
    `INSERT INTO inspection_items (id, section_id, inspection_id, question, response_type, required, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ITEM_ID,
    'sec-1',
    INSPECTION_ID,
    'Item 7?',
    'CONFORMITY',
    1,
    0,
  );
}

/** Build an evidence exactly like FieldOpsContext.addEvidence does. */
function buildEvidence(overrides: Partial<Evidence> = {}): Evidence {
  const id = overrides.id ?? `ev-${ITEM_ID}-1`;
  return {
    id,
    inspectionId: INSPECTION_ID,
    itemId: ITEM_ID,
    description: 'Foto do item 7',
    uri: 'file:///documents/evidences/evidence_1.jpg',
    capturedAt: '2026-09-22T10:00:00Z',
    syncStatus: 'pending',
    operationId: InspectionSyncService.evidenceOperationId(id),
    responseId: InspectionSyncService.answerOperationId(INSPECTION_ID, ITEM_ID),
    retryCount: 0,
    ...overrides,
  };
}

/** Persist an evidence + enqueue its upload op (like the app does). */
async function captureEvidence(
  db: SQLiteDatabase,
  service: InspectionSyncService,
  overrides: Partial<Evidence> = {},
): Promise<Evidence> {
  const evidence = buildEvidence(overrides);
  await new EvidenceRepository(db).add(evidence);
  await service.enqueueEvidence(evidence);
  return evidence;
}

/** Enqueue the answer op the photo depends on (like answerItem does). */
async function enqueueAnswer(service: InspectionSyncService): Promise<void> {
  await service.enqueueAnswer(INSPECTION_ID, ITEM_ID, 'CONFORME');
}

describe('PBI-044 — photo pending on upload failure', () => {
  let db: SQLiteDatabase;
  let service: InspectionSyncService;
  let evidenceRepo: EvidenceRepository;
  let queueRepo: SyncQueueRepository;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    await seedInspection(db);
    service = new InspectionSyncService(db);
    evidenceRepo = new EvidenceRepository(db);
    queueRepo = new SyncQueueRepository(db);
    mockUpload.mockReset();
  });

  // Test 1 — capturing a photo creates a persistent evidence row with a file uri.
  it('persists a captured evidence with its local file uri', async () => {
    const evidence = await captureEvidence(db, service);
    const stored = await evidenceRepo.getById(evidence.id);
    expect(stored).not.toBeNull();
    expect(stored?.uri).toBe('file:///documents/evidences/evidence_1.jpg');
    expect(stored?.syncStatus).toBe('pending');
  });

  // Test 2 — a photo creates an UPLOAD operation in the outbox.
  it('creates an UPLOAD operation in the outbox for the photo', async () => {
    const evidence = await captureEvidence(db, service);
    const all = await queueRepo.getAll();
    const op = all.find((o) => o.entityId === evidence.id);
    expect(op).toBeDefined();
    expect(op?.operationType).toBe('UPLOAD');
    expect(op?.entityType).toBe('evidence');
  });

  // Test 3 — the upload op depends on the answer op of the same item.
  it('links the upload operation to the answer operation via dependencyIds', async () => {
    const evidence = await captureEvidence(db, service);
    const all = await queueRepo.getAll();
    const op = all.find((o) => o.entityId === evidence.id);
    expect(op?.dependencyIds).toContain(
      InspectionSyncService.answerOperationId(INSPECTION_ID, ITEM_ID),
    );
  });

  // Test 4 — the upload does NOT run while the answer is still pending.
  it('defers the upload while the answer operation is still pending', async () => {
    await enqueueAnswer(service);
    await captureEvidence(db, service);

    const ready = await queueRepo.getReady();
    const readyEvidence = ready.find((o) => o.entityType === 'evidence');
    // Answer is still pending → the photo upload is not eligible yet.
    expect(readyEvidence).toBeUndefined();
    // And the upload client was never called.
    expect(mockUpload).not.toHaveBeenCalled();
  });

  // Test 5 — once the answer is applied, the upload becomes eligible.
  it('releases the upload after the answer operation is applied', async () => {
    await enqueueAnswer(service);
    const evidence = await captureEvidence(db, service);

    // Simulate the answer op being applied and cleaned up.
    const answerOpId = InspectionSyncService.answerOperationId(INSPECTION_ID, ITEM_ID);
    await queueRepo.markSent(answerOpId);
    await queueRepo.removeSent();

    const ready = await queueRepo.getReady();
    const readyEvidence = ready.find((o) => o.entityId === evidence.id);
    expect(readyEvidence).toBeDefined();
  });

  // Test 6 — a successful upload marks the evidence as SYNCED.
  it('marks the evidence SYNCED when the server confirms the upload', async () => {
    mockUpload.mockResolvedValue({ status: 'APPLIED' });
    const evidence = await captureEvidence(db, service); // no answer dep pending

    const result = await service.pushPendingOperations(TOKEN);

    expect(result.sent).toBe(1);
    const stored = await evidenceRepo.getById(evidence.id);
    expect(stored?.syncStatus).toBe('synced');
    expect(stored?.lastError).toBeUndefined();
  });

  // Test 7 — a failed upload marks the operation FAILED (error) in the outbox.
  it('marks the outbox operation as error when the upload fails', async () => {
    mockUpload.mockRejectedValue(new Error('Timeout durante upload'));
    const evidence = await captureEvidence(db, service);

    const result = await service.pushPendingOperations(TOKEN);

    expect(result.failed).toBe(1);
    const op = (await queueRepo.getAll()).find((o) => o.entityId === evidence.id);
    expect(op?.status).toBe('error');
  });

  // Test 8 — the failure persists last_error on the evidence.
  it('persists last_error on the evidence when the upload fails', async () => {
    mockUpload.mockRejectedValue(new Error('Timeout durante upload'));
    const evidence = await captureEvidence(db, service);

    await service.pushPendingOperations(TOKEN);

    const stored = await evidenceRepo.getById(evidence.id);
    expect(stored?.syncStatus).toBe('error');
    expect(stored?.lastError).toContain('Timeout');
  });

  // Test 9 — a failed upload never removes the local file/uri.
  it('keeps the local file uri after a failed upload', async () => {
    mockUpload.mockRejectedValue(new Error('Timeout durante upload'));
    const evidence = await captureEvidence(db, service);

    await service.pushPendingOperations(TOKEN);

    const stored = await evidenceRepo.getById(evidence.id);
    expect(stored?.uri).toBe(evidence.uri);
  });

  // Test 10 — "Tentar novamente" re-enqueues the SAME operation and re-sends it.
  it('retries the existing upload operation without capturing a new photo', async () => {
    mockUpload.mockRejectedValueOnce(new Error('Timeout durante upload'));
    const evidence = await captureEvidence(db, service);
    await service.pushPendingOperations(TOKEN); // fails

    // Retry: reuse existing file + op.
    const failed = await evidenceRepo.getById(evidence.id);
    await service.retryEvidenceUpload(failed!);

    const opAfterRetry = (await queueRepo.getAll()).find((o) => o.entityId === evidence.id);
    expect(opAfterRetry?.status).toBe('pending');

    // Second attempt succeeds.
    mockUpload.mockResolvedValue({ status: 'APPLIED' });
    const result = await service.pushPendingOperations(TOKEN);
    expect(result.sent).toBe(1);

    const stored = await evidenceRepo.getById(evidence.id);
    expect(stored?.syncStatus).toBe('synced');
    expect(stored?.retryCount).toBe(1);
  });

  // Test 11 — an answer can be SYNCED while the photo stays FAILED (independent).
  it('keeps the photo FAILED even after the answer is synced', async () => {
    await enqueueAnswer(service);
    const evidence = await captureEvidence(db, service);

    // Answer applied + cleaned up.
    const answerOpId = InspectionSyncService.answerOperationId(INSPECTION_ID, ITEM_ID);
    await queueRepo.markSent(answerOpId);
    await queueRepo.removeSent();

    // Photo upload now runs but fails.
    mockUpload.mockRejectedValue(new Error('Falha no upload'));
    await service.pushPendingOperations(TOKEN);

    const stored = await evidenceRepo.getById(evidence.id);
    expect(stored?.syncStatus).toBe('error');
    // The answer op is gone (applied); it was not re-created by the photo failure.
    const answerOp = (await queueRepo.getAll()).find((o) => o.id === answerOpId);
    expect(answerOp).toBeUndefined();
  });

  // Test 12 — the photo (and its failed state) survives an app restart.
  it('keeps the evidence and its failed state after an app restart', async () => {
    mockUpload.mockRejectedValue(new Error('Timeout durante upload'));
    const evidence = await captureEvidence(db, service);
    await service.pushPendingOperations(TOKEN);

    // Simulate restart: build a NEW repository/service over the same DB handle
    // (the in-memory DB stands in for the on-disk SQLite file).
    const repoAfterRestart = new EvidenceRepository(db);
    const stored = await repoAfterRestart.getById(evidence.id);
    expect(stored).not.toBeNull();
    expect(stored?.uri).toBe(evidence.uri);
    expect(stored?.syncStatus).toBe('error');
    expect(stored?.lastError).toContain('Timeout');
  });

  // Regression — re-running the inspection upsert (as the pull does on every app
  // open) must NOT cascade-delete the evidence. This reproduces the reported bug
  // "the photo disappears when leaving and re-entering the app".
  it('keeps the evidence when the inspection is re-upserted by a pull', async () => {
    const evidence = await captureEvidence(db, service);

    // Simulate a re-pull: upsert the SAME inspection row again (this is what the
    // pull does on every app open). With INSERT OR REPLACE this used to cascade
    // -delete the evidence; with a real UPSERT the child rows must survive.
    const inspRepo = new InspectionRepository(db);
    await inspRepo.upsert({
      id: INSPECTION_ID,
      title: 'Inspeção teste (re-pull)',
      templateId: 't1',
      clientId: 'c1',
      clientName: 'Cliente',
      siteId: 's1',
      siteName: 'Local',
      equipmentId: 'e1',
      equipmentName: 'Equip',
      technicianId: 'tec1',
      supervisorId: 'sup1',
      supervisorName: 'Sup',
      status: 'ASSIGNED',
      priority: 'MEDIUM',
      dueDate: '2026-09-30',
      dueTime: '',
      createdAt: '2026-09-01T00:00:00Z',
      progress: 0,
      supervisorInstructions: '',
      syncStatus: 'synced',
      pendingSyncCount: 0,
      overdue: false,
    } as never);

    const stored = await evidenceRepo.getById(evidence.id);
    expect(stored).not.toBeNull();
    expect(stored?.uri).toBe(evidence.uri);
  });

  // Regression — the pull must not rewrite an existing snapshot (which would
  // cascade-delete evidences pointing at the items). hasSnapshot guards it.
  it('reports an existing snapshot so the pull skips rewriting it', async () => {
    const inspRepo = new InspectionRepository(db);
    expect(await inspRepo.hasSnapshot(INSPECTION_ID)).toBe(true);
  });

  // Test 13 — retrying does not create duplicate evidence rows or ops.
  it('does not duplicate the evidence or its operation on retry', async () => {
    mockUpload.mockRejectedValueOnce(new Error('Timeout durante upload'));
    const evidence = await captureEvidence(db, service);
    await service.pushPendingOperations(TOKEN);

    const stored = await evidenceRepo.getById(evidence.id);
    await service.retryEvidenceUpload(stored!);
    await service.retryEvidenceUpload(stored!);

    const evidences = await evidenceRepo.getByItem(INSPECTION_ID, ITEM_ID);
    expect(evidences).toHaveLength(1);

    const ops = (await queueRepo.getAll()).filter((o) => o.entityId === evidence.id);
    expect(ops).toHaveLength(1);
  });
});
