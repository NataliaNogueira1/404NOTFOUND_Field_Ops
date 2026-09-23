import { useCallback, useEffect, useRef, useState } from 'react';

import { useFieldOps } from '@/features/fieldops';
import { useConnectivity } from '@/infrastructure/connectivity';
import { useDatabase } from '@/infrastructure/database/DatabaseProvider';
import {
  SyncQueueRepository,
  SyncMetadataRepository,
} from '@/infrastructure/database/repositories';

import { mapOutboxToViews, type SyncOperationView } from './syncStatusMapping';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SyncStatusData {
  /** Whether the device currently has connectivity (drives the offline banner). */
  isOnline: boolean;
  /** Whether a sync cycle is currently running (blocks concurrent triggers). */
  isSyncing: boolean;
  /** ISO timestamp of the last SUCCESSFUL sync, or null when it never succeeded. */
  lastSuccessfulSyncAt: string | null;
  /** Count of operations that still need syncing (pending + error), from the DB. */
  pendingCount: number;
  /** Every outbox operation, most recent first, mapped for display. */
  operations: SyncOperationView[];
  /** Last sync error surfaced by the sync service, if any. */
  lastSyncError: string | null;
  /** Reload the outbox + metadata from SQLite. */
  refresh: () => Promise<void>;
  /** Trigger the existing sync mechanism (no-op while offline or already syncing). */
  triggerSync: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Reads the REAL synchronization state for the sync screen:
 * - the outbox (`sync_queue`) as the single source of truth for operations and
 *   the pending count (RN-071) — never a UI-only counter;
 * - the last successful sync timestamp from `sync_metadata` (RN-072), which
 *   survives an app restart (RN-066);
 * - live connectivity from the global {@link useConnectivity} provider;
 * - the existing sync mechanism via {@link useFieldOps}, so the button just
 *   triggers it (no second sync implementation).
 *
 * The screen re-reads the outbox after every sync and while a sync is running
 * (light polling) so state changes (PENDING → SYNCED/FAILED) are reflected.
 */
export function useSyncStatus(): SyncStatusData {
  const db = useDatabase();
  const { isOnline } = useConnectivity();
  const { syncNow, isSyncing, lastSyncError } = useFieldOps();

  const [operations, setOperations] = useState<SyncOperationView[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState<string | null>(null);

  const isSyncingRef = useRef(isSyncing);
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  // Reads the outbox + metadata from SQLite and returns a snapshot. Pure of any
  // setState so it can be called both from effects (subscription style) and from
  // the public `refresh`, without triggering the "setState in effect" lint rule.
  const readSnapshot = useCallback(async (): Promise<{
    operations: SyncOperationView[];
    pendingCount: number;
    lastSuccessfulSyncAt: string | null;
  } | null> => {
    if (!db) return null;
    const queueRepo = new SyncQueueRepository(db);
    const metadataRepo = new SyncMetadataRepository(db);

    const [entries, count, lastSync] = await Promise.all([
      queueRepo.getAll(),
      queueRepo.countPending(),
      metadataRepo.getLastSuccessfulSync(),
    ]);

    return {
      operations: mapOutboxToViews(entries),
      pendingCount: count,
      lastSuccessfulSyncAt: lastSync,
    };
  }, [db]);

  const applySnapshot = useCallback(
    (snapshot: NonNullable<Awaited<ReturnType<typeof readSnapshot>>>) => {
      setOperations(snapshot.operations);
      setPendingCount(snapshot.pendingCount);
      setLastSuccessfulSyncAt(snapshot.lastSuccessfulSyncAt);
    },
    [],
  );

  const refresh = useCallback(async () => {
    const snapshot = await readSnapshot();
    if (snapshot) applySnapshot(snapshot);
  }, [readSnapshot, applySnapshot]);

  // Initial load + reload whenever a sync cycle finishes. Uses a cancel flag so
  // state is only applied from the async callback (subscription style), not
  // synchronously in the effect body.
  useEffect(() => {
    let cancelled = false;
    readSnapshot()
      .then((snapshot) => {
        if (!cancelled && snapshot) applySnapshot(snapshot);
      })
      .catch((error) => console.warn('[useSyncStatus] refresh failed:', error));
    return () => {
      cancelled = true;
    };
  }, [readSnapshot, applySnapshot, isSyncing]);

  // Light polling only WHILE a sync is running, so PENDING → SYNCED/FAILED
  // transitions are reflected without a heavy always-on interval.
  useEffect(() => {
    if (!isSyncing) return;
    let cancelled = false;
    const interval = setInterval(() => {
      readSnapshot()
        .then((snapshot) => {
          if (!cancelled && snapshot) applySnapshot(snapshot);
        })
        .catch(() => undefined);
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isSyncing, readSnapshot, applySnapshot]);

  const triggerSync = useCallback(async () => {
    // Guard rails: never sync while offline (nothing to gain, avoids useless
    // failures) and never start a second concurrent sync (RN-068).
    if (!isOnline || isSyncingRef.current) return;
    await syncNow();
    await refresh();
  }, [isOnline, syncNow, refresh]);

  return {
    isOnline,
    isSyncing,
    lastSuccessfulSyncAt,
    pendingCount,
    operations,
    lastSyncError,
    refresh,
    triggerSync,
  };
}
