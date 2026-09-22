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
  // Start as loading only when there is something to load; avoids a synchronous
  // setState inside the effect body (react-hooks/set-state-in-effect).
  const [isLoading, setIsLoading] = useState(!!inspectionId);

  useEffect(() => {
    if (!db || !inspectionId) {
      return;
    }

    setIsLoading(true);
    const repo = new InspectionRepository(db);
    (async () => {
      try {
        const tpl = await repo.getTemplate(inspectionId);
        setTemplate(tpl);
      } catch (error) {
        console.warn('[useInspectionTemplate] Failed to load:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [db, inspectionId]);

  return { template, isLoading };
}
