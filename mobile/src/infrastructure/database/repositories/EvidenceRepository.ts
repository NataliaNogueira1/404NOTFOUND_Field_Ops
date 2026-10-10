import type { SQLiteDatabase } from 'expo-sqlite';

import type { Evidence, SyncStatus } from '@/features/fieldops/types';

// ─── Row type ──────────────────────────────────────────────────────────────────

interface EvidenceRow {
  id: string;
  inspection_id: string;
  item_id: string;
  description: string;
  uri: string | null;
  captured_at: string;
  sync_status: string;
  operation_id: string | null;
  response_id: string | null;
  last_error: string | null;
  retry_count: number | null;
}

// ─── Repository ────────────────────────────────────────────────────────────────

export class EvidenceRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Get all evidences for an inspection.
   */
  async getByInspection(inspectionId: string): Promise<Evidence[]> {
    const rows = await this.db.getAllAsync<EvidenceRow>(
      'SELECT * FROM evidences WHERE inspection_id = ? ORDER BY captured_at DESC',
      inspectionId,
    );
    return rows.map(this.mapRowToEvidence);
  }

  /**
   * Get evidences for a specific item.
   */
  async getByItem(inspectionId: string, itemId: string): Promise<Evidence[]> {
    const rows = await this.db.getAllAsync<EvidenceRow>(
      'SELECT * FROM evidences WHERE inspection_id = ? AND item_id = ? ORDER BY captured_at DESC',
      inspectionId,
      itemId,
    );
    return rows.map(this.mapRowToEvidence);
  }

  /**
   * Get a single evidence by id.
   */
  async getById(id: string): Promise<Evidence | null> {
    const row = await this.db.getFirstAsync<EvidenceRow>(
      'SELECT * FROM evidences WHERE id = ?',
      id,
    );
    return row ? this.mapRowToEvidence(row) : null;
  }

  /**
   * Add a new evidence record.
   */
  async add(evidence: Evidence): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO evidences (id, inspection_id, item_id, description, uri, captured_at, sync_status, operation_id, response_id, last_error, retry_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      evidence.id,
      evidence.inspectionId,
      evidence.itemId,
      evidence.description,
      evidence.uri ?? null,
      evidence.capturedAt,
      evidence.syncStatus,
      evidence.operationId ?? null,
      evidence.responseId ?? null,
      evidence.lastError ?? null,
      evidence.retryCount ?? 0,
    );
  }

  /**
   * Count evidences for an item.
   */
  async countByItem(inspectionId: string, itemId: string): Promise<number> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM evidences WHERE inspection_id = ? AND item_id = ?',
      inspectionId,
      itemId,
    );
    return row?.count ?? 0;
  }

  /**
   * Get all evidences pending sync.
   */
  async getPendingSync(): Promise<Evidence[]> {
    const rows = await this.db.getAllAsync<EvidenceRow>(
      "SELECT * FROM evidences WHERE sync_status = 'pending' ORDER BY captured_at ASC",
    );
    return rows.map(this.mapRowToEvidence);
  }

  /**
   * Mark evidences as synced (server confirmed the upload — APPLIED).
   * Clears any previous error.
   */
  async markSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.db.runAsync(
      `UPDATE evidences SET sync_status = 'synced', last_error = NULL WHERE id IN (${placeholders})`,
      ...ids,
    );
  }

  /**
   * Mark a single evidence as synced by its id.
   */
  async markSyncedById(id: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE evidences SET sync_status = 'synced', last_error = NULL WHERE id = ?",
      id,
    );
  }

  /**
   * Mark an evidence upload as failed. The local file/uri is never touched here,
   * so the photo remains available for preview and retry (RN-047). The error is
   * persisted so it survives an app restart (RN-066).
   */
  async markFailed(id: string, error: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE evidences SET sync_status = 'error', last_error = ? WHERE id = ?",
      error,
      id,
    );
  }

  /**
   * Move an evidence back to pending (used by "Tentar novamente"): clears the
   * error and bumps the retry counter. Reuses the existing file/uri — no new
   * capture, no duplicate row.
   */
  async markPending(id: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE evidences SET sync_status = 'pending', last_error = NULL, retry_count = retry_count + 1 WHERE id = ?",
      id,
    );
  }

  // ─── Mapper ────────────────────────────────────────────────────────────────

  private mapRowToEvidence = (row: EvidenceRow): Evidence => ({
    id: row.id,
    inspectionId: row.inspection_id,
    itemId: row.item_id,
    description: row.description,
    uri: row.uri ?? undefined,
    capturedAt: row.captured_at,
    syncStatus: row.sync_status as SyncStatus,
    operationId: row.operation_id ?? undefined,
    responseId: row.response_id ?? undefined,
    lastError: row.last_error ?? undefined,
    retryCount: row.retry_count ?? 0,
  });
}
