/**
 * Approval comment — the supervisor's optional feedback on APPROVED inspections must
 * reach the technician's device and stay readable offline, mirroring PBI-062 for
 * the rejection reason.
 *
 * Runs the REAL migrations + InspectionRepository against an in-memory SQLite DB.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { createInMemoryDb } from '@/infrastructure/database/__tests__/inMemoryDb';
import { runMigrations } from '@/infrastructure/database/migrations';
import { InspectionRepository } from '@/infrastructure/database/repositories';

const INSPECTION_ID = 'insp-approved';

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
    syncStatus: 'synced',
    pendingSyncCount: 0,
    overdue: false,
    ...overrides,
  } as never;
}

describe('approval comment — pull persists the supervisor feedback for the technician', () => {
  let db: SQLiteDatabase;
  let repo: InspectionRepository;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    repo = new InspectionRepository(db);
  });

  it('stores the approval comment when the server sends an APPROVED inspection', async () => {
    await repo.upsert(baseInspection({ status: 'SUBMITTED' }));

    await repo.upsert(
      baseInspection({
        status: 'APPROVED',
        approvalComment: 'Tudo conforme, ótimas evidências.',
        rejectedBy: 'Marina Supervisora',
        rejectedAt: '2026-10-02T12:00:00Z',
      }),
    );

    const saved = await repo.getById(INSPECTION_ID);
    expect(saved?.status).toBe('APPROVED');
    expect(saved?.approvalComment).toBe('Tudo conforme, ótimas evidências.');
  });

  it('does not overwrite local fields with an approval comment from a non-terminal pull', async () => {
    await repo.upsert(baseInspection({ status: 'IN_PROGRESS' }));

    await repo.upsert(baseInspection({ status: 'ASSIGNED', approvalComment: 'stale' }));

    const saved = await repo.getById(INSPECTION_ID);
    expect(saved?.status).toBe('IN_PROGRESS');
    expect(saved?.approvalComment).toBeUndefined();
  });
});
