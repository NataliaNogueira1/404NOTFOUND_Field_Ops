// Local database — placeholder for SQLite/WatermelonDB integration
// Install expo-sqlite or @nozbe/watermelondb when ready

export interface DatabaseAdapter {
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
  execute: (sql: string, params?: unknown[]) => Promise<void>;
}

// Stub implementation — replace with real adapter
export const db: DatabaseAdapter = {
  query: async <T>(_sql: string, _params?: unknown[]): Promise<T[]> => {
    console.warn('Database not yet configured. Install expo-sqlite.');
    return [];
  },
  execute: async (_sql: string, _params?: unknown[]) => {
    console.warn('Database not yet configured. Install expo-sqlite.');
  },
};
