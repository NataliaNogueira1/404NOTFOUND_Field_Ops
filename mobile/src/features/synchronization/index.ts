// Synchronization feature — placeholder for future implementation
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: string;
  pendingCount: number;
  errorMessage?: string;
}
