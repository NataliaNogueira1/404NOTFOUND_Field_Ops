import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Each migration has a version number and SQL statements to run.
 * Migrations are run in order, only once, tracked by the _migrations table.
 */
interface Migration {
  version: number;
  description: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Create core tables for offline inspections',
    sql: `
      -- Inspections synced from API
      CREATE TABLE IF NOT EXISTS inspections (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        template_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        site_id TEXT NOT NULL,
        site_name TEXT NOT NULL,
        equipment_id TEXT NOT NULL,
        equipment_name TEXT NOT NULL,
        technician_id TEXT NOT NULL,
        supervisor_id TEXT NOT NULL,
        supervisor_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ASSIGNED',
        priority TEXT NOT NULL DEFAULT 'MEDIUM',
        due_date TEXT NOT NULL,
        due_time TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        progress INTEGER NOT NULL DEFAULT 0,
        supervisor_instructions TEXT,
        sync_status TEXT NOT NULL DEFAULT 'synced',
        pending_sync_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Template sections (snapshot at time of assignment)
      CREATE TABLE IF NOT EXISTS inspection_sections (
        id TEXT PRIMARY KEY NOT NULL,
        inspection_id TEXT NOT NULL,
        title TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
      );

      -- Template items (snapshot at time of assignment)
      CREATE TABLE IF NOT EXISTS inspection_items (
        id TEXT PRIMARY KEY NOT NULL,
        section_id TEXT NOT NULL,
        inspection_id TEXT NOT NULL,
        question TEXT NOT NULL,
        description TEXT,
        response_type TEXT NOT NULL,
        required INTEGER NOT NULL DEFAULT 1,
        require_observation_on_failure INTEGER NOT NULL DEFAULT 0,
        require_evidence_on_failure INTEGER NOT NULL DEFAULT 0,
        options TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (section_id) REFERENCES inspection_sections(id) ON DELETE CASCADE,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
      );

      -- Technician answers (saved locally, synced later)
      CREATE TABLE IF NOT EXISTS answers (
        id TEXT PRIMARY KEY NOT NULL,
        inspection_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        value TEXT NOT NULL,
        observation TEXT,
        saved_at TEXT NOT NULL DEFAULT (datetime('now')),
        sync_status TEXT NOT NULL DEFAULT 'pending',
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES inspection_items(id) ON DELETE CASCADE
      );

      -- Evidences (photos, documents)
      CREATE TABLE IF NOT EXISTS evidences (
        id TEXT PRIMARY KEY NOT NULL,
        inspection_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        description TEXT NOT NULL,
        uri TEXT,
        captured_at TEXT NOT NULL DEFAULT (datetime('now')),
        sync_status TEXT NOT NULL DEFAULT 'pending',
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES inspection_items(id) ON DELETE CASCADE
      );

      -- Non-conformities detected during inspection
      CREATE TABLE IF NOT EXISTS non_conformities (
        id TEXT PRIMARY KEY NOT NULL,
        inspection_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'MEDIUM',
        evidence_count INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES inspection_items(id) ON DELETE CASCADE
      );

      -- Outbox: operations waiting to be sent to the API
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY NOT NULL,
        operation_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Metadata for sync cursors
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
      CREATE INDEX IF NOT EXISTS idx_inspections_technician ON inspections(technician_id);
      CREATE INDEX IF NOT EXISTS idx_answers_inspection ON answers(inspection_id);
      CREATE INDEX IF NOT EXISTS idx_answers_item ON answers(item_id);
      CREATE INDEX IF NOT EXISTS idx_evidences_inspection ON evidences(inspection_id);
      CREATE INDEX IF NOT EXISTS idx_non_conformities_inspection ON non_conformities(inspection_id);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    `,
  },
];

/**
 * Runs pending migrations. Uses a _migrations table to track what's been applied.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Create migrations tracking table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      description TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Get already-applied versions
  const applied = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM _migrations ORDER BY version',
  );
  const appliedVersions = new Set(applied.map((row) => row.version));

  // Run pending migrations in order
  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue;

    await db.execAsync(migration.sql);
    await db.runAsync(
      'INSERT INTO _migrations (version, description) VALUES (?, ?)',
      migration.version,
      migration.description,
    );

    console.log(`[DB] Migration v${migration.version} applied: ${migration.description}`);
  }
}
