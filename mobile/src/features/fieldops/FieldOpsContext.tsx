import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/features/auth';
import { useDatabase } from '@/infrastructure/database/DatabaseProvider';
import {
  InspectionRepository,
  AnswerRepository,
  EvidenceRepository,
  NonConformityRepository,
  SyncQueueRepository,
} from '@/infrastructure/database/repositories';
import { InspectionSyncService } from '@/infrastructure/sync';

import {
  allTemplateItems,
  clients,
  compressorTemplate,
  equipment,
  initialInspections,
  initialNonConformities,
  initialSyncOperations,
  sites,
  supervisor,
} from './data';
import {
  InspectionStatus,
  Severity,
  type ChecklistAnswer,
  type ChecklistValue,
  type Evidence,
  type Inspection,
  type NonConformity,
  type SyncOperation,
} from './types';

// ─── Context Interface ─────────────────────────────────────────────────────────

interface FieldOpsContextValue {
  inspections: Inspection[];
  answers: Record<string, ChecklistAnswer>;
  evidences: Evidence[];
  nonConformities: NonConformity[];
  syncOperations: SyncOperation[];
  startInspection: (inspectionId: string) => void;
  answerItem: (itemId: string, value: ChecklistValue, observation?: string) => void;
  addEvidence: (inspectionId: string, itemId: string, description: string, uri?: string) => Evidence;
  addNonConformity: (input: Omit<NonConformity, 'id' | 'evidenceCount'> & { evidenceCount?: number }) => void;
  concludeInspection: (inspectionId: string) => void;
  syncNow: () => void;
  resetSession: () => void;
  isSyncing: boolean;
  lastSyncError: string | null;
}

const FieldOpsContext = createContext<FieldOpsContextValue | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function FieldOpsProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase();
  const { token } = useAuth();

  // Refs to avoid stale closures and prevent re-init loops
  const initDoneRef = useRef(false);
  const inspectionsRef = useRef<Inspection[]>(initialInspections);

  // State
  const [inspections, setInspections] = useState<Inspection[]>(initialInspections);
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>({});
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>(initialSyncOperations);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  // Keep inspectionsRef in sync with state
  useEffect(() => { inspectionsRef.current = inspections; }, [inspections]);

  // ─── Initialize DB once ──────────────────────────────────────────────────

  useEffect(() => {
    if (!db || initDoneRef.current) return;
    initDoneRef.current = true;

    const inspRepo = new InspectionRepository(db);
    const ansRepo = new AnswerRepository(db);
    const evRepo = new EvidenceRepository(db);
    const ncRepo = new NonConformityRepository(db);
    const sqRepo = new SyncQueueRepository(db);

    (async () => {
      try {
        let dbInspections = await inspRepo.getAll();

        if (dbInspections.length === 0) {
          // First run: seed mock data
          console.log('[FieldOps] Seeding mock data into SQLite...');
          for (const insp of initialInspections) {
            const client = clients.find((c) => c.id === insp.clientId);
            const site = sites.find((s) => s.id === insp.siteId);
            const equip = equipment.find((e) => e.id === insp.equipmentId);
            await inspRepo.upsert({
              ...insp,
              clientName: client?.name ?? '',
              siteName: site?.name ?? '',
              equipmentName: equip?.name ?? '',
              supervisorName: supervisor.name,
            });
            await inspRepo.saveTemplate(insp.id, compressorTemplate);
          }
          for (const nc of initialNonConformities) {
            await ncRepo.add(nc);
          }
          console.log('[FieldOps] Seed complete');
          dbInspections = await inspRepo.getAll();
        }

        // Load everything from DB
        if (dbInspections.length > 0) {
          setInspections(dbInspections);
        }

        const allAnswers: Record<string, ChecklistAnswer> = {};
        for (const insp of dbInspections) {
          const a = await ansRepo.getByInspection(insp.id);
          Object.assign(allAnswers, a);
        }
        setAnswers(allAnswers);

        const allEvs: Evidence[] = [];
        for (const insp of dbInspections) {
          const e = await evRepo.getByInspection(insp.id);
          allEvs.push(...e);
        }
        setEvidences(allEvs);

        const allNCs: NonConformity[] = [];
        for (const insp of dbInspections) {
          const n = await ncRepo.getByInspection(insp.id);
          allNCs.push(...n);
        }
        if (allNCs.length > 0) {
          setNonConformities(allNCs);
        } else {
          setNonConformities(initialNonConformities);
        }

        const queue = await sqRepo.getAll();
        if (queue.length > 0) {
          setSyncOperations(queue.map((entry) => ({
            id: entry.id,
            title: `${entry.entityType}: ${entry.entityId}`,
            status: entry.status === 'sent' ? 'Enviada' as const :
                    entry.status === 'error' ? 'Erro' as const : 'Pendente' as const,
          })));
        }

        console.log('[FieldOps] DB loaded:', dbInspections.length, 'inspections,', Object.keys(allAnswers).length, 'answers');
      } catch (error) {
        console.warn('[FieldOps] DB init failed, using defaults:', error);
      }
    })();
  }, [db]);

  // ─── Helper: get repos (only if db available) ────────────────────────────

  const getRepos = useCallback(() => {
    if (!db) return null;
    return {
      inspection: new InspectionRepository(db),
      answer: new AnswerRepository(db),
      evidence: new EvidenceRepository(db),
      nc: new NonConformityRepository(db),
      syncQueue: new SyncQueueRepository(db),
    };
  }, [db]);

  const getSyncService = useCallback(() => {
    if (!db) return null;
    return new InspectionSyncService(db);
  }, [db]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const startInspection = useCallback((inspectionId: string) => {
    setInspections((current) =>
      current.map((inspection) =>
        inspection.id === inspectionId
          ? { ...inspection, status: InspectionStatus.IN_PROGRESS, startedAt: inspection.startedAt ?? new Date().toISOString(), syncStatus: 'pending' as const }
          : inspection,
      ),
    );
    const repos = getRepos();
    const sync = getSyncService();
    if (repos && sync) {
      repos.inspection.markStarted(inspectionId).catch(console.warn);
      sync.enqueueStatusChange(inspectionId, 'IN_PROGRESS').catch(console.warn);
    }
  }, [getRepos, getSyncService]);

  const answerItem = useCallback((itemId: string, value: ChecklistValue, observation?: string) => {
    setAnswers((current) => {
      const next = { ...current, [itemId]: { itemId, value, observation, savedAt: new Date().toISOString() } };

      // Update progress
      const total = allTemplateItems(compressorTemplate).length;
      const progress = Math.min(100, Math.round((Object.keys(next).length / total) * 100));
      const activeId = inspectionsRef.current.find(
        (i) => i.status === InspectionStatus.IN_PROGRESS,
      )?.id ?? inspectionsRef.current[0]?.id ?? 'ins-compressor';

      setInspections((curr) =>
        curr.map((insp) =>
          insp.id === activeId
            ? { ...insp, progress, pendingSyncCount: Math.max(insp.pendingSyncCount, 1), syncStatus: 'pending' as const }
            : insp,
        ),
      );

      // Persist to DB
      const repos = getRepos();
      const sync = getSyncService();
      if (repos && sync) {
        repos.answer.save(activeId, itemId, value, observation).catch(console.warn);
        repos.inspection.updateProgress(activeId, progress).catch(console.warn);
        sync.enqueueAnswer(activeId, itemId, value, observation).catch(console.warn);
      }

      return next;
    });

    // Auto-create non-conformity for NAO_CONFORME
    const item = allTemplateItems(compressorTemplate).find((c) => c.id === itemId);
    if (value === 'NAO_CONFORME' && item) {
      const activeId = inspectionsRef.current.find(
        (i) => i.status === InspectionStatus.IN_PROGRESS,
      )?.id ?? inspectionsRef.current[0]?.id ?? 'ins-compressor';

      setNonConformities((current) => {
        if (current.some((nc) => nc.inspectionId === activeId && nc.itemId === itemId)) return current;
        const nc: NonConformity = {
          id: `nc-${itemId}-${Date.now()}`,
          inspectionId: activeId,
          itemId,
          title: item.question.replace('?', ''),
          description: observation ?? 'Não conformidade criada automaticamente pelo checklist.',
          severity: Severity.MEDIUM,
          evidenceCount: 0,
        };
        const repos = getRepos();
        const sync = getSyncService();
        if (repos && sync) {
          repos.nc.add(nc).catch(console.warn);
          sync.enqueueNonConformity(nc).catch(console.warn);
        }
        return [...current, nc];
      });
    }
  }, [getRepos, getSyncService]);

  const addEvidence = useCallback((inspectionId: string, itemId: string, description: string, uri?: string) => {
    const evidence: Evidence = {
      id: `ev-${itemId}-${Date.now()}`,
      inspectionId,
      itemId,
      description,
      uri,
      capturedAt: new Date().toISOString(),
      syncStatus: 'pending',
    };
    setEvidences((current) => [...current, evidence]);
    setNonConformities((current) =>
      current.map((nc) =>
        nc.inspectionId === inspectionId && nc.itemId === itemId
          ? { ...nc, evidenceCount: nc.evidenceCount + 1 }
          : nc,
      ),
    );
    setInspections((current) =>
      current.map((insp) =>
        insp.id === inspectionId
          ? { ...insp, pendingSyncCount: insp.pendingSyncCount + 1, syncStatus: 'pending' as const }
          : insp,
      ),
    );
    const repos = getRepos();
    const sync = getSyncService();
    if (repos && sync) {
      repos.evidence.add(evidence).catch(console.warn);
      repos.nc.incrementEvidenceCount(inspectionId, itemId).catch(console.warn);
      sync.enqueueEvidence(evidence).catch(console.warn);
    }
    return evidence;
  }, [getRepos, getSyncService]);

  const addNonConformity = useCallback((input: Omit<NonConformity, 'id' | 'evidenceCount'> & { evidenceCount?: number }) => {
    const nc: NonConformity = { ...input, id: `nc-manual-${Date.now()}`, evidenceCount: input.evidenceCount ?? 0 };
    setNonConformities((current) => [...current, nc]);
    const repos = getRepos();
    const sync = getSyncService();
    if (repos && sync) {
      repos.nc.add(nc).catch(console.warn);
      sync.enqueueNonConformity(nc).catch(console.warn);
    }
  }, [getRepos, getSyncService]);

  const concludeInspection = useCallback((inspectionId: string) => {
    setInspections((current) =>
      current.map((insp) =>
        insp.id === inspectionId
          ? { ...insp, status: InspectionStatus.SUBMITTED, progress: 100, syncStatus: 'pending' as const, pendingSyncCount: Math.max(insp.pendingSyncCount, 5) }
          : insp,
      ),
    );
    const repos = getRepos();
    const sync = getSyncService();
    if (repos && sync) {
      repos.inspection.markSubmitted(inspectionId).catch(console.warn);
      sync.enqueueStatusChange(inspectionId, 'SUBMITTED').catch(console.warn);
    }
  }, [getRepos, getSyncService]);

  const syncNow = useCallback(async () => {
    const sync = getSyncService();
    if (!sync || !token) {
      // Fallback: visual only
      setSyncOperations((current) =>
        current.map((op) => ({ ...op, status: op.status === 'Erro' ? 'Pendente' : 'Enviada' } as SyncOperation)),
      );
      setInspections((current) =>
        current.map((insp) => ({ ...insp, syncStatus: 'synced' as const, pendingSyncCount: 0 })),
      );
      return;
    }

    setIsSyncing(true);
    setLastSyncError(null);
    try {
      const result = await sync.fullSync(token);
      if (result.errors.length > 0) {
        setLastSyncError(result.errors[0]);
      }
      // Reload inspections from DB after sync
      const repos = getRepos();
      if (repos) {
        const fresh = await repos.inspection.getAll();
        if (fresh.length > 0) setInspections(fresh);
      }
    } catch (error) {
      setLastSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [getSyncService, getRepos, token]);

  const resetSession = useCallback(async () => {
    // Reset in-memory state
    setInspections(initialInspections);
    setAnswers({});
    setEvidences([]);
    setNonConformities(initialNonConformities);
    setSyncOperations(initialSyncOperations);

    // Reset DB
    if (db) {
      try {
        await db.execAsync(`
          DELETE FROM sync_queue;
          DELETE FROM non_conformities;
          DELETE FROM evidences;
          DELETE FROM answers;
          DELETE FROM inspection_items;
          DELETE FROM inspection_sections;
          DELETE FROM inspections;
        `);
        // Re-seed
        initDoneRef.current = false;
      } catch (error) {
        console.warn('[FieldOps] DB reset failed:', error);
      }
    }
  }, [db]);

  // ─── Context value ───────────────────────────────────────────────────────

  const value = useMemo<FieldOpsContextValue>(
    () => ({
      inspections,
      answers,
      evidences,
      nonConformities,
      syncOperations,
      startInspection,
      answerItem,
      addEvidence,
      addNonConformity,
      concludeInspection,
      syncNow,
      resetSession,
      isSyncing,
      lastSyncError,
    }),
    [
      inspections, answers, evidences, nonConformities, syncOperations,
      startInspection, answerItem, addEvidence, addNonConformity,
      concludeInspection, syncNow, resetSession, isSyncing, lastSyncError,
    ],
  );

  return <FieldOpsContext.Provider value={value}>{children}</FieldOpsContext.Provider>;
}

export function useFieldOps() {
  const context = useContext(FieldOpsContext);
  if (!context) throw new Error('useFieldOps must be used within FieldOpsProvider');
  return context;
}
