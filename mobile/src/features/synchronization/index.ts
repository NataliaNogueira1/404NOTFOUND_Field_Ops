// Synchronization feature — sync-status screen state (PBI-054)
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: string;
  pendingCount: number;
  errorMessage?: string;
}

export { useSyncStatus, type SyncStatusData } from './useSyncStatus';
export {
  mapEntryToView,
  mapOutboxToViews,
  type SyncOperationView,
  type SyncOperationDisplayStatus,
} from './syncStatusMapping';
export {
  SYNC_STATUS_META,
  buildSyncScreenViewModel,
  type SyncStatusMeta,
  type SyncStatusColorKey,
  type SyncScreenInput,
  type SyncScreenViewModel,
} from './syncScreenView';
export { formatLastSync } from './formatLastSync';
