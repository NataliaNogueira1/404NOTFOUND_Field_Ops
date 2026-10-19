/**
 * PBI-051 / #232 — "Mobile: habilitar envio de respostas e NCs no sync".
 *
 * The backend applicators (#223) now accept ANSWER_UPSERT and
 * NON_CONFORMITY_CREATE in POST /api/v1/mobile/sync/push. These tests pin the
 * mobile side of the contract, running the REAL migrations, repositories and
 * InspectionSyncService against an in-memory SQLite DB (better-sqlite3), with
 * only the base API client mocked so each test decides the server outcome.
 *
 * Acceptance criteria (#232):
 *  - answers/NCs created offline leave the queue after a sync (no longer stuck);
 *  - a resend never duplicates (idempotent) and respects dependencies;
 *  - the sync screen reflects the real per-operation result.
 */

// ── Module mocks (must be declared before importing the service) ──────────────

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }), { virtual: true });

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
  AnswerRepository,
  NonConformityRepository,
  SyncQueueRepository,
  InspectionRepository,
} from '@/infrastructure/database/repositories';
import { InspectionSyncService } from '../InspectionSyncService';
import type { NonConformity } from '@/features/fieldops/types';
import { Severity } from '@/features/fieldops/types';

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
    serverVersion: 3,
  } as never);

  // Seed the section + item snapshot that answers / non-conformities FK into
  // (foreign keys are ON in the in-memory DB).
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

function buildNonConformity(overrides: Partial<NonConformity> = {}): NonConformity {
  return {
    id: 'nc-item-7-1',
    inspectionId: INSPECTION_ID,
    itemId: ITEM_ID,
    title: 'Não conformidade - item 7',
    description: 'Vazamento identificado',
    severity: Severity.HIGH,
    evidenceCount: 0,
    ...overrides,
  };
}

/** The single-operation result the batch endpoint returns per push. */
function pushResult(status: string, detail?: string) {
  return { results: [{ operationId: 'ignored-by-client', status, detail: detail ?? null }] };
}

describe('PBI-051 — mobile sync of answers and non-conformities', () => {
  let db: SQLiteDatabase;
  let queueRepo: SyncQueueRepository;
  let answerRepo: AnswerRepository;
  let ncRepo: NonConformityRepository;
  let service: InspectionSyncService;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    await seedInspection(db);
    queueRepo = new SyncQueueRepository(db);
    answerRepo = new AnswerRepository(db);
    ncRepo = new NonConformityRepository(db);
    service = new InspectionSyncService(db);
    mockGet.mockReset();
    mockPost.mockReset();
  });

  // ── Criterion: answers leave the queue after a successful sync ──────────────

  it('sends a queued answer and removes it from the outbox on APPLIED', async () => {
    await answerRepo.save(INSPECTION_ID, ITEM_ID, 'CONFORME');
    await service.enqueueAnswer(INSPECTION_ID, ITEM_ID, 'CONFORME');
    mockPost.mockResolvedValue(pushResult('APPLIED'));

    const result = await service.pushPendingOperations(TOKEN);

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(await queueRepo.countPending()).toBe(0);
    // The local answer row is flipped to synced.
    const [answer] = await answerRepo.getPendingSync();
    expect(answer).toBeUndefined();
  });

  it('sends a queued ANSWER_UPSERT operation with inspectionId, itemId and value', async () => {
    await answerRepo.save(INSPECTION_ID, ITEM_ID, 'NAO_CONFORME', 'Observação');
    await service.enqueueAnswer(INSPECTION_ID, ITEM_ID, 'NAO_CONFORME', 'Observação');
    mockPost.mockResolvedValue(pushResult('APPLIED'));

    await service.pushPendingOperations(TOKEN);

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [path, body] = mockPost.mock.calls[0];
    expect(path).toBe('/api/v1/mobile/sync/push');
    const op = body.operations[0];
    expect(op.type).toBe('ANSWER_UPSERT');
    expect(op.payload).toMatchObject({
      inspectionId: INSPECTION_ID,
      itemId: ITEM_ID,
      value: 'NAO_CONFORME',
      observation: 'Observação',
    });
    // Contract requires a UUID operationId and a numeric baseVersion.
    expect(op.operationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab]/i);
    expect(typeof op.baseVersion).toBe('number');
  });

  // ── Criterion: NCs leave the queue after a successful sync ──────────────────

  it('sends a queued non-conformity and removes it from the outbox on APPLIED', async () => {
    const nc = buildNonConformity();
    await ncRepo.add(nc);
    await service.enqueueNonConformity(nc);
    mockPost.mockResolvedValue(pushResult('APPLIED'));

    const result = await service.pushPendingOperations(TOKEN);

    expect(result.sent).toBe(1);
    expect(await queueRepo.countPending()).toBe(0);
    const [path, body] = mockPost.mock.calls[0];
    expect(path).toBe('/api/v1/mobile/sync/push');
    const op = body.operations[0];
    expect(op.type).toBe('NON_CONFORMITY_CREATE');
    expect(op.payload).toMatchObject({
      inspectionId: INSPECTION_ID,
      itemId: ITEM_ID,
      title: nc.title,
      description: nc.description,
      severity: 'HIGH',
    });
    expect(await ncRepo.getPendingSync()).toHaveLength(0);
  });

  // ── Criterion: idempotent resend never duplicates ───────────────────────────

  it('treats ALREADY_APPLIED as success without duplicating the answer', async () => {
    await answerRepo.save(INSPECTION_ID, ITEM_ID, 'CONFORME');
    await service.enqueueAnswer(INSPECTION_ID, ITEM_ID, 'CONFORME');
    mockPost.mockResolvedValue(pushResult('ALREADY_APPLIED'));

    const result = await service.pushPendingOperations(TOKEN);

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(await queueRepo.countPending()).toBe(0);
  });

  it('reuses the same operationId across resends (idempotency key is stable)', async () => {
    await answerRepo.save(INSPECTION_ID, ITEM_ID, 'CONFORME');
    await service.enqueueAnswer(INSPECTION_ID, ITEM_ID, 'CONFORME');

    // First attempt fails at the transport level (keeps it queued).
    mockPost.mockRejectedValueOnce(new Error('network down'));
    await service.pushPendingOperations(TOKEN);
    const firstOp = JSON.parse((await queueRepo.getAll())[0].payload).operationId;

    // Second attempt succeeds.
    mockPost.mockResolvedValue(pushResult('APPLIED'));
    await service.pushPendingOperations(TOKEN);
    const secondOp = mockPost.mock.calls[0][1].operations[0].operationId;

    expect(secondOp).toBe(firstOp);
  });

  // ── Criterion: the sync screen reflects the real result ─────────────────────

  it('keeps a FAILED answer in the queue as error with the server detail', async () => {
    await answerRepo.save(INSPECTION_ID, ITEM_ID, 'CONFORME');
    await service.enqueueAnswer(INSPECTION_ID, ITEM_ID, 'CONFORME');
    mockPost.mockResolvedValue(pushResult('FAILED', 'Item not found for inspection'));

    const result = await service.pushPendingOperations(TOKEN);

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
    const [op] = await queueRepo.getAll();
    expect(op.status).toBe('error');
    expect(op.lastError).toContain('Item not found');
    // Still pending work, so the answer row stays unsynced.
    expect(await answerRepo.getPendingSync()).toHaveLength(1);
  });

  it('marks a CONFLICT answer as conflict in the queue', async () => {
    await answerRepo.save(INSPECTION_ID, ITEM_ID, 'CONFORME');
    await service.enqueueAnswer(INSPECTION_ID, ITEM_ID, 'CONFORME');
    mockPost.mockResolvedValue(pushResult('CONFLICT', 'Inspection version conflict: local=3, server=5'));

    const result = await service.pushPendingOperations(TOKEN);

    expect(result.sent).toBe(0);
    const [op] = await queueRepo.getAll();
    expect(op.status).toBe('conflict');
    expect(op.lastError).toContain('server=5');
  });

  // ── Criterion: dependencies respected (answer before its NC on same item) ───

  it('does not resend an answer already applied before the NC in the same cycle', async () => {
    // Answer and NC for the same item, both offline.
    await answerRepo.save(INSPECTION_ID, ITEM_ID, 'NAO_CONFORME');
    await service.enqueueAnswer(INSPECTION_ID, ITEM_ID, 'NAO_CONFORME');
    const nc = buildNonConformity();
    await ncRepo.add(nc);
    await service.enqueueNonConformity(nc);

    mockPost.mockResolvedValue(pushResult('APPLIED'));
    const result = await service.pushPendingOperations(TOKEN);

    // Both leave the queue; each is pushed exactly once.
    expect(result.sent).toBe(2);
    expect(await queueRepo.countPending()).toBe(0);
    expect(mockPost).toHaveBeenCalledTimes(2);
  });

  // ── Robustness: a legacy status op without baseVersion must not wedge sync ──

  it('sends a legacy inspection-status op that has no baseVersion instead of failing it', async () => {
    // Simulate an outbox row enqueued before PBI-055 (no baseVersion in the
    // payload). This used to throw "missing its base server version", flag the
    // op as a permanent error and keep it stuck in the queue forever.
    await queueRepo.enqueue('status-legacy', 'TRANSITION', 'inspection', INSPECTION_ID, {
      status: 'IN_PROGRESS',
      // no baseVersion / no operationId on purpose
    });
    mockPost.mockResolvedValue(pushResult('APPLIED'));

    const result = await service.pushPendingOperations(TOKEN);

    // It is now sent and drains from the queue — not left as an error.
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
    expect(await queueRepo.countPending()).toBe(0);

    // The request defaults baseVersion to 0 (a never-bumped inspection).
    const [, body] = mockPost.mock.calls[0];
    const op = body.operations[0];
    expect(op.type).toBe('INSPECTION_STATUS');
    expect(op.baseVersion).toBe(0);
    expect(op.payload).toMatchObject({ inspectionId: INSPECTION_ID, status: 'IN_PROGRESS' });
  });
});
