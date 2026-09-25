import type { SQLiteDatabase } from 'expo-sqlite';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSITION' | 'UPLOAD';
export type EntityType = 'inspection' | 'answer' | 'evidence' | 'non_conformity';
export type SyncOperationStatus = 'pending' | 'in_progress' | 'sent' | 'error';

export interface SyncQueueEntry {
  id: string;
  operationType: OperationType;
  entityType: EntityType;
  entityId: string;
  payload: string;
  status: SyncOperationStatus;
  attempts: number;
  lastError: string | null;
  dependencyIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface SyncQueueRow {
  id: string;
  operation_type: string;
  entity_type: string;
  entity_id: string;
  payload: string;
  status: string;
  attempts: number;
  last_error: string | null;
  dependency_ids: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Repository ────────────────────────────────────────────────────────────────

export class SyncQueueRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Enqueue a new operation for sync.
   *
   * @param dependencyIds operation ids that must be applied before this one runs
   *        (RN-069). Used to keep a photo UPLOAD deferred until its answer op is
   *        COMPLETED.
   */
  async enqueue(
    id: string,
    operationType: OperationType,
    entityType: EntityType,
    entityId: string,
    payload: unknown,
    dependencyIds: string[] = [],
  ): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO sync_queue (id, operation_type, entity_type, entity_id, payload, status, attempts, dependency_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, datetime('now'), datetime('now'))`,
      id,
      operationType,
      entityType,
      entityId,
      JSON.stringify(payload),
      JSON.stringify(dependencyIds),
    );
  }

  /**
   * Get all pending operations in order.
   */
  async getPending(limit = 50): Promise<SyncQueueEntry[]> {
    const rows = await this.db.getAllAsync<SyncQueueRow>(
      "SELECT * FROM sync_queue WHERE status IN ('pending', 'error') ORDER BY created_at ASC LIMIT ?",
      limit,
    );
    return rows.map(this.mapRowToEntry);
  }

  /**
   * Get pending operations that are ready to run: every dependency has already
   * left the queue as COMPLETED. A dependency is considered satisfied when it is
   * no longer sitting in the queue as pending/in_progress/error (i.e. it was
   * applied and cleaned up, or was never enqueued). An operation whose answer
   * dependency is still pending/failed stays deferred (RN-069).
   */
  async getReady(limit = 50): Promise<SyncQueueEntry[]> {
    const pending = await this.getPending(limit);
    if (pending.length === 0) return [];

    // Collect ids of operations still "blocking": anything not yet applied.
    const blockingRows = await this.db.getAllAsync<{ id: string }>(
      "SELECT id FROM sync_queue WHERE status IN ('pending', 'in_progress', 'error')",
    );
    const blocking = new Set(blockingRows.map((row) => row.id));

    return pending.filter((op) =>
      op.dependencyIds.every((depId) => !blocking.has(depId)),
    );
  }

  /**
   * Get count of pending operations.
   */
  async countPending(): Promise<number> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sync_queue WHERE status IN ('pending', 'error')",
    );
    return row?.count ?? 0;
  }

  /**
   * Mark an operation as successfully sent.
   */
  async markSent(id: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE sync_queue SET status = 'sent', last_error = NULL, updated_at = datetime('now') WHERE id = ?",
      id,
    );
  }

  /**
   * Mark an operation as failed with error.
   */
  async markError(id: string, error: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE sync_queue SET status = 'error', last_error = ?, attempts = attempts + 1, updated_at = datetime('now') WHERE id = ?",
      error,
      id,
    );
  }

  /**
   * Mark an operation as in progress.
   */
  async markInProgress(id: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE sync_queue SET status = 'in_progress', updated_at = datetime('now') WHERE id = ?",
      id,
    );
  }

  /**
   * Move an operation back to pending (used by "Tentar novamente"). Clears the
   * error so the sync worker will pick it up again.
   */
  async markPending(id: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE sync_queue SET status = 'pending', last_error = NULL, updated_at = datetime('now') WHERE id = ?",
      id,
    );
  }

  /**
   * Remove successfully sent operations (cleanup).
   */
  async removeSent(): Promise<void> {
    await this.db.runAsync("DELETE FROM sync_queue WHERE status = 'sent'");
  }

  /**
   * Get all operations for display in the sync screen.
   */
  async getAll(): Promise<SyncQueueEntry[]> {
    const rows = await this.db.getAllAsync<SyncQueueRow>(
      'SELECT * FROM sync_queue ORDER BY created_at DESC LIMIT 100',
    );
    return rows.map(this.mapRowToEntry);
  }

  // ─── Mapper ────────────────────────────────────────────────────────────────

  private mapRowToEntry = (row: SyncQueueRow): SyncQueueEntry => ({
    id: row.id,
    operationType: row.operation_type as OperationType,
    entityType: row.entity_type as EntityType,
    entityId: row.entity_id,
    payload: row.payload,
    status: row.status as SyncOperationStatus,
    attempts: row.attempts,
    lastError: row.last_error,
    dependencyIds: this.parseDependencies(row.dependency_ids),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  private parseDependencies(raw: string | null): string[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }
}
