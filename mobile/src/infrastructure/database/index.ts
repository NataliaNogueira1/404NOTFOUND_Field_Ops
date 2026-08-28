import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';

// Use a global to survive hot reloads (module-level vars are reset on HMR)
const globalRef = globalThis as unknown as { __fieldops_db?: SQLite.SQLiteDatabase };

/**
 * Opens (or reuses) the FieldOps local database and runs any pending migrations.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (globalRef.__fieldops_db) return globalRef.__fieldops_db;

  const db = await SQLite.openDatabaseAsync('fieldops.db');

  // Enable WAL mode for better concurrency
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await runMigrations(db);

  globalRef.__fieldops_db = db;
  return db;
}

/**
 * Closes the database connection. Useful for tests or cleanup.
 */
export async function closeDatabase(): Promise<void> {
  if (globalRef.__fieldops_db) {
    await globalRef.__fieldops_db.closeAsync();
    globalRef.__fieldops_db = undefined;
  }
}
