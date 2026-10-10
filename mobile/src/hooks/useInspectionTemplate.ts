import { useEffect, useState } from 'react';

import { useDatabase } from '@/infrastructure/database/DatabaseProvider';
import { InspectionRepository } from '@/infrastructure/database/repositories';
import type { InspectionTemplate } from '@/features/fieldops/types';

/**
 * Loads the template snapshot for a specific inspection from SQLite.
 * Returns null if not found (no data has been synced yet).
 */
export function useInspectionTemplate(inspectionId: string | undefined) {
  const db = useDatabase();
  const [template, setTemplate] = useState<InspectionTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!db || !inspectionId) {
        if (!cancelled) {
          setTemplate(null);
          setIsLoading(false);
        }
        return;
      }

      const repo = new InspectionRepository(db);
      try {
        const tpl = await repo.getTemplate(inspectionId);
        if (!cancelled) setTemplate(tpl);
      } catch (error) {
        console.warn('[useInspectionTemplate] Failed to load:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [db, inspectionId]);

  return { template, isLoading };
}
