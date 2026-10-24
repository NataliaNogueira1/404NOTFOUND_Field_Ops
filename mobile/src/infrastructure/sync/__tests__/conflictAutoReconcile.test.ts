/**
 * Version-conflict auto-reconciliation (PBI-055) — fixes the offline
 * start→conclusion case where both transitions are queued with a stale
 * baseVersion=0. On sync the start bumps the server to v1, so the conclusion is
 * rejected with "local=0, server=1" and used to stay stuck as a terminal
 * 'conflict' forever (device looked synced while the server stayed IN_PROGRESS).
 *
 * The sync worker now pulls the fresh version, rewrites the queued baseVersion
 * and retries, so the conclusion applies without the technician doing anything.
 *
 * Runs the REAL migrations, repositories and InspectionSyncService against an
 * in-memory SQLite DB (better-sqlite3); the API client is mocked to drive the
 * push results and the single-inspection pull.
 */

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
import { InspectionRepository, SyncQueueRepository } from '@/infrastructure/database/repositories';
import { InspectionSyncService } from '../InspectionSyncService';

const TOKEN = 'test-token';
const INSPECTION_ID = 'insp-1';

function apiInspection(version: number, status: string): Record<string, unknown> {
  return {
    id: INSPECTION_ID,
    title: 'Inspeção',
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
    createdAt: '2026-09-01T00:00:00Z',
    progress: 50,
    version,
  };
}

describe('version-conflict auto-reconciliation on inspection transitions', () => {
  let db: SQLiteDatabase;
  let inspectionRepo: InspectionRepository;
  let queueRepo: SyncQueueRepository;
  let service: InspectionSyncService;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    inspectionRepo = new InspectionRepository(db);
    queueRepo = new SyncQueueRepository(db);
    service = new InspectionSyncService(db);
    mockGet.mockReset();
    mockPost.mockReset();

    // Local inspection known at server version 0.
    await inspectionRepo.upsert({
      id: INSPECTION_ID,
      title: 'Inspeção',
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
      progress: 50,
      supervisorInstructions: '',
      serverVersion: 0,
      syncStatus: 'pending',
      pendingSyncCount: 1,
      overdue: false,
    } as never);
  });

  it('refreshes the version and retries a conflicted conclusion so it applies', async () => {
    // Two transitions queued offline, both frozen at baseVersion=0.
    await queueRepo.enqueue('op-start', 'TRANSITION', 'inspection', INSPECTION_ID, {
      operationId: 'uuid-start',
      status: 'IN_PROGRESS',
      baseVersion: 0,
    });
    await queueRepo.enqueue('op-conclusion', 'TRANSITION', 'inspection', INSPECTION_ID, {
      operationId: 'uuid-conclusion',
      status: 'SUBMITTED',
      baseVersion: 0,
    });

    // Push results, in call order:
    //  1) start        → APPLIED (server goes 0→1)
    //  2) conclusion    → CONFLICT (local=0, server=1)
    //  3) conclusion #2 → APPLIED (after baseVersion rewritten to 1)
    mockPost
      .mockResolvedValueOnce({ results: [{ status: 'APPLIED' }] })
      .mockResolvedValueOnce({ results: [{ status: 'CONFLICT', detail: 'Inspection version conflict: local=0, server=1' }] })
      .mockResolvedValueOnce({ results: [{ status: 'APPLIED' }] });

    // The reconciliation pull returns the inspection now at version 1.
    mockGet.mockResolvedValue(apiInspection(1, 'IN_PROGRESS'));

    const result = await service.pushPendingOperations(TOKEN);

    // The conclusion must NOT be left as a terminal conflict.
    const queued = await queueRepo.getAll();
    const conclusion = queued.find((op) => op.id === 'op-conclusion');
    expect(conclusion).toBeUndefined(); // applied → removed from the outbox
    expect(result.sent).toBe(2); // start + conclusion both applied

    // The retried conclusion was sent with the refreshed baseVersion=1.
    const conclusionCalls = mockPost.mock.calls.filter(
      (call) => (call[1] as { operations: { payload: { status: string } }[] }).operations[0].payload.status === 'SUBMITTED',
    );
    expect(conclusionCalls).toHaveLength(2);
    const retryBody = conclusionCalls[1][1] as { operations: { baseVersion: number }[] };
    expect(retryBody.operations[0].baseVersion).toBe(1);
  });

  it('gives up and marks a terminal conflict after exhausting retries', async () => {
    await queueRepo.enqueue('op-conclusion', 'TRANSITION', 'inspection', INSPECTION_ID, {
      operationId: 'uuid-conclusion',
      status: 'SUBMITTED',
      baseVersion: 0,
    });

    // The server keeps advancing: every push conflicts, every pull bumps the
    // version. The retry cap must stop the loop and leave a terminal conflict.
    let serverVersion = 1;
    mockPost.mockResolvedValue({ results: [{ status: 'CONFLICT', detail: 'Inspection version conflict' }] });
    mockGet.mockImplementation(() => Promise.resolve(apiInspection(serverVersion++, 'IN_PROGRESS')));

    await service.pushPendingOperations(TOKEN);

    const queued = await queueRepo.getAll();
    const conclusion = queued.find((op) => op.id === 'op-conclusion');
    expect(conclusion?.status).toBe('conflict');
  });
});
