import Database from 'better-sqlite3';

import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Minimal in-memory implementation of the subset of the expo-sqlite
 * `SQLiteDatabase` API used by the repositories, backed by better-sqlite3.
 *
 * This lets the PBI-044 tests run the REAL migrations + repository SQL in Node,
 * so the offline/outbox logic is validated end-to-end without a device.
 */
export function createInMemoryDb(): SQLiteDatabase {
  const db = new Database(':memory:');
  // Mirror the real app runtime (see infrastructure/database/index.ts), which
  // runs with foreign keys enforced.
  db.pragma('foreign_keys = ON');

  const adapter = {
    async execAsync(sql: string): Promise<void> {
      db.exec(sql);
    },

    async runAsync(sql: string, ...params: unknown[]): Promise<{ changes: number; lastInsertRowId: number }> {
      const stmt = db.prepare(sql);
      const info = stmt.run(...(params as never[]));
      return { changes: info.changes, lastInsertRowId: Number(info.lastInsertRowid) };
    },

    async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
      const stmt = db.prepare(sql);
      return stmt.all(...(params as never[])) as T[];
    },

    async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
      const stmt = db.prepare(sql);
      const row = stmt.get(...(params as never[]));
      return (row as T) ?? null;
    },

    // Not used by the repositories under test, but kept for completeness.
    async closeAsync(): Promise<void> {
      db.close();
    },
  };

  return adapter as unknown as SQLiteDatabase;
}
