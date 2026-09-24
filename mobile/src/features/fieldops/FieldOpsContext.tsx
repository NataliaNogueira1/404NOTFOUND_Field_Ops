import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

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
  isLoading: boolean;
  answers: Record<string, ChecklistAnswer>;
  evidences: Evidence[];
  nonConformities: NonConformity[];
  syncOperations: SyncOperation[];
  startInspection: (
    inspectionId: string,
    options?: {
      startedAtDevice?: string;
      location?: { latitude: number; longitude: number; accuracy?: number } | null;
    },
  ) => void;
  answerItem: (itemId: string, value: ChecklistValue, observation?: string) => void;
  addEvidence: (inspectionId: string, itemId: string, description: string, uri?: string) => Evidence;
  addNonConformity: (input: Omit<NonConformity, 'id' | 'evidenceCount'> & { evidenceCount?: number }) => void;
  concludeInspection: (inspectionId: string) => void;
  syncNow: () => void;
  resetSession: () => void;
  isSyncing: boolean;
  lastSyncError: string | null;
}

// Downloads the technician's inspections from the API into SQLite. Failures are
// swallowed (logged) on purpose: the app must keep working offline from the local
// cache, so a pull error never blocks the UI.
async function pullFromApi(db: SQLiteDatabase, token: string): Promise<void> {
  try {
    const syncService = new InspectionSyncService(db);
    console.log('[FieldOps] Pulling inspections from API...');
    const result = await syncService.pullInspections(token);
    console.log('[FieldOps] Pull complete:', result.downloaded, 'downloaded,', result.errors.length, 'errors');
  } catch (apiError) {
    console.warn('[FieldOps] API pull failed, falling back to local data:', apiError);
  }
}

const FieldOpsContext = createContext<FieldOpsContextValue | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function FieldOpsProvider({ children }: { children: React.ReactNode }) {
  const db = useDatabase();
  const { token } = useAuth();

  // Refs to avoid stale closures and prevent re-init loops
  const initDoneRef = useRef(false);
  const inspectionsRef = useRef<Inspection[]>([]);
  // Tracks the token we last pulled with, so the post-login effect pulls once per session.
  const lastPulledTokenRef = useRef<string | null>(null);

  // State
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>({});
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  // Keep inspectionsRef in sync with state
  useEffect(() => { inspectionsRef.current = inspections; }, [inspections]);

  // ─── Initialize DB once ──────────────────────────────────────────────────

  // Loads every entity from SQLite into React state. Shared by the initial DB load
  // and by the post-login pull, so both paths hydrate the UI the same way.
  const loadFromDb = useCallback(async () => {
    if (!db) return;
    const inspRepo = new InspectionRepository(db);
    const ansRepo = new AnswerRepository(db);
    const evRepo = new EvidenceRepository(db);
    const ncRepo = new NonConformityRepository(db);
    const sqRepo = new SyncQueueRepository(db);

    const dbInspections = await inspRepo.getAll();
    setInspections(dbInspections);

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
    setNonConformities(allNCs);

    const queue = await sqRepo.getAll();
    setSyncOperations(queue.map((entry) => ({
      id: entry.id,
      title: `${entry.entityType}: ${entry.entityId}`,
      status: entry.status === 'sent' ? 'Enviada' as const :
              entry.status === 'error' ? 'Erro' as const : 'Pendente' as const,
    })));

    console.log('[FieldOps] DB loaded:', dbInspections.length, 'inspections,', Object.keys(allAnswers).length, 'answers');
  }, [db]);

  // ─── Initialize DB once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!db || initDoneRef.current) return;
    initDoneRef.current = true;

    (async () => {
      try {
        // Try to pull from API first (if we already have a token at startup).
        if (token) {
          await pullFromApi(db, token);
        }
        await loadFromDb();
      } catch (error) {
        console.warn('[FieldOps] DB init failed:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [db, loadFromDb, token]);

  // ─── Pull from the server when the technician logs in ─────────────────────
  // The DB init above runs once and may execute before the user authenticates
  // (no token yet), which would skip the download and leave the stale local
  // cache on screen. This effect re-runs the pull as soon as a token becomes
  // available, then re-hydrates the UI from SQLite.
  useEffect(() => {
    if (!db || !token) return;
    if (lastPulledTokenRef.current === token) return;
    lastPulledTokenRef.current = token;

    (async () => {
      try {
        await pullFromApi(db, token);
        await loadFromDb();
      } catch (error) {
        console.warn('[FieldOps] Post-login pull failed:', error);
      }
    })();
  }, [db, token, loadFromDb]);

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

  const startInspection = useCallback(
    (
      inspectionId: string,
      options?: {
        startedAtDevice?: string;
        location?: { latitude: number; longitude: number; accuracy?: number } | null;
      },
    ) => {
      const startedAtDevice = options?.startedAtDevice ?? new Date().toISOString();
      const location = options?.location ?? null;

      setInspections((current) =>
        current.map((inspection) =>
          inspection.id === inspectionId
            ? {
                ...inspection,
                status: InspectionStatus.IN_PROGRESS,
                startedAt: inspection.startedAt ?? startedAtDevice,
                startLatitude: location?.latitude ?? inspection.startLatitude,
                startLongitude: location?.longitude ?? inspection.startLongitude,
                startAccuracy: location?.accuracy ?? inspection.startAccuracy,
                syncStatus: 'pending' as const,
                pendingSyncCount: Math.max(inspection.pendingSyncCount, 1),
              }
            : inspection,
        ),
      );
      const repos = getRepos();
      const sync = getSyncService();
      if (repos && sync) {
        repos.inspection
          .markStartedWithDevice(inspectionId, startedAtDevice, location)
          .catch(console.warn);
        // Outbox: TRANSITION carrying device timestamp + optional location (PBI-034).
        sync
          .enqueueTransition(inspectionId, {
            status: 'IN_PROGRESS',
            startedAtDevice,
            location,
          })
          .catch(console.warn);
      }
    },
    [getRepos, getSyncService],
  );

  const answerItem = useCallback((itemId: string, value: ChecklistValue, observation?: string) => {
    setAnswers((current) => {
      const next = { ...current, [itemId]: { itemId, value, observation, savedAt: new Date().toISOString() } };

      // Update progress — count answered vs total items for the active inspection
      const activeId = inspectionsRef.current.find(
        (i) => i.status === InspectionStatus.IN_PROGRESS,
      )?.id ?? inspectionsRef.current[0]?.id;

      if (activeId) {
        // Get total items count asynchronously, update progress
        const repos = getRepos();
        if (repos) {
          repos.inspection.getAllItems(activeId).then((items) => {
            const total = items.length || 12; // fallback
            const progress = Math.min(100, Math.round((Object.keys(next).length / total) * 100));
            setInspections((curr) =>
              curr.map((insp) =>
                insp.id === activeId
                  ? { ...insp, progress, pendingSyncCount: Math.max(insp.pendingSyncCount, 1), syncStatus: 'pending' as const }
                  : insp,
              ),
            );
            repos.inspection.updateProgress(activeId, progress).catch(console.warn);
          }).catch(console.warn);
        }
      }

      // Persist to DB
      const repos2 = getRepos();
      const sync = getSyncService();
      const persistId = inspectionsRef.current.find(
        (i) => i.status === InspectionStatus.IN_PROGRESS,
      )?.id ?? inspectionsRef.current[0]?.id;
      if (repos2 && sync && persistId) {
        repos2.answer.save(persistId, itemId, value, observation).catch(console.warn);
        sync.enqueueAnswer(persistId, itemId, value, observation).catch(console.warn);
      }

      return next;
    });

    // Auto-create non-conformity for NAO_CONFORME
    if (value === 'NAO_CONFORME') {
      const activeId = inspectionsRef.current.find(
        (i) => i.status === InspectionStatus.IN_PROGRESS,
      )?.id ?? inspectionsRef.current[0]?.id;

      setNonConformities((current) => {
        if (!activeId || current.some((nc) => nc.inspectionId === activeId && nc.itemId === itemId)) return current;
        const nc: NonConformity = {
          id: `nc-${itemId}-${Date.now()}`,
          inspectionId: activeId,
          itemId,
          title: `Não conformidade - item ${itemId}`,
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
    setInspections([]);
    setIsLoading(true);
    setAnswers({});
    setEvidences([]);
    setNonConformities([]);
    setSyncOperations([]);

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
      isLoading,
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
      inspections, isLoading, answers, evidences, nonConformities, syncOperations,
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
