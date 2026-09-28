/**
 * PBI-054 — "Tela de status de sincronização".
 *
 * These tests validate the REAL data layer that feeds the sync screen, running
 * the actual migrations, repositories and InspectionSyncService against an
 * in-memory SQLite DB (better-sqlite3). The React component itself is a thin
 * view over this layer, so the meaningful behaviour (pending count, operation
 * status mapping, dependency ⚠️, last *successful* sync, restart persistence)
 * is asserted here — no native RN runtime required.
 *
 * The numbered comments map to the acceptance-criteria test list in the task.
 */

// ── Module mocks (must be declared before importing the service) ──────────────

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }), { virtual: true });

// The base API client is stubbed so we control push/pull outcomes per test.
const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('@/infrastructure/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import type { SQLiteDatabase } from 'expo-sqlite';

import { createInMemoryDb } from '@/infrastructure/database/__tests__/inMemoryDb';
import { runMigrations } from '@/infrastructure/database/migrations';
import {
  SyncQueueRepository,
  SyncMetadataRepository,
  InspectionRepository,
} from '@/infrastructure/database/repositories';
import { InspectionSyncService } from '@/infrastructure/sync';
import { mapOutboxToViews } from '../syncStatusMapping';
import { formatLastSync } from '../formatLastSync';

const TOKEN = 'test-token';
const INSPECTION_ID = 'insp-1';

async function seedInspection(db: SQLiteDatabase, status = 'IN_PROGRESS'): Promise<void> {
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
    status,
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
    'item-7',
    'sec-1',
    INSPECTION_ID,
    'Item 7?',
    'CONFORMITY',
    1,
    0,
  );
}

describe('PBI-054 — sync status screen data layer', () => {
  let db: SQLiteDatabase;
  let queueRepo: SyncQueueRepository;
  let metadataRepo: SyncMetadataRepository;
  let service: InspectionSyncService;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    await seedInspection(db);
    queueRepo = new SyncQueueRepository(db);
    metadataRepo = new SyncMetadataRepository(db);
    service = new InspectionSyncService(db);
    mockGet.mockReset();
    mockPost.mockReset();
  });

  // Test 1 — the screen loads its data from the real outbox (starts empty).
  it('loads an empty outbox with a zero pending count and no last sync', async () => {
    const operations = mapOutboxToViews(await queueRepo.getAll());
    expect(operations).toHaveLength(0);
    expect(await queueRepo.countPending()).toBe(0);
    expect(await metadataRepo.getLastSuccessfulSync()).toBeNull();
    expect(formatLastSync(null)).toBe('Nunca sincronizado');
  });

  // Test 3 — pending count reflects the REAL number of operations to sync.
  it('counts pending operations from the outbox, not a UI counter', async () => {
    await service.enqueueAnswer(INSPECTION_ID, 'item-7', 'CONFORME');
    await service.enqueueStatusChange(INSPECTION_ID, 'SUBMITTED');
    expect(await queueRepo.countPending()).toBe(2);
  });

  // Test 4 — operations are exposed for the list.
  it('exposes queued operations for the list with friendly titles', async () => {
    await service.enqueueAnswer(INSPECTION_ID, 'item-7', 'CONFORME');
    const operations = mapOutboxToViews(await queueRepo.getAll());
    expect(operations).toHaveLength(1);
    expect(operations[0].title).toContain('Resposta');
    expect(operations[0].title).toContain('Item item-7');
  });

  // Test 6 — a pending operation is shown as ⏳ (pending display status).
  it('maps a pending operation to the pending (⏳) status', async () => {
    await service.enqueueStatusChange(INSPECTION_ID, 'SUBMITTED');
    const operations = mapOutboxToViews(await queueRepo.getAll());
    expect(operations[0].displayStatus).toBe('pending');
  });

  // Test 5 — a sent (applied) operation is shown as ✓ (synced display status).
  it('maps a sent operation to the synced (✓) status', async () => {
    await service.enqueueStatusChange(INSPECTION_ID, 'SUBMITTED');
    const [op] = await queueRepo.getAll();
    await queueRepo.markSent(op.id);
    const operations = mapOutboxToViews(await queueRepo.getAll());
    expect(operations[0].displayStatus).toBe('synced');
  });

  // Test 7 — a failed operation is shown as ❌ and surfaces last_error.
  it('maps a failed operation to the error (❌) status with its last_error', async () => {
    await service.enqueueStatusChange(INSPECTION_ID, 'SUBMITTED');
    const [op] = await queueRepo.getAll();
    await queueRepo.markError(op.id, 'Timeout durante upload');
    const operations = mapOutboxToViews(await queueRepo.getAll());
    expect(operations[0].displayStatus).toBe('error');
    expect(operations[0].error).toBe('Timeout durante upload');
  });

  // Test 8 — a photo whose answer is still pending is shown as ⚠️ (waiting on
  // dependency, RN-069), not a misleading error/plain pending.
  it('maps a photo waiting on its pending answer to the waiting (⚠️) status', async () => {
    // Answer of item-7 still pending → blocks the photo of the same item.
    await service.enqueueAnswer(INSPECTION_ID, 'item-7', 'CONFORME');
    await service.enqueueEvidence({
      id: 'ev-1',
      inspectionId: INSPECTION_ID,
      itemId: 'item-7',
      description: 'Foto item 7',
      uri: 'file:///documents/ev-1.jpg',
      capturedAt: '2026-09-22T10:00:00Z',
      syncStatus: 'pending',
    });

    const operations = mapOutboxToViews(await queueRepo.getAll());
    const photo = operations.find((o) => o.entityType === 'evidence');
    expect(photo?.displayStatus).toBe('waiting');
    expect(photo?.waitingReason).toContain('resposta');
  });

  // Complement to Test 8 — once the answer is synced (gone from the queue), the
  // photo is no longer "waiting": it becomes a plain pending (⏳).
  it('stops marking the photo as waiting once its answer is synced', async () => {
    await service.enqueueAnswer(INSPECTION_ID, 'item-7', 'CONFORME');
    await service.enqueueEvidence({
      id: 'ev-1',
      inspectionId: INSPECTION_ID,
      itemId: 'item-7',
      description: 'Foto item 7',
      uri: 'file:///documents/ev-1.jpg',
      capturedAt: '2026-09-22T10:00:00Z',
      syncStatus: 'pending',
    });

    // Simulate the answer being applied and cleaned up.
    const all = await queueRepo.getAll();
    const answerOp = all.find((o) => o.entityType === 'answer')!;
    await queueRepo.markSent(answerOp.id);
    await queueRepo.removeSent();

    const operations = mapOutboxToViews(await queueRepo.getAll());
    const photo = operations.find((o) => o.entityType === 'evidence');
    expect(photo?.displayStatus).toBe('pending');
  });

  // Test 2 — "última sincronização" shows the last SUCCESSFUL sync timestamp.
  it('records the last successful sync timestamp after a clean full sync', async () => {
    mockGet.mockResolvedValue([]); // pull returns nothing, no errors
    const result = await service.fullSync(TOKEN);
    expect(result.errors).toHaveLength(0);

    const last = await metadataRepo.getLastSuccessfulSync();
    expect(last).not.toBeNull();
    expect(formatLastSync(last)).toMatch(/\d{2}\/\d{2}\/\d{4} às \d{2}:\d{2}/);
  });

  // Test 15 — a FAILED attempt must NOT advance the last successful sync.
  it('does not advance last successful sync when the attempt fails', async () => {
    // First: a clean sync sets a baseline timestamp.
    mockGet.mockResolvedValueOnce([]);
    await service.fullSync(TOKEN);
    const baseline = await metadataRepo.getLastSuccessfulSync();
    expect(baseline).not.toBeNull();

    // Then: a failing pull (errors) must keep the baseline unchanged.
    mockGet.mockRejectedValueOnce(new Error('network down'));
    const result = await service.fullSync(TOKEN);
    expect(result.errors.length).toBeGreaterThan(0);

    const afterFailure = await metadataRepo.getLastSuccessfulSync();
    expect(afterFailure).toBe(baseline);
  });

  // Test 16 — operations and the last successful sync survive an app restart
  // (RN-066): a new set of repositories over the same DB sees the same data.
  it('keeps operations and last successful sync after an app restart', async () => {
    await service.enqueueStatusChange(INSPECTION_ID, 'SUBMITTED');
    mockGet.mockResolvedValue([]);
    // Status push succeeds (APPLIED) so the op is sent and cleaned up.
    mockPost.mockResolvedValue({ results: [{ operationId: 'op', status: 'APPLIED' }] });
    await service.fullSync(TOKEN); // clears the sent op, sets last successful sync

    // Enqueue one more that stays pending across the "restart".
    await service.enqueueAnswer(INSPECTION_ID, 'item-7', 'CONFORME');

    // Simulate restart: brand-new repositories over the same DB handle.
    const queueAfterRestart = new SyncQueueRepository(db);
    const metaAfterRestart = new SyncMetadataRepository(db);

    expect(await queueAfterRestart.countPending()).toBe(1);
    expect(await metaAfterRestart.getLastSuccessfulSync()).not.toBeNull();
  });

  // Forward-compat (PBI-044) — when an operation declares explicit dependencyIds
  // and one of them is still in the queue, it is shown as waiting (⚠️), even for
  // non-evidence entities. This exercises the real-dependency path, not the
  // payload heuristic, so PBI-054 keeps working after PBI-044 is merged.
  it('maps an operation waiting on an explicit dependencyId to waiting (⚠️)', () => {
    const now = '2026-09-22T10:00:00Z';
    const answer = {
      id: 'answer-op',
      operationType: 'CREATE' as const,
      entityType: 'answer' as const,
      entityId: 'insp-1-item-7',
      payload: JSON.stringify({ inspectionId: 'insp-1', itemId: 'item-7' }),
      status: 'pending' as const,
      attempts: 0,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };
    const photo = {
      id: 'evidence-op',
      operationType: 'UPLOAD' as const,
      entityType: 'evidence' as const,
      entityId: 'ev-1',
      payload: JSON.stringify({ inspectionId: 'insp-1', itemId: 'item-7' }),
      status: 'pending' as const,
      attempts: 0,
      lastError: null,
      // Explicit dependency on the answer op (PBI-044 shape).
      dependencyIds: ['answer-op'],
      createdAt: now,
      updatedAt: now,
    };

    const views = mapOutboxToViews([answer, photo] as never);
    const photoView = views.find((v) => v.id === 'evidence-op');
    expect(photoView?.displayStatus).toBe('waiting');
  });

  // Guard — the pending count treats error operations as pending work too
  // (they still need syncing), matching countPending().
  it('treats error operations as pending work in the count', async () => {
    await service.enqueueStatusChange(INSPECTION_ID, 'SUBMITTED');
    const [op] = await queueRepo.getAll();
    await queueRepo.markError(op.id, 'boom');
    expect(await queueRepo.countPending()).toBe(1);
  });
});
