import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { allTemplateItems, compressorTemplate, initialInspections, initialNonConformities, initialSyncOperations } from './data';
import { InspectionStatus, Severity, type ChecklistAnswer, type ChecklistValue, type Evidence, type Inspection, type NonConformity, type SyncOperation } from './types';

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
}

const FieldOpsContext = createContext<FieldOpsContextValue | undefined>(undefined);
const demoAnswers: Record<string, ChecklistAnswer> = {
  'item-1': { itemId: 'item-1', value: 'CONFORME', savedAt: '2026-08-13T09:11:00' },
  'item-2': { itemId: 'item-2', value: 'Limpeza geral satisfatória, com acúmulo de óleo na base.', observation: 'Acúmulo de óleo próximo à base.', savedAt: '2026-08-13T09:13:00' },
  'item-3': { itemId: 'item-3', value: true, savedAt: '2026-08-13T09:16:00' },
  'item-4': { itemId: 'item-4', value: 'NAO_CONFORME', observation: 'Proteção lateral com folga no parafuso.', savedAt: '2026-08-13T09:18:00' },
};

export function FieldOpsProvider({ children }: { children: React.ReactNode }) {
  const [inspections, setInspections] = useState(initialInspections);
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>(demoAnswers);
  const [evidences, setEvidences] = useState<Evidence[]>([{ id: 'ev-item-4', inspectionId: 'ins-compressor', itemId: 'item-4', description: 'Proteção lateral com folga.', capturedAt: '2026-08-13T09:19:00', syncStatus: 'pending' }]);
  const [nonConformities, setNonConformities] = useState(initialNonConformities);
  const [syncOperations, setSyncOperations] = useState(initialSyncOperations);

  const updateProgress = useCallback((inspectionId: string, nextAnswers: Record<string, ChecklistAnswer>) => {
    const total = allTemplateItems(compressorTemplate).length;
    const progress = Math.min(100, Math.round((Object.keys(nextAnswers).length / total) * 100));
    setInspections((current) => current.map((inspection) => inspection.id === inspectionId ? { ...inspection, progress, pendingSyncCount: Math.max(inspection.pendingSyncCount, 1), syncStatus: 'pending' } : inspection));
  }, []);

  const startInspection = useCallback((inspectionId: string) => {
    setInspections((current) => current.map((inspection) => inspection.id === inspectionId ? { ...inspection, status: InspectionStatus.IN_PROGRESS, startedAt: inspection.startedAt ?? '2026-08-13T09:05:00', syncStatus: 'pending' } : inspection));
  }, []);

  const answerItem = useCallback((itemId: string, value: ChecklistValue, observation?: string) => {
    setAnswers((current) => {
      const next = { ...current, [itemId]: { itemId, value, observation, savedAt: new Date().toISOString() } };
      updateProgress('ins-compressor', next);
      return next;
    });
    const item = allTemplateItems(compressorTemplate).find((candidate) => candidate.id === itemId);
    if (value === 'NAO_CONFORME' && item) {
      setNonConformities((current) => {
        if (current.some((nc) => nc.inspectionId === 'ins-compressor' && nc.itemId === itemId)) return current;
        return [...current, { id: `nc-${itemId}`, inspectionId: 'ins-compressor', itemId, title: item.question.replace('?', ''), description: observation ?? 'Não conformidade criada automaticamente pelo checklist.', severity: Severity.MEDIUM, evidenceCount: evidences.filter((evidence) => evidence.itemId === itemId).length }];
      });
    }
  }, [evidences, updateProgress]);

  const addEvidence = useCallback((inspectionId: string, itemId: string, description: string, uri?: string) => {
    const evidence: Evidence = { id: `ev-${itemId}-${Date.now()}`, inspectionId, itemId, description, uri, capturedAt: new Date().toISOString(), syncStatus: 'pending' };
    setEvidences((current) => [...current, evidence]);
    setNonConformities((current) => current.map((nc) => nc.inspectionId === inspectionId && nc.itemId === itemId ? { ...nc, evidenceCount: nc.evidenceCount + 1 } : nc));
    setInspections((current) => current.map((inspection) => inspection.id === inspectionId ? { ...inspection, pendingSyncCount: inspection.pendingSyncCount + 1, syncStatus: 'pending' } : inspection));
    return evidence;
  }, []);

  const addNonConformity = useCallback((input: Omit<NonConformity, 'id' | 'evidenceCount'> & { evidenceCount?: number }) => {
    setNonConformities((current) => [...current, { ...input, id: `nc-manual-${Date.now()}`, evidenceCount: input.evidenceCount ?? 0 }]);
  }, []);

  const concludeInspection = useCallback((inspectionId: string) => {
    setInspections((current) => current.map((inspection) => inspection.id === inspectionId ? { ...inspection, status: InspectionStatus.SUBMITTED, progress: 100, syncStatus: 'pending', pendingSyncCount: Math.max(inspection.pendingSyncCount, 5) } : inspection));
  }, []);

  const syncNow = useCallback(() => {
    setSyncOperations((current) => current.map((operation) => ({ ...operation, status: operation.status === 'Erro' ? 'Pendente' : 'Enviada' })));
    setInspections((current) => current.map((inspection) => ({ ...inspection, syncStatus: 'synced', pendingSyncCount: 0 })));
  }, []);

  const resetSession = useCallback(() => {
    setInspections(initialInspections);
    setAnswers(demoAnswers);
    setEvidences([]);
    setNonConformities(initialNonConformities);
    setSyncOperations(initialSyncOperations);
  }, []);

  const value = useMemo<FieldOpsContextValue>(() => ({ inspections, answers, evidences, nonConformities, syncOperations, startInspection, answerItem, addEvidence, addNonConformity, concludeInspection, syncNow, resetSession }), [addEvidence, addNonConformity, answerItem, answers, concludeInspection, evidences, inspections, nonConformities, resetSession, startInspection, syncNow, syncOperations]);
  return <FieldOpsContext.Provider value={value}>{children}</FieldOpsContext.Provider>;
}

export function useFieldOps() {
  const context = useContext(FieldOpsContext);
  if (!context) throw new Error('useFieldOps must be used within FieldOpsProvider');
  return context;
}
