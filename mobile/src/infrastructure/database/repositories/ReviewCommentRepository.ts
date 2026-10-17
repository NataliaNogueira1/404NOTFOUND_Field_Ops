import type { SQLiteDatabase } from 'expo-sqlite';
import type { ReviewComment } from '@/features/fieldops/types';

export class ReviewCommentRepository {
  constructor(private readonly db: SQLiteDatabase) {}
  async replaceForInspection(inspectionId: string, comments: ReviewComment[]): Promise<void> {
    await this.db.runAsync('DELETE FROM review_comments WHERE inspection_id = ?', inspectionId);
    for (const comment of comments) await this.db.runAsync('INSERT INTO review_comments (id, inspection_id, item_id, comment, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)', comment.id, comment.inspectionId, comment.itemId, comment.comment, comment.createdBy, comment.createdAt);
  }
  async getByInspection(inspectionId: string): Promise<ReviewComment[]> {
    const rows = await this.db.getAllAsync<{ id: string; inspection_id: string; item_id: string; comment: string; created_by: string; created_at: string }>('SELECT * FROM review_comments WHERE inspection_id = ? ORDER BY created_at', inspectionId);
    return rows.map(row => ({ id: row.id, inspectionId: row.inspection_id, itemId: row.item_id, comment: row.comment, createdBy: row.created_by, createdAt: row.created_at }));
  }
}
