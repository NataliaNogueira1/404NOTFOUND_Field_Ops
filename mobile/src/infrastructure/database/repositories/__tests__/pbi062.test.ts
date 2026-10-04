/**
 * PBI-062 / #80 — "Técnico recebe inspeção reprovada para correção".
 *
 * These tests pin the pull/upsert contract that lets a supervisor's review
 * decision reach the device: a REJECTED inspection coming from the server must
 * become "Reprovada" locally (with its reason), while a plain re-pull must never
 * revert an inspection the technician is already working on.
 *
 * They run the REAL migrations + InspectionRepository against an in-memory
 * SQLite DB (better-sqlite3), so the actual UPSERT SQL is what gets exercised.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { createInMemoryDb } from '@/infrastructure/database/__tests__/inMemoryDb';
import { runMigrations } from '@/infrastructure/database/migrations';
import { InspectionRepository } from '@/infrastructure/database/repositories';

const INSPECTION_ID = 'insp-7';

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
    ...overrides,
  } as never;
}

describe('PBI-062 — pull propagates a REJECTED decision without reverting local work', () => {
  let db: SQLiteDatabase;
  let repo: InspectionRepository;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    repo = new InspectionRepository(db);
  });

  it('applies the REJECTED status and rejection fields coming from the server', async () => {
    // Device already has the inspection as ASSIGNED (from an earlier pull).
    await repo.upsert(baseInspection({ status: 'ASSIGNED' }));

    // Supervisor rejects it; the next pull brings REJECTED + the reason/author/date.
    await repo.upsert(
      baseInspection({
        status: 'REJECTED',
        rejectionReason: 'Foto do item 1 ilegível; refazer.',
        rejectedBy: 'Marina Supervisora',
        rejectedAt: '2026-10-02T12:00:00Z',
      }),
    );

    const saved = await repo.getById(INSPECTION_ID);
    expect(saved?.status).toBe('REJECTED');
    expect(saved?.rejectionReason).toBe('Foto do item 1 ilegível; refazer.');
    expect(saved?.rejectedBy).toBe('Marina Supervisora');
    expect(saved?.rejectedAt).toBe('2026-10-02T12:00:00Z');
  });

  it('does NOT revert an IN_PROGRESS inspection when the server still has it as ASSIGNED', async () => {
    // The technician started the inspection locally.
    await repo.upsert(baseInspection({ status: 'IN_PROGRESS' }));

    // A routine re-pull brings the server's stale ASSIGNED state.
    await repo.upsert(baseInspection({ status: 'ASSIGNED' }));

    const saved = await repo.getById(INSPECTION_ID);
    // Local in-progress work must win — the pull cannot drag it back to ASSIGNED.
    expect(saved?.status).toBe('IN_PROGRESS');
  });
});
