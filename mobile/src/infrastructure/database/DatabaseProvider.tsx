import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabase } from './index';

interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  isReady: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
});

/**
 * Provides the SQLite database instance to the component tree.
 * Waits for migrations before rendering children.
 */
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const database = await getDatabase();
        if (!cancelled) {
          console.log('[DB] Database initialized successfully');
          setDb(database);
          setIsReady(true);
        }
      } catch (error) {
        console.error('[DB] Failed to initialize database:', error);
        // Still mark as ready so the app doesn't hang — features degrade gracefully
        if (!cancelled) setIsReady(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady }}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Hook to access the SQLite database. Returns null while initializing.
 */
export function useDatabase(): SQLiteDatabase | null {
  const { db } = useContext(DatabaseContext);
  return db;
}

/**
 * Hook to check if the database is ready.
 */
export function useDatabaseReady(): boolean {
  const { isReady } = useContext(DatabaseContext);
  return isReady;
}
