import type { SQLiteDatabase } from 'expo-sqlite';

import type { ChecklistAnswer, ChecklistValue } from '@/features/fieldops/types';

// ─── Row type ──────────────────────────────────────────────────────────────────

interface AnswerRow {
  id: string;
  inspection_id: string;
  item_id: string;
  value: string;
  observation: string | null;
  saved_at: string;
  sync_status: string;
}

// ─── Repository ────────────────────────────────────────────────────────────────

export class AnswerRepository {
  constructor(private db: SQLiteDatabase) {}

  /**
   * Get all answers for an inspection, keyed by item ID.
   */
  async getByInspection(inspectionId: string): Promise<Record<string, ChecklistAnswer>> {
    const rows = await this.db.getAllAsync<AnswerRow>(
      'SELECT * FROM answers WHERE inspection_id = ?',
      inspectionId,
    );

    const result: Record<string, ChecklistAnswer> = {};
    for (const row of rows) {
      result[row.item_id] = this.mapRowToAnswer(row);
    }
    return result;
  }

  /**
   * Save or update an answer. Uses idempotent ID = `{inspectionId}-{itemId}`.
   */
  async save(inspectionId: string, itemId: string, value: ChecklistValue, observation?: string): Promise<void> {
    const id = `${inspectionId}-${itemId}`;
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);

    await this.db.runAsync(
      `INSERT OR REPLACE INTO answers (id, inspection_id, item_id, value, observation, saved_at, sync_status)
       VALUES (?, ?, ?, ?, ?, datetime('now'), 'pending')`,
      id,
      inspectionId,
      itemId,
      serializedValue,
      observation ?? null,
    );
  }

  /**
   * Get a single answer for a specific item.
   */
  async getByItem(inspectionId: string, itemId: string): Promise<ChecklistAnswer | null> {
    const row = await this.db.getFirstAsync<AnswerRow>(
      'SELECT * FROM answers WHERE inspection_id = ? AND item_id = ?',
      inspectionId,
      itemId,
    );
    return row ? this.mapRowToAnswer(row) : null;
  }

  /**
   * Count answered items for an inspection.
   */
  async countByInspection(inspectionId: string): Promise<number> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM answers WHERE inspection_id = ?',
      inspectionId,
    );
    return row?.count ?? 0;
  }

  /**
   * Get all answers pending sync.
   */
  async getPendingSync(): Promise<(AnswerRow & { inspectionId: string })[]> {
    const rows = await this.db.getAllAsync<AnswerRow>(
      "SELECT * FROM answers WHERE sync_status = 'pending' ORDER BY saved_at ASC",
    );
    return rows.map((row) => ({ ...row, inspectionId: row.inspection_id }));
  }

  /**
   * Mark answers as synced.
   */
  async markSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    await this.db.runAsync(
      `UPDATE answers SET sync_status = 'synced' WHERE id IN (${placeholders})`,
      ...ids,
    );
  }

  // ─── Mapper ────────────────────────────────────────────────────────────────

  private mapRowToAnswer(row: AnswerRow): ChecklistAnswer {
    let value: ChecklistValue = row.value;

    // Try to parse JSON values (booleans, numbers)
    try {
      const parsed = JSON.parse(row.value);
      if (typeof parsed === 'boolean' || typeof parsed === 'number') {
        value = parsed;
      }
    } catch {
      // Value is a plain string — keep as-is
    }

    return {
      itemId: row.item_id,
      value,
      observation: row.observation ?? undefined,
      savedAt: row.saved_at,
    };
  }
}
