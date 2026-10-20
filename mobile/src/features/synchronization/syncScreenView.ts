import type { SyncOperationDisplayStatus, SyncOperationView } from './syncStatusMapping';

/**
 * Pure presentation layer for the sync screen (PBI-054 / #232 acceptance
 * criterion "a tela de sync reflete o resultado real").
 *
 * The `SyncScreen` component is a thin view over this module: it only maps the
 * values computed here to React Native elements. Keeping the labels/icons and
 * the derived banners/counters here lets us assert — with the project's
 * standard `.test.ts` + ts-jest/node setup — that the screen shows the REAL
 * per-operation outcome (synced/pending/error/waiting/conflict), without
 * booting a native React Native runtime.
 */

/** Theme color token used to paint a given status. */
export type SyncStatusColorKey = 'success' | 'warningDark' | 'danger';

export interface SyncStatusMeta {
  /** Acceptance-criteria icon shown next to the operation. */
  icon: string;
  /** Human-friendly pt-BR label. */
  label: string;
  /** Theme token so the color follows light/dark mode. */
  colorKey: SyncStatusColorKey;
}

/**
 * Maps each real outbox display status to the acceptance-criteria icon + copy.
 * This is the single source of truth shared by the screen and its tests, so a
 * label/icon can never drift between what is asserted and what is rendered.
 */
export const SYNC_STATUS_META: Record<SyncOperationDisplayStatus, SyncStatusMeta> = {
  synced: { icon: '✓', label: 'Sincronizada', colorKey: 'success' },
  pending: { icon: '⏳', label: 'Pendente', colorKey: 'warningDark' },
  error: { icon: '❌', label: 'Falha', colorKey: 'danger' },
  waiting: { icon: '⚠️', label: 'Aguardando', colorKey: 'warningDark' },
  conflict: { icon: '⚠️', label: 'Conflito de versão', colorKey: 'danger' },
};

/** The subset of {@link SyncStatusData} the screen needs to render its header. */
export interface SyncScreenInput {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  operations: SyncOperationView[];
}

/** Everything the screen renders, derived purely from the sync state. */
export interface SyncScreenViewModel {
  /** Big status line: "Sincronizando…" / "Pendências locais" / "Sincronizado". */
  statusText: string;
  /** "1 operação pendente" vs "N operações pendentes" (pt-BR plural). */
  pendingLabel: string;
  /** Sync button copy, reflecting syncing/offline state. */
  syncButtonLabel: string;
  /** Whether the sync button must be disabled (offline or already syncing). */
  syncDisabled: boolean;
  /** Count of evidence (photo) operations currently in error. */
  failedPhotos: number;
  /** Whether any operation failed — drives the "Tentar novamente" button. */
  hasFailedOperations: boolean;
  /** Count of operations preserved as a version conflict. */
  conflictCount: number;
  /** Conflict banner copy (pt-BR plural), or null when there is no conflict. */
  conflictBanner: string | null;
  /** Offline banner copy, or null when online. */
  offlineBanner: string | null;
  /** Empty-state copy when there is nothing in the outbox, or null otherwise. */
  emptyStateText: string | null;
}

/**
 * Builds the sync-screen view model from the real sync state. Mirrors exactly
 * what `SyncScreen` renders so a test on this function is a faithful check that
 * "a tela de sync reflete o resultado real".
 */
export function buildSyncScreenViewModel(input: SyncScreenInput): SyncScreenViewModel {
  const { isOnline, isSyncing, pendingCount, operations } = input;

  const statusText = isSyncing
    ? 'Sincronizando…'
    : pendingCount > 0
      ? 'Pendências locais'
      : 'Sincronizado';

  const pendingLabel =
    pendingCount === 1 ? '1 operação pendente' : `${pendingCount} operações pendentes`;

  const syncButtonLabel = isSyncing
    ? 'Sincronizando…'
    : isOnline
      ? 'Sincronizar agora'
      : 'Sincronizar agora (offline)';

  const failedPhotos = operations.filter(
    (op) => op.entityType === 'evidence' && op.displayStatus === 'error',
  ).length;
  const hasFailedOperations = operations.some((op) => op.displayStatus === 'error');
  const conflictCount = operations.filter((op) => op.displayStatus === 'conflict').length;

  const conflictBanner =
    conflictCount === 0
      ? null
      : conflictCount === 1
        ? '1 conflito de versão preservado no dispositivo.'
        : `${conflictCount} conflitos de versão preservados no dispositivo.`;

  const offlineBanner = isOnline
    ? null
    : 'Você está offline. As alterações serão sincronizadas quando a conexão voltar.';

  const emptyStateText =
    operations.length === 0 ? 'Nenhuma operação na fila de sincronização.' : null;

  return {
    statusText,
    pendingLabel,
    syncButtonLabel,
    syncDisabled: !isOnline || isSyncing,
    failedPhotos,
    hasFailedOperations,
    conflictCount,
    conflictBanner,
    offlineBanner,
    emptyStateText,
  };
}
