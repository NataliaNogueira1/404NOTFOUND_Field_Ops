/**
 * #338 — "Técnico vê o motivo de cancelamento".
 *
 * Pins the pull/upsert contract that lets an admin/supervisor cancellation reach
 * the device: a CANCELED inspection coming from the server must become "Cancelada"
 * locally carrying its reason, canceler name and timestamp, so the
 * CancellationBanner on the detail screen can show the same audit the supervisor
 * sees.
 *
 * Runs the REAL migrations (incl. v11) + InspectionRepository against an in-memory
 * SQLite DB (better-sqlite3), so the actual UPSERT SQL and the new columns are
 * exercised end-to-end.
 */

import type { SQLiteDatabase } from 'expo-sqlite';

import { createInMemoryDb } from '@/infrastructure/database/__tests__/inMemoryDb';
import { runMigrations } from '@/infrastructure/database/migrations';
import { InspectionRepository } from '@/infrastructure/database/repositories';

const INSPECTION_ID = 'insp-9';

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

describe('#338 — pull propagates a CANCELED decision with its audit', () => {
  let db: SQLiteDatabase;
  let repo: InspectionRepository;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    repo = new InspectionRepository(db);
  });

  it('applies the CANCELED status and cancellation audit coming from the server', async () => {
    await repo.upsert(baseInspection({ status: 'ASSIGNED' }));

    await repo.upsert(
      baseInspection({
        status: 'CANCELED',
        canceledReason: 'Cliente cancelou a visita técnica.',
        canceledBy: 'Marina Supervisora',
        canceledAt: '2026-11-02T12:00:00Z',
      }),
    );

    const saved = await repo.getById(INSPECTION_ID);
    expect(saved?.status).toBe('CANCELED');
    expect(saved?.canceledReason).toBe('Cliente cancelou a visita técnica.');
    expect(saved?.canceledBy).toBe('Marina Supervisora');
    expect(saved?.canceledAt).toBe('2026-11-02T12:00:00Z');
  });

  it('leaves the cancellation audit undefined for a non-canceled inspection', async () => {
    await repo.upsert(baseInspection({ status: 'ASSIGNED' }));

    const saved = await repo.getById(INSPECTION_ID);
    expect(saved?.canceledReason).toBeUndefined();
    expect(saved?.canceledBy).toBeUndefined();
    expect(saved?.canceledAt).toBeUndefined();
  });
});
