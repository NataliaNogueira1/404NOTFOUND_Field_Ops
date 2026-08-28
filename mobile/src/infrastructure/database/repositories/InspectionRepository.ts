import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Inspection,
  InspectionTemplate,
  TemplateSection,
  TemplateItem,
} from '@/features/fieldops/types';

// ─── Row types (DB shape) ──────────────────────────────────────────────────────

interface InspectionRow {
  id: string;
  title: string;
  template_id: string;
  client_id: string;
  client_name: string;
  site_id: string;
  site_name: string;
  equipment_id: string;
  equipment_name: string;
  technician_id: string;
  supervisor_id: string;
  supervisor_name: string;
  status: string;
  priority: string;
  due_date: string;
  due_time: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  progress: number;
  supervisor_instructions: string | null;
  sync_status: string;
  pending_sync_count: number;
  updated_at: string;
}

interface SectionRow {
  id: string;
  inspection_id: string;
  title: string;
  sort_order: number;
}

interface ItemRow {
  id: string;
  section_id: string;
  inspection_id: string;
  question: string;
  description: string | null;
  response_type: string;
  required: number;
  require_observation_on_failure: number;
  require_evidence_on_failure: number;
  options: string | null;
  sort_order: number;
}

// ─── Repository ────────────────────────────────────────────────────────────────

export class InspectionRepository {
  constructor(private db: SQLiteDatabase) {}

  // ─── Inspections ───────────────────────────────────────────────────────────

  async getAll(): Promise<Inspection[]> {
    const rows = await this.db.getAllAsync<InspectionRow>(
      'SELECT * FROM inspections ORDER BY due_date ASC, due_time ASC',
    );
    return rows.map(this.mapRowToInspection);
  }

  async getByStatus(status: string): Promise<Inspection[]> {
    const rows = await this.db.getAllAsync<InspectionRow>(
      'SELECT * FROM inspections WHERE status = ? ORDER BY due_date ASC',
      status,
    );
    return rows.map(this.mapRowToInspection);
  }

  async getById(id: string): Promise<Inspection | null> {
    const row = await this.db.getFirstAsync<InspectionRow>(
      'SELECT * FROM inspections WHERE id = ?',
      id,
    );
    return row ? this.mapRowToInspection(row) : null;
  }

  async upsert(inspection: Inspection & {
    clientName: string;
    siteName: string;
    equipmentName: string;
    supervisorName: string;
  }): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO inspections (
        id, title, template_id, client_id, client_name, site_id, site_name,
        equipment_id, equipment_name, technician_id, supervisor_id, supervisor_name,
        status, priority, due_date, due_time, created_at, started_at, completed_at,
        progress, supervisor_instructions, sync_status, pending_sync_count, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      inspection.id,
      inspection.title,
      inspection.templateId,
      inspection.clientId,
      inspection.clientName,
      inspection.siteId,
      inspection.siteName,
      inspection.equipmentId,
      inspection.equipmentName,
      inspection.technicianId,
      inspection.supervisorId,
      inspection.supervisorName,
      inspection.status,
      inspection.priority,
      inspection.dueDate,
      inspection.dueTime ?? null,
      inspection.createdAt,
      inspection.startedAt ?? null,
      null, // completed_at
      inspection.progress,
      inspection.supervisorInstructions ?? null,
      inspection.syncStatus,
      inspection.pendingSyncCount,
    );
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE inspections SET status = ?, sync_status = ?, updated_at = datetime(\'now\') WHERE id = ?',
      status,
      'pending',
      id,
    );
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.db.runAsync(
      'UPDATE inspections SET progress = ?, updated_at = datetime(\'now\') WHERE id = ?',
      progress,
      id,
    );
  }

  async markStarted(id: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE inspections SET status = 'IN_PROGRESS', started_at = datetime('now'),
       sync_status = 'pending', updated_at = datetime('now') WHERE id = ?`,
      id,
    );
  }

  async markSubmitted(id: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE inspections SET status = 'SUBMITTED', completed_at = datetime('now'),
       progress = 100, sync_status = 'pending', updated_at = datetime('now') WHERE id = ?`,
      id,
    );
  }

  // ─── Sections & Items (template snapshot) ──────────────────────────────────

  async saveTemplate(inspectionId: string, template: InspectionTemplate): Promise<void> {
    // Delete existing sections/items for this inspection (in case of re-sync)
    await this.db.runAsync('DELETE FROM inspection_items WHERE inspection_id = ?', inspectionId);
    await this.db.runAsync('DELETE FROM inspection_sections WHERE inspection_id = ?', inspectionId);

    for (let sIdx = 0; sIdx < template.sections.length; sIdx++) {
      const section = template.sections[sIdx];
      await this.db.runAsync(
        'INSERT INTO inspection_sections (id, inspection_id, title, sort_order) VALUES (?, ?, ?, ?)',
        section.id,
        inspectionId,
        section.title,
        sIdx,
      );

      for (let iIdx = 0; iIdx < section.items.length; iIdx++) {
        const item = section.items[iIdx];
        await this.db.runAsync(
          `INSERT INTO inspection_items (
            id, section_id, inspection_id, question, description, response_type,
            required, require_observation_on_failure, require_evidence_on_failure, options, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          item.id,
          section.id,
          inspectionId,
          item.question,
          item.description ?? null,
          item.responseType,
          item.required ? 1 : 0,
          item.requireObservationOnFailure ? 1 : 0,
          item.requireEvidenceOnFailure ? 1 : 0,
          item.options ? JSON.stringify(item.options) : null,
          iIdx,
        );
      }
    }
  }

  async getTemplate(inspectionId: string): Promise<InspectionTemplate | null> {
    const sections = await this.db.getAllAsync<SectionRow>(
      'SELECT * FROM inspection_sections WHERE inspection_id = ? ORDER BY sort_order',
      inspectionId,
    );

    if (sections.length === 0) return null;

    const items = await this.db.getAllAsync<ItemRow>(
      'SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY sort_order',
      inspectionId,
    );

    const templateSections: TemplateSection[] = sections.map((sec) => ({
      id: sec.id,
      title: sec.title,
      items: items
        .filter((it) => it.section_id === sec.id)
        .map(this.mapRowToItem),
    }));

    return {
      id: `tpl-${inspectionId}`,
      title: '',
      category: '',
      version: 1,
      sections: templateSections,
    };
  }

  async getAllItems(inspectionId: string): Promise<TemplateItem[]> {
    const items = await this.db.getAllAsync<ItemRow>(
      'SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY sort_order',
      inspectionId,
    );
    return items.map(this.mapRowToItem);
  }

  // ─── Counts ────────────────────────────────────────────────────────────────

  async countByStatus(status: string): Promise<number> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM inspections WHERE status = ?',
      status,
    );
    return row?.count ?? 0;
  }

  async countOverdue(): Promise<number> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM inspections
       WHERE due_date < date('now') AND status IN ('ASSIGNED', 'IN_PROGRESS')`,
    );
    return row?.count ?? 0;
  }

  async countPendingSync(): Promise<number> {
    const row = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM inspections WHERE sync_status = 'pending'",
    );
    return row?.count ?? 0;
  }

  // ─── Mappers ───────────────────────────────────────────────────────────────

  private mapRowToInspection = (row: InspectionRow): Inspection => ({
    id: row.id,
    title: row.title,
    templateId: row.template_id,
    clientId: row.client_id,
    clientName: row.client_name,
    siteId: row.site_id,
    siteName: row.site_name,
    equipmentId: row.equipment_id,
    equipmentName: row.equipment_name,
    technicianId: row.technician_id,
    supervisorId: row.supervisor_id,
    supervisorName: row.supervisor_name,
    status: row.status as Inspection['status'],
    priority: row.priority as Inspection['priority'],
    dueDate: row.due_date,
    dueTime: row.due_time ?? '',
    createdAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    progress: row.progress,
    overdue: row.due_date < new Date().toISOString().split('T')[0] &&
      ['ASSIGNED', 'IN_PROGRESS'].includes(row.status),
    syncStatus: row.sync_status as Inspection['syncStatus'],
    pendingSyncCount: row.pending_sync_count,
    supervisorInstructions: row.supervisor_instructions ?? '',
  });

  private mapRowToItem = (row: ItemRow): TemplateItem => ({
    id: row.id,
    question: row.question,
    description: row.description ?? undefined,
    responseType: row.response_type as TemplateItem['responseType'],
    required: row.required === 1,
    requireObservationOnFailure: row.require_observation_on_failure === 1,
    requireEvidenceOnFailure: row.require_evidence_on_failure === 1,
    options: row.options ? JSON.parse(row.options) : undefined,
  });
}
