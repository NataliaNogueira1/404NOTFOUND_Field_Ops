/**
 * PBI-054 / #232 — acceptance criterion "a tela de sync reflete o resultado real".
 *
 * The sync screen (`app/(protected)/(tabs)/sync.tsx`) is a thin view over the
 * pure presentation layer in `syncScreenView.ts`: it maps SYNC_STATUS_META and
 * buildSyncScreenViewModel straight onto React Native elements. These tests pin
 * that presentation layer so the screen is proven to surface the REAL
 * per-operation outcome (synced/pending/error/waiting/conflict), its banners
 * and counters — with the project's standard ts-jest/node setup, no native
 * runtime.
 *
 * They complement pbi054.test.ts (which proves the data layer that feeds the
 * screen) by covering what the technician actually sees.
 */

import { mapOutboxToViews, type SyncOperationView } from '../syncStatusMapping';
import {
  SYNC_STATUS_META,
  buildSyncScreenViewModel,
} from '../syncScreenView';
import type { SyncQueueEntry } from '@/infrastructure/database/repositories';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOW = '2026-10-17T10:00:00Z';

/** Build a raw outbox row with sane defaults, overridable per test. */
function entry(overrides: Partial<SyncQueueEntry>): SyncQueueEntry {
  return {
    id: 'op-1',
    operationType: 'CREATE',
    entityType: 'answer',
    entityId: 'insp-1-item-7',
    payload: JSON.stringify({ inspectionId: 'insp-1', itemId: 'item-7' }),
    status: 'pending',
    attempts: 0,
    lastError: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as SyncQueueEntry;
}

// ── 1. Each real status maps to the acceptance-criteria icon + label ──────────

describe('SYNC_STATUS_META — the screen shows one icon/label per real status', () => {
  it('maps a synced operation to ✓ "Sincronizada" in the success color', () => {
    expect(SYNC_STATUS_META.synced).toEqual({ icon: '✓', label: 'Sincronizada', colorKey: 'success' });
  });

  it('maps a pending operation to ⏳ "Pendente"', () => {
    expect(SYNC_STATUS_META.pending).toMatchObject({ icon: '⏳', label: 'Pendente' });
  });

  it('maps a failed operation to ❌ "Falha" in the danger color', () => {
    expect(SYNC_STATUS_META.error).toEqual({ icon: '❌', label: 'Falha', colorKey: 'danger' });
  });

  it('maps a waiting (dependency) operation to ⚠️ "Aguardando"', () => {
    expect(SYNC_STATUS_META.waiting).toMatchObject({ icon: '⚠️', label: 'Aguardando' });
  });

  it('maps a version conflict to ⚠️ "Conflito de versão" in the danger color', () => {
    expect(SYNC_STATUS_META.conflict).toEqual({ icon: '⚠️', label: 'Conflito de versão', colorKey: 'danger' });
  });

  it('has a meta entry for every possible display status (no unrendered status)', () => {
    // Guards against a new SyncOperationDisplayStatus slipping in without copy.
    const statuses = Object.keys(SYNC_STATUS_META).sort();
    expect(statuses).toEqual(['conflict', 'error', 'pending', 'synced', 'waiting']);
  });
});

// ── 2. The row a technician sees reflects the REAL outbox status ──────────────

describe('operation rows reflect the real per-operation outcome', () => {
  it('renders a FAILED answer with the ❌ icon, "Falha" label and the server detail', () => {
    const [view] = mapOutboxToViews([
      entry({ status: 'error', lastError: 'Item not found for inspection' }),
    ]);
    const meta = SYNC_STATUS_META[view.displayStatus];

    expect(view.displayStatus).toBe('error');
    expect(meta.icon).toBe('❌');
    expect(meta.label).toBe('Falha');
    // The screen prints `Erro: ${operation.error}` — the real server detail.
    expect(view.error).toBe('Item not found for inspection');
  });

  it('renders a CONFLICT answer with the ⚠️ icon, "Conflito de versão" and its detail', () => {
    const [view] = mapOutboxToViews([
      entry({ status: 'conflict', lastError: 'Inspection version conflict: local=3, server=5' }),
    ]);
    const meta = SYNC_STATUS_META[view.displayStatus];

    expect(view.displayStatus).toBe('conflict');
    expect(meta.icon).toBe('⚠️');
    expect(meta.label).toBe('Conflito de versão');
    expect(view.error).toContain('server=5');
  });

  it('renders a SENT operation with the ✓ "Sincronizada" status', () => {
    const [view] = mapOutboxToViews([entry({ status: 'sent' })]);
    expect(SYNC_STATUS_META[view.displayStatus].label).toBe('Sincronizada');
  });
});

// ── 3. Header/banners/counters derived from the real state ────────────────────

describe('buildSyncScreenViewModel — header, banners and counters', () => {
  const answerSynced = (): SyncOperationView => ({
    id: 'a1', title: 'Resposta — Item item-7', entityType: 'answer',
    operationType: 'CREATE', entityId: 'insp-1-item-7', displayStatus: 'synced',
  });
  const answerError = (): SyncOperationView => ({
    id: 'a2', title: 'Resposta — Item item-8', entityType: 'answer',
    operationType: 'CREATE', entityId: 'insp-1-item-8', displayStatus: 'error',
    error: 'Timeout',
  });
  const photoError = (): SyncOperationView => ({
    id: 'e1', title: 'Foto — Item item-7', entityType: 'evidence',
    operationType: 'UPLOAD', entityId: 'ev-1', displayStatus: 'error', error: 'Upload falhou',
  });
  const ncConflict = (): SyncOperationView => ({
    id: 'n1', title: 'Não conformidade — Item item-7', entityType: 'non_conformity',
    operationType: 'CREATE', entityId: 'nc-1', displayStatus: 'conflict',
    error: 'local=3, server=5',
  });

  it('shows "Sincronizado" with the empty-state copy when the outbox is empty', () => {
    const vm = buildSyncScreenViewModel({ isOnline: true, isSyncing: false, pendingCount: 0, operations: [] });
    expect(vm.statusText).toBe('Sincronizado');
    expect(vm.emptyStateText).toBe('Nenhuma operação na fila de sincronização.');
    expect(vm.conflictBanner).toBeNull();
    expect(vm.offlineBanner).toBeNull();
    expect(vm.hasFailedOperations).toBe(false);
  });

  it('shows "Sincronizando…" and disables the button while a sync runs', () => {
    const vm = buildSyncScreenViewModel({ isOnline: true, isSyncing: true, pendingCount: 2, operations: [] });
    expect(vm.statusText).toBe('Sincronizando…');
    expect(vm.syncButtonLabel).toBe('Sincronizando…');
    expect(vm.syncDisabled).toBe(true);
  });

  it('shows "Pendências locais" with a singular pending label for one pending op', () => {
    const vm = buildSyncScreenViewModel({ isOnline: true, isSyncing: false, pendingCount: 1, operations: [] });
    expect(vm.statusText).toBe('Pendências locais');
    expect(vm.pendingLabel).toBe('1 operação pendente');
  });

  it('pluralizes the pending label for several pending ops', () => {
    const vm = buildSyncScreenViewModel({ isOnline: true, isSyncing: false, pendingCount: 3, operations: [] });
    expect(vm.pendingLabel).toBe('3 operações pendentes');
  });

  it('surfaces the offline banner and the "(offline)" button copy when offline', () => {
    const vm = buildSyncScreenViewModel({ isOnline: false, isSyncing: false, pendingCount: 1, operations: [] });
    expect(vm.offlineBanner).toContain('offline');
    expect(vm.syncButtonLabel).toBe('Sincronizar agora (offline)');
    expect(vm.syncDisabled).toBe(true);
  });

  it('counts failed photos and flags "Tentar novamente" when an op failed', () => {
    const vm = buildSyncScreenViewModel({
      isOnline: true, isSyncing: false, pendingCount: 2,
      operations: [answerSynced(), answerError(), photoError()],
    });
    // Only the evidence-in-error counts as a failed photo.
    expect(vm.failedPhotos).toBe(1);
    expect(vm.hasFailedOperations).toBe(true);
  });

  it('shows a singular conflict banner for one preserved conflict', () => {
    const vm = buildSyncScreenViewModel({
      isOnline: true, isSyncing: false, pendingCount: 1, operations: [ncConflict()],
    });
    expect(vm.conflictCount).toBe(1);
    expect(vm.conflictBanner).toBe('1 conflito de versão preservado no dispositivo.');
  });

  it('pluralizes the conflict banner for several conflicts', () => {
    const vm = buildSyncScreenViewModel({
      isOnline: true, isSyncing: false, pendingCount: 2,
      operations: [ncConflict(), { ...ncConflict(), id: 'n2' }],
    });
    expect(vm.conflictCount).toBe(2);
    expect(vm.conflictBanner).toBe('2 conflitos de versão preservados no dispositivo.');
  });

  it('reflects a realistic mixed outbox end to end (synced + error + conflict)', () => {
    const operations = [answerSynced(), answerError(), photoError(), ncConflict()];
    const vm = buildSyncScreenViewModel({ isOnline: true, isSyncing: false, pendingCount: 3, operations });

    // Header
    expect(vm.statusText).toBe('Pendências locais');
    // Counters a technician reads off the screen
    expect(vm.failedPhotos).toBe(1);
    expect(vm.hasFailedOperations).toBe(true);
    expect(vm.conflictCount).toBe(1);
    expect(vm.conflictBanner).toBe('1 conflito de versão preservado no dispositivo.');
    expect(vm.emptyStateText).toBeNull();
    // Each operation still carries the icon/label the row will render
    expect(operations.map((op) => SYNC_STATUS_META[op.displayStatus].label)).toEqual([
      'Sincronizada', 'Falha', 'Falha', 'Conflito de versão',
    ]);
  });
});
