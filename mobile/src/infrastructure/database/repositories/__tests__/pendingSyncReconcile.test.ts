/**
 * Pending-sync reconciliation — fixes the divergence where the home counter
 * ("N operações pendentes") stayed stuck on the optimistic value set when an
 * action was queued (e.g. the fixed "5" from concludeInspection), while the
 * real outbox (sync_queue) had already been drained to 0 by a sync.
 *
 * These tests run the REAL migrations + repositories against an in-memory
 * SQLite DB (better-sqlite3), exercising the actual SQL used to count pending
 * operations per inspection and to reset an inspection's sync state.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { createInMemoryDb } from '@/infrastructure/database/__tests__/inMemoryDb';
import { runMigrations } from '@/infrastructure/database/migrations';
import { InspectionRepository, SyncQueueRepository } from '@/infrastructure/database/repositories';

const INSPECTION_ID = 'insp-1';

function baseInspection(overrides: Record<string, unknown> = {}) {
  return {
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
    status: 'SUBMITTED',
    priority: 'MEDIUM',
    dueDate: '2026-09-30',
    dueTime: '',
    createdAt: '2026-09-01T00:00:00Z',
    progress: 100,
    supervisorInstructions: '',
    // Optimistic value set at conclusion time (the stuck "5").
    syncStatus: 'pending',
    pendingSyncCount: 5,
    overdue: false,
    ...overrides,
  } as never;
}

describe('pending-sync reconciliation against the real outbox', () => {
  let db: SQLiteDatabase;
  let inspectionRepo: InspectionRepository;
  let queueRepo: SyncQueueRepository;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    inspectionRepo = new InspectionRepository(db);
    queueRepo = new SyncQueueRepository(db);
    await inspectionRepo.upsert(baseInspection());
  });

  it('counts zero pending when the outbox is empty, so setSyncState clears the inspection', async () => {
    // Outbox drained by a successful sync → nothing queued for this inspection.
    const counts = await queueRepo.countPendingByInspection();
    expect(counts.get(INSPECTION_ID)).toBeUndefined();

    await inspectionRepo.setSyncState(INSPECTION_ID, counts.get(INSPECTION_ID) ?? 0);

    const saved = await inspectionRepo.getById(INSPECTION_ID);
    expect(saved?.pendingSyncCount).toBe(0);
    expect(saved?.syncStatus).toBe('synced');
  });

  it('keeps the inspection pending with the real count when operations remain queued', async () => {
    // A conclusion transition is still queued for this inspection.
    await queueRepo.enqueue('op-1', 'TRANSITION', 'inspection', INSPECTION_ID, {
      status: 'SUBMITTED',
    });

    const counts = await queueRepo.countPendingByInspection();
    expect(counts.get(INSPECTION_ID)).toBe(1);

    await inspectionRepo.setSyncState(INSPECTION_ID, counts.get(INSPECTION_ID) ?? 0);

    const saved = await inspectionRepo.getById(INSPECTION_ID);
    expect(saved?.pendingSyncCount).toBe(1);
    expect(saved?.syncStatus).toBe('pending');
  });

  it('resolves a queued answer back to its owning inspection via join', async () => {
    // Seed the section/item the answer FK-references, then an answer row + its
    // queued upsert op (entity_id points at the answer, not the inspection) must
    // still be attributed to the inspection via the join.
    await db.runAsync(
      `INSERT INTO inspection_sections (id, inspection_id, title, sort_order)
       VALUES ('sec-1', ?, 'Seção', 1)`,
      INSPECTION_ID,
    );
    await db.runAsync(
      `INSERT INTO inspection_items (id, section_id, inspection_id, question, response_type)
       VALUES ('item-1', 'sec-1', ?, 'Pergunta', 'CONFORMITY')`,
      INSPECTION_ID,
    );
    await db.runAsync(
      `INSERT INTO answers (id, inspection_id, item_id, value, sync_status)
       VALUES ('ans-1', ?, 'item-1', 'CONFORME', 'pending')`,
      INSPECTION_ID,
    );
    await queueRepo.enqueue('op-ans-1', 'UPDATE', 'answer', 'ans-1', { value: 'CONFORME' });

    const counts = await queueRepo.countPendingByInspection();
    expect(counts.get(INSPECTION_ID)).toBe(1);
  });
});
