import { useEffect, useState } from 'react';

import { useDatabase } from '@/infrastructure/database/DatabaseProvider';
import { InspectionRepository } from '@/infrastructure/database/repositories';
import type { InspectionTemplate } from '@/features/fieldops/types';

/**
 * Loads the template snapshot for a specific inspection from SQLite.
 * Returns null if not found (no data has been synced yet).
 *
 * `isLoading` is derived by comparing which inspectionId has already been
 * resolved, so no setState is ever called synchronously inside an effect body
 * (avoids react-hooks/set-state-in-effect).
 */
export function useInspectionTemplate(inspectionId: string | undefined) {
  const db = useDatabase();
  const [template, setTemplate] = useState<InspectionTemplate | null>(null);
  // Tracks which inspectionId the current `template` value belongs to.
  // Starts undefined so isLoading is true when inspectionId is first provided.
  const [resolvedId, setResolvedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!db || !inspectionId) {
      return;
    }

    // Cancellation flag: if inspectionId or db changes before the async work
    // completes, the effect cleanup sets this to true and we skip the setState
    // calls — no stale updates, no synchronous setState in the effect body.
    let cancelled = false;
    const repo = new InspectionRepository(db);

    (async () => {
      try {
        const tpl = await repo.getTemplate(inspectionId);
        if (cancelled) return;
        setTemplate(tpl);
        setResolvedId(inspectionId);
      } catch (error) {
        console.warn('[useInspectionTemplate] Failed to load:', error);
        if (cancelled) return;
        setTemplate(null);
        setResolvedId(inspectionId);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [db, inspectionId]);

  return {
    template,
    // Still loading when we have an inspectionId but haven't resolved it yet.
    isLoading: !!inspectionId && resolvedId !== inspectionId,
  };
}
