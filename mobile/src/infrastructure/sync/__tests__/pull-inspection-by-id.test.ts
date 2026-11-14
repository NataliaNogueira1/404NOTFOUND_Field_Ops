/**
 * Mobile sync — "Pull por id de inspeção" (EP-08, issue irmã da #222 backend).
 *
 * Exercises the REAL migrations, repositories and InspectionSyncService against
 * an in-memory SQLite DB (better-sqlite3). The API client is mocked so each test
 * drives the `GET /api/v1/mobile/inspections/{id}` response. The focus is the
 * single-inspection pull: it hits the by-id endpoint (not the whole list),
 * persists the server-authoritative rejection state locally, and preserves the
 * technician's pending local work (RN-077).
 */

// ── Module mocks (must be declared before importing the service) ──────────────

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }), { virtual: true });

// The base API client is stubbed so we control the by-id response per test.
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
  InspectionRepository,
  AnswerRepository,
  EvidenceRepository,
} from '@/infrastructure/database/repositories';
import { InspectionSyncService } from '../InspectionSyncService';

const TOKEN = 'test-token';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Build a MobileInspectionResponse-shaped payload (same DTO as /mobile/inspections/{id}). */
function buildApiInspection(
  id: string,
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id,
    title: `Inspeção ${id}`,
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
    createdAt: '2026-09-01T00:00:00Z',
    progress: 0,
    version: 1,
    template: {
      id: 't1',
      title: 'Modelo',
      category: 'GENERAL',
      version: 1,
      sections: [
        {
          id: 'sec-1',
          title: 'Seção 1',
          items: [
            {
              id: 'item-7',
              question: 'Item 7?',
              responseType: 'CONFORMITY',
              required: true,
              requireObservationOnFailure: false,
              requireEvidenceOnFailure: false,
            },
          ],
        },
      ],
    },
    ...overrides,
  };
}

/** Seed an inspection already in progress plus a pending local answer + evidence. */
async function seedInProgressWithPendingWork(db: SQLiteDatabase, id: string): Promise<void> {
  const inspRepo = new InspectionRepository(db);
  await inspRepo.upsert({
    id,
    title: 'Inspeção local',
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
    syncStatus: 'pending',
    pendingSyncCount: 1,
    overdue: false,
  } as never);

  await db.runAsync(
    'INSERT INTO inspection_sections (id, inspection_id, title, sort_order) VALUES (?, ?, ?, ?)',
    `${id}-sec`,
    id,
    'Seção 1',
    0,
  );
  await db.runAsync(
    `INSERT INTO inspection_items (id, section_id, inspection_id, question, response_type, required, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    'item-7',
    `${id}-sec`,
    id,
    'Item 7?',
    'CONFORMITY',
    1,
    0,
  );

  // Pending local answer + evidence that MUST survive a server-driven change.
  await new AnswerRepository(db).save(id, 'item-7', 'CONFORME');
  await new EvidenceRepository(db).add({
    id: `ev-${id}`,
    inspectionId: id,
    itemId: 'item-7',
    description: 'Foto item 7',
    uri: 'file:///documents/ev.jpg',
    capturedAt: '2026-09-22T10:00:00Z',
    syncStatus: 'pending',
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Pull por id de inspeção (GET /mobile/inspections/{id})', () => {
  let db: SQLiteDatabase;
  let inspectionRepo: InspectionRepository;
  let service: InspectionSyncService;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    inspectionRepo = new InspectionRepository(db);
    service = new InspectionSyncService(db);
    mockGet.mockReset();
    mockPost.mockReset();
  });

  // (a) hits the by-id endpoint exactly — NOT the whole-list endpoint.
  it('calls the by-id endpoint and never the list endpoint', async () => {
    mockGet.mockResolvedValueOnce(buildApiInspection('insp-1'));

    await service.pullInspection(TOKEN, 'insp-1');

    expect(mockGet).toHaveBeenCalledTimes(1);
    const path = mockGet.mock.calls[0][0] as string;
    expect(path).toBe('/api/v1/mobile/inspections/insp-1');
    // The whole-list endpoint must not be touched by a by-id refresh.
    expect(path).not.toMatch(/\/mobile\/inspections$/);
  });

  // (b) persists a brand-new inspection returned by the by-id pull.
  it('persists the inspection returned by id', async () => {
    mockGet.mockResolvedValueOnce(buildApiInspection('insp-1'));

    await service.pullInspection(TOKEN, 'insp-1');

    const stored = await inspectionRepo.getById('insp-1');
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe('ASSIGNED');
  });

  // (c) reflects the server rejection decision (status + reason) on an existing
  //     local inspection, without needing the full-list download.
  it('reflects the rejection state (status + reason) on the local inspection', async () => {
    await seedInProgressWithPendingWork(db, 'insp-1');
    mockGet.mockResolvedValueOnce(
      buildApiInspection('insp-1', {
        status: 'REJECTED',
        rejectionReason: 'Faltou foto',
        rejectedBy: 'Sup',
        rejectedAt: '2026-10-01T10:00:00Z',
        version: 2,
      }),
    );

    await service.pullInspection(TOKEN, 'insp-1');

    const stored = await inspectionRepo.getById('insp-1');
    expect(stored?.status).toBe('REJECTED');
    expect(stored?.rejectionReason).toBe('Faltou foto');
    expect(stored?.rejectedBy).toBe('Sup');
    expect(stored?.rejectedAt).toBe('2026-10-01T10:00:00Z');
  });

  // (d) RN-077: a server-authoritative change must NOT discard pending local work.
  it('preserves pending local answer + evidence after the by-id pull', async () => {
    await seedInProgressWithPendingWork(db, 'insp-1');
    mockGet.mockResolvedValueOnce(
      buildApiInspection('insp-1', { status: 'REJECTED', rejectionReason: 'x', version: 2 }),
    );

    await service.pullInspection(TOKEN, 'insp-1');

    expect(await new AnswerRepository(db).getByItem('insp-1', 'item-7')).not.toBeNull();
    expect(await new EvidenceRepository(db).getById('ev-insp-1')).not.toBeNull();
  });

  // (e) a failure (network/404/403) propagates so the caller can swallow it —
  //     and must not wipe the existing local inspection.
  it('propagates a pull error and leaves the local inspection intact', async () => {
    await seedInProgressWithPendingWork(db, 'insp-1');
    mockGet.mockRejectedValueOnce(new Error('404 not found'));

    await expect(service.pullInspection(TOKEN, 'insp-1')).rejects.toThrow('404 not found');

    const stored = await inspectionRepo.getById('insp-1');
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe('IN_PROGRESS');
  });
});
