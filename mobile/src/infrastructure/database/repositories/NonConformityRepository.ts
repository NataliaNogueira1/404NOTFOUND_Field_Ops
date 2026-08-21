import type { SQLiteDatabase } from 'expo-sqlite';

import type { NonConformity, Severity } from '@/features/fieldops/types';

// ─── Row type ──────────────────────────────────────────────────────────────────

interface NonConformityRow {
  id: string;
  inspection_id: string;
  item_id: string;
  title: string;
  description: string;
  severity: string;
  evidence_count: number;
  sync_status: string;
}

// ─── Repository ────────────────────────────────────────────────────────────────

export class NonConformityRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Get all non-conformities for an inspection.
   */
  async getByInspection(inspectionId: string): Promise<NonConformity[]> {
    const rows = await this.db.getAllAsync<NonConformityRow>(
      'SELECT * FROM non_conformities WHERE inspection_id = ?',
      inspectionId,
    );
    return rows.map(this.mapRowToNonConformity);
  }

  /**
   * Add a new non-conformity. Skips if already exists for same inspection + item.
   */
  async add(nc: NonConformity): Promise<void> {
    // Check if one already exists for this inspection/item combo
    const existing = await this.db.getFirstAsync<{ id: string }>(
      'SELECT id FROM non_conformities WHERE inspection_id = ? AND item_id = ?',
      nc.inspectionId,
      nc.itemId,
    );
    if (existing) return;

    await this.db.runAsync(
      `INSERT INTO non_conformities (id, inspection_id, item_id, title, description, severity, evidence_count, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      nc.id,
      nc.inspectionId,
      nc.itemId,
      nc.title,
      nc.description,
      nc.severity,
      nc.evidenceCount,
    );
  }

  /**
   * Update evidence count for a non-conformity.
   */
  async incrementEvidenceCount(inspectionId: string, itemId: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE non_conformities SET evidence_count = evidence_count + 1 WHERE inspection_id = ? AND item_id = ?',
      inspectionId,
      itemId,
    );
  }

  /**
   * Get all non-conformities pending sync.
   */
  async getPendingSync(): Promise<NonConformity[]> {
    const rows = await this.db.getAllAsync<NonConformityRow>(
      "SELECT * FROM non_conformities WHERE sync_status = 'pending'",
    );
    return rows.map(this.mapRowToNonConformity);
  }

  /**
   * Mark non-conformities as synced.
   */
  async markSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.db.runAsync(
      `UPDATE non_conformities SET sync_status = 'synced' WHERE id IN (${placeholders})`,
      ...ids,
    );
  }

  // ─── Mapper ────────────────────────────────────────────────────────────────

  private mapRowToNonConformity = (row: NonConformityRow): NonConformity => ({
    id: row.id,
    inspectionId: row.inspection_id,
    itemId: row.item_id,
    title: row.title,
    description: row.description,
    severity: row.severity as Severity,
    evidenceCount: row.evidence_count,
  });
}
