/**
 * PBI-053 (mobile) — "Pull incremental por cursor".
 *
 * Exercises the REAL migrations, repositories and InspectionSyncService against
 * an in-memory SQLite DB (better-sqlite3). The API client is mocked so each test
 * drives the `/api/v1/mobile/sync/pull` responses (changes batch, cursor,
 * hasMore). The focus is the cursor flow: first sync with no cursor, cursor
 * persistence + resend, atomic batch write, cursor advancing ONLY after a
 * successful commit, REVIEW/CANCELLATION application and pagination.
 */

// ── Module mocks (must be declared before importing the service) ──────────────

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }), { virtual: true });

// The base API client is stubbed so we control the pull responses per test.
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
  SyncMetadataRepository,
} from '@/infrastructure/database/repositories';
import { InspectionSyncService } from '../InspectionSyncService';

const TOKEN = 'test-token';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** Build a MobileInspectionResponse-shaped payload (same DTO as /mobile/inspections). */
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

function change(type: string, inspection: Record<string, unknown>): Record<string, unknown> {
  return { type, inspection };
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

describe('PBI-053 — incremental pull by cursor', () => {
  let db: SQLiteDatabase;
  let metadataRepo: SyncMetadataRepository;
  let inspectionRepo: InspectionRepository;
  let service: InspectionSyncService;

  beforeEach(async () => {
    db = createInMemoryDb();
    await runMigrations(db);
    metadataRepo = new SyncMetadataRepository(db);
    inspectionRepo = new InspectionRepository(db);
    service = new InspectionSyncService(db);
    mockGet.mockReset();
    mockPost.mockReset();
  });

  // (a) first sync with no local cursor → call WITHOUT the cursor query param.
  it('calls the pull endpoint without a cursor param on the first sync', async () => {
    mockGet.mockResolvedValueOnce({ changes: [], nextCursor: null, hasMore: false });

    await service.pullChanges(TOKEN);

    expect(mockGet).toHaveBeenCalledTimes(1);
    const path = mockGet.mock.calls[0][0] as string;
    expect(path).toContain('/api/v1/mobile/sync/pull');
    expect(path).not.toContain('cursor=');
  });

  // (b) the received nextCursor is persisted after a successful batch write.
  it('persists the received nextCursor and writes the batch', async () => {
    mockGet.mockResolvedValueOnce({
      changes: [change('INSPECTION', buildApiInspection('insp-1'))],
      nextCursor: 'c1',
      hasMore: false,
    });

    const result = await service.pullChanges(TOKEN);

    expect(result.downloaded).toBe(1);
    expect(await inspectionRepo.getById('insp-1')).not.toBeNull();
    expect(await metadataRepo.getPullCursor()).toBe('c1');
  });

  // (c) the persisted cursor is resent on the next call.
  it('resends the stored cursor on the next pull', async () => {
    await metadataRepo.setPullCursor('c1');
    mockGet.mockResolvedValueOnce({ changes: [], nextCursor: 'c1', hasMore: false });

    await service.pullChanges(TOKEN);

    const path = mockGet.mock.calls[0][0] as string;
    expect(path).toContain('cursor=c1');
  });

  // (d1) on a NETWORK failure the cursor does not advance and pending work survives.
  it('does not advance the cursor and keeps pending work when the request fails', async () => {
    await seedInProgressWithPendingWork(db, 'insp-1');
    await metadataRepo.setPullCursor('c0');
    mockGet.mockRejectedValueOnce(new Error('network down'));

    const result = await service.pullChanges(TOKEN);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(await metadataRepo.getPullCursor()).toBe('c0');
    // Pending local answer + evidence untouched.
    expect(await new AnswerRepository(db).getByItem('insp-1', 'item-7')).not.toBeNull();
    expect(await new EvidenceRepository(db).getById('ev-insp-1')).not.toBeNull();
  });

  // (d2) on a WRITE failure (rollback) the cursor does not advance either.
  it('does not advance the cursor when the batch write fails (rollback)', async () => {
    await metadataRepo.setPullCursor('c0');
    // A malformed inspection (missing template fields) makes saveInspectionLocally throw
    // inside the transaction → rollback. Use a null id to force a NOT NULL violation.
    mockGet.mockResolvedValueOnce({
      changes: [change('INSPECTION', buildApiInspection('insp-bad', { id: null }))],
      nextCursor: 'c1',
      hasMore: false,
    });

    const result = await service.pullChanges(TOKEN);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(await metadataRepo.getPullCursor()).toBe('c0');
  });

  // (e) REVIEW (REJECTED) and CANCELLATION are applied to the local status.
  it('applies a REVIEW decision (REJECTED) with its reason', async () => {
    await seedInProgressWithPendingWork(db, 'insp-1');
    mockGet.mockResolvedValueOnce({
      changes: [
        change(
          'REVIEW',
          buildApiInspection('insp-1', {
            status: 'REJECTED',
            rejectionReason: 'Faltou foto',
            rejectedBy: 'Sup',
            rejectedAt: '2026-10-01T10:00:00Z',
            version: 2,
          }),
        ),
      ],
      nextCursor: 'c1',
      hasMore: false,
    });

    await service.pullChanges(TOKEN);

    const stored = await inspectionRepo.getById('insp-1');
    expect(stored?.status).toBe('REJECTED');
    expect(stored?.rejectionReason).toBe('Faltou foto');
    // Pending work preserved despite the server decision.
    expect(await new EvidenceRepository(db).getById('ev-insp-1')).not.toBeNull();
  });

  it('applies a CANCELLATION (CANCELED) without discarding pending local work', async () => {
    await seedInProgressWithPendingWork(db, 'insp-1');
    mockGet.mockResolvedValueOnce({
      changes: [
        change('CANCELLATION', buildApiInspection('insp-1', { status: 'CANCELED', version: 2 })),
      ],
      nextCursor: 'c1',
      hasMore: false,
    });

    await service.pullChanges(TOKEN);

    const stored = await inspectionRepo.getById('insp-1');
    expect(stored?.status).toBe('CANCELED');
    // RN-077: cancellation must NOT silently discard pending local data.
    expect(await new AnswerRepository(db).getByItem('insp-1', 'item-7')).not.toBeNull();
    expect(await new EvidenceRepository(db).getById('ev-insp-1')).not.toBeNull();
  });

  // (f) pagination: hasMore=true then hasMore=false chains the cursor to completion.
  it('follows pagination while hasMore is true, advancing the cursor each page', async () => {
    mockGet
      .mockResolvedValueOnce({
        changes: [change('INSPECTION', buildApiInspection('insp-1'))],
        nextCursor: 'c1',
        hasMore: true,
      })
      .mockResolvedValueOnce({
        changes: [change('INSPECTION', buildApiInspection('insp-2'))],
        nextCursor: 'c2',
        hasMore: false,
      });

    const result = await service.pullChanges(TOKEN);

    expect(mockGet).toHaveBeenCalledTimes(2);
    // Second call resent the first page's cursor.
    expect(mockGet.mock.calls[1][0] as string).toContain('cursor=c1');
    expect(result.downloaded).toBe(2);
    expect(await inspectionRepo.getById('insp-1')).not.toBeNull();
    expect(await inspectionRepo.getById('insp-2')).not.toBeNull();
    expect(await metadataRepo.getPullCursor()).toBe('c2');
  });
});
