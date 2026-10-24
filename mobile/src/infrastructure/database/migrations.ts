import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Each migration has a version number and SQL statements to run.
 * Migrations are run in order, only once, tracked by the _migrations table.
 */
interface Migration {
  version: number;
  description: string;
  /** Static SQL to run, or a function for migrations that must inspect the schema. */
  sql?: string;
  run?: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * Adds a column to a table only when it is not already present. SQLite has no
 * `ADD COLUMN IF NOT EXISTS`, and a device may already carry the column from a
 * schema created by an earlier app build, so we guard against the duplicate to
 * keep the migration idempotent (otherwise init fails with "duplicate column").
 */
async function addColumnIfMissing(
  db: SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (columns.some((entry) => entry.name === column)) return;
  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
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
  {
    version: 2,
    description: 'Add start-location and rejection metadata to inspections',
    sql: `
      ALTER TABLE inspections ADD COLUMN start_latitude REAL;
      ALTER TABLE inspections ADD COLUMN start_longitude REAL;
      ALTER TABLE inspections ADD COLUMN start_accuracy REAL;
      ALTER TABLE inspections ADD COLUMN rejection_reason TEXT;
      ALTER TABLE inspections ADD COLUMN rejected_by TEXT;
      ALTER TABLE inspections ADD COLUMN rejected_at TEXT;
    `,
  },
  {
    version: 3,
    description: 'PBI-044: evidence upload state (operation id, error, retries) + outbox dependencies',
    sql: `
      -- Evidence carries its own upload operation, so its status can be tracked
      -- independently from the answer (RN-078). last_error is persisted so a
      -- failed upload survives an app restart (RN-066) instead of living only in
      -- memory. response_id links the photo to the answer whose sync operation it
      -- depends on (RN-069). retry_count powers the "Tentar novamente" UX.
      ALTER TABLE evidences ADD COLUMN operation_id TEXT;
      ALTER TABLE evidences ADD COLUMN response_id TEXT;
      ALTER TABLE evidences ADD COLUMN last_error TEXT;
      ALTER TABLE evidences ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;

      -- Outbox dependencies: JSON array of operation ids that must be COMPLETED
      -- before this operation can run (RN-069). The photo upload depends on the
      -- answer operation, so the sync worker keeps it deferred until the answer
      -- is applied by the server.
      ALTER TABLE sync_queue ADD COLUMN dependency_ids TEXT NOT NULL DEFAULT '[]';
    `,
  },
  {
    version: 4,
    description: 'PBI-055: store server versions and conflict outbox status',
    sql: `
      ALTER TABLE inspections ADD COLUMN server_version INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    version: 5,
    description: 'PBI-041: store equipment QR code on inspection snapshot for offline confirmation',
    sql: `
      ALTER TABLE inspections ADD COLUMN equipment_qr_code TEXT;
    `,
  },
  {
    version: 6,
    description: 'Persist review comments delivered with the inspection snapshot',
    sql: `
      CREATE TABLE IF NOT EXISTS review_comments (
        id TEXT PRIMARY KEY NOT NULL, inspection_id TEXT NOT NULL, item_id TEXT NOT NULL,
        comment TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES inspection_items(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_review_comments_inspection_item ON review_comments(inspection_id, item_id);
    `,
  },
  {
    version: 7,
    description: 'PBI-086: store technician handwritten signature URI on inspection',
    sql: `
      -- signature_uri stores the SVG data URI (base64) or a local file path
      -- of the technician's handwritten signature captured at conclusion.
      -- signature_required mirrors the template's per-inspection setting; when
      -- 1 the conclusion flow blocks until a non-empty signature is provided.
      ALTER TABLE inspections ADD COLUMN signature_uri TEXT;
      ALTER TABLE inspections ADD COLUMN signature_required INTEGER NOT NULL DEFAULT 0;
    `,
  },
  {
    version: 8,
    description: 'PBI-045: persist inspection completion location (legacy completion_* columns)',
    // Kept for devices that already applied this migration on develop. The app now
    // standardises on the end_* columns (v9) that match the backend contract, but
    // dropping columns in SQLite is destructive, so these legacy columns are left
    // in place (nullable, unused) to avoid rewriting the table.
    sql: `
      ALTER TABLE inspections ADD COLUMN completion_latitude REAL;
      ALTER TABLE inspections ADD COLUMN completion_longitude REAL;
      ALTER TABLE inspections ADD COLUMN completion_accuracy REAL;
    `,
  },
  {
    version: 9,
    description: 'PBI-045: store conclusion GPS location and capture timestamps on inspections',
    // End-of-inspection location + capture timestamps (PBI-040 / PBI-045 / RN-062).
    // These end_* columns are the canonical ones the app reads/writes and mirror
    // the backend contract. Added defensively: a device may already carry end_*
    // from an earlier build, so each column is only added when missing to stay
    // idempotent (RN-059).
    run: async (db) => {
      await addColumnIfMissing(db, 'inspections', 'end_latitude', 'REAL');
      await addColumnIfMissing(db, 'inspections', 'end_longitude', 'REAL');
      await addColumnIfMissing(db, 'inspections', 'end_accuracy', 'REAL');
      await addColumnIfMissing(db, 'inspections', 'start_captured_at', 'TEXT');
      await addColumnIfMissing(db, 'inspections', 'end_captured_at', 'TEXT');
    },
  },
  {
    version: 10,
    description: 'Reconcile v3 outbox columns on devices with a drifted schema',
    // Some devices recorded v3 as applied without actually gaining its columns
    // (schema drift between earlier app builds), so enqueue fails with
    // "sync_queue has no column named dependency_ids". Re-add every v3 column
    // defensively; each is a no-op when already present (idempotent guard).
    run: async (db) => {
      await addColumnIfMissing(db, 'sync_queue', 'dependency_ids', "TEXT NOT NULL DEFAULT '[]'");
      await addColumnIfMissing(db, 'evidences', 'operation_id', 'TEXT');
      await addColumnIfMissing(db, 'evidences', 'response_id', 'TEXT');
      await addColumnIfMissing(db, 'evidences', 'last_error', 'TEXT');
      await addColumnIfMissing(db, 'evidences', 'retry_count', 'INTEGER NOT NULL DEFAULT 0');
    },
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

    if (migration.run) {
      await migration.run(db);
    } else if (migration.sql) {
      await db.execAsync(migration.sql);
    }
    await db.runAsync(
      'INSERT INTO _migrations (version, description) VALUES (?, ?)',
      migration.version,
      migration.description,
    );

    console.log(`[DB] Migration v${migration.version} applied: ${migration.description}`);
  }
}
