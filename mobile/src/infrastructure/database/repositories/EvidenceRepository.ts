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
   * Add a new evidence record.
   */
  async add(evidence: Evidence): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO evidences (id, inspection_id, item_id, description, uri, captured_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      evidence.id,
      evidence.inspectionId,
      evidence.itemId,
      evidence.description,
      evidence.uri ?? null,
      evidence.capturedAt,
      evidence.syncStatus,
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
   * Mark evidences as synced.
   */
  async markSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.db.runAsync(
      `UPDATE evidences SET sync_status = 'synced' WHERE id IN (${placeholders})`,
      ...ids,
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
  });
}
