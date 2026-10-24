import type { SQLiteDatabase } from 'expo-sqlite';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSITION' | 'UPLOAD';
export type EntityType = 'inspection' | 'answer' | 'evidence' | 'non_conformity';
export type SyncOperationStatus = 'pending' | 'in_progress' | 'sent' | 'error' | 'conflict';

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
   * Count still-pending operations grouped by the inspection they belong to.
   *
   * An operation's entity_id points at the entity itself (answer/evidence/nc id)
   * or, for inspection transitions, at the inspection id. We resolve the owning
   * inspection by LEFT JOINing each child table on entity_id and coalescing to
   * the direct entity_id for inspection ops. Used to reconcile the per-inspection
   * pendingSyncCount against the real outbox after a sync, so the home counter
   * never stays stuck on a value that no longer matches the queue.
   */
  async countPendingByInspection(): Promise<Map<string, number>> {
    const rows = await this.db.getAllAsync<{ owning_inspection_id: string; count: number }>(
      `SELECT COALESCE(a.inspection_id, e.inspection_id, n.inspection_id, q.entity_id) AS owning_inspection_id,
              COUNT(*) AS count
         FROM sync_queue q
         LEFT JOIN answers a          ON q.entity_type = 'answer'          AND q.entity_id = a.id
         LEFT JOIN evidences e        ON q.entity_type = 'evidence'        AND q.entity_id = e.id
         LEFT JOIN non_conformities n ON q.entity_type = 'non_conformity'  AND q.entity_id = n.id
        WHERE q.status IN ('pending', 'error', 'in_progress', 'conflict')
        GROUP BY owning_inspection_id`,
    );
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (row.owning_inspection_id) counts.set(row.owning_inspection_id, row.count);
    }
    return counts;
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

  /** A server-version conflict is terminal until the technician resolves it. */
  async markConflict(id: string, detail: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE sync_queue SET status = 'conflict', last_error = ?, updated_at = datetime('now') WHERE id = ?",
      detail,
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
   * Move ALL failed operations back to pending so the next sync retries them.
   * Used by the "Tentar novamente" button on the sync screen when multiple
   * operations are stuck in error after a previous failed sync cycle.
   */
  async markAllPending(): Promise<void> {
    await this.db.runAsync(
      "UPDATE sync_queue SET status = 'pending', last_error = NULL, updated_at = datetime('now') WHERE status = 'error'",
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
