import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Small key/value store backed by the existing `sync_metadata` table
 * (see migration v1). It persists cross-session sync metadata so information
 * survives an app restart (RN-066/RN-072) — most importantly the timestamp of
 * the last *successful* sync.
 *
 * No new table/migration is required: the `sync_metadata` table already exists
 * with columns (key, value, updated_at) and was previously unused.
 */

/** Well-known metadata keys. Kept here so callers don't hardcode strings. */
export const SyncMetadataKeys = {
  /** ISO timestamp of the last sync that finished with NO errors (RN-072). */
  LAST_SUCCESSFUL_SYNC: 'last_successful_sync',
} as const;

export class SyncMetadataRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Read a metadata value by key, or `null` when it was never written.
   */
  async get(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      key,
    );
    return row?.value ?? null;
  }

  /**
   * Upsert a metadata value, refreshing `updated_at`.
   */
  async set(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO sync_metadata (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      key,
      value,
    );
  }

  /**
   * ISO timestamp of the last *successful* sync, or `null` if it never
   * completed successfully. This is the value the sync screen shows as
   * "última sincronização" — it must reflect the last success, NOT the last
   * attempt (RN-072).
   */
  async getLastSuccessfulSync(): Promise<string | null> {
    return this.get(SyncMetadataKeys.LAST_SUCCESSFUL_SYNC);
  }

  /**
   * Record that a sync finished successfully at the given instant. Defaults to
   * "now" when no timestamp is provided.
   */
  async setLastSuccessfulSync(isoTimestamp: string = new Date().toISOString()): Promise<void> {
    await this.set(SyncMetadataKeys.LAST_SUCCESSFUL_SYNC, isoTimestamp);
  }
}
