import type { SyncQueueEntry } from '@/infrastructure/database/repositories';

/**
 * Pure mapping helpers that turn the REAL outbox (`sync_queue`) rows into the
 * view model used by the sync screen. Kept free of React/expo imports so the
 * logic can be unit-tested against the actual repositories in Node (PBI-054).
 */

/**
 * Display status for a single outbox operation, mapped from the REAL states of
 * the `sync_queue` table (RN-071). The four buckets match the acceptance
 * criteria icons:
 *  - `synced`  → ✓  operation applied/sent
 *  - `pending` → ⏳  waiting to be processed
 *  - `error`   → ❌  failed (see {@link SyncOperationView.error})
 *  - `waiting` → ⚠️  deferred because a dependency is not yet synced (RN-069)
 */
export type SyncOperationDisplayStatus = 'synced' | 'pending' | 'error' | 'waiting';

export interface SyncOperationView {
  id: string;
  /** Human-friendly label, e.g. "Foto — Item 7". */
  title: string;
  /** Raw entity/operation kind, kept for testing and richer UIs. */
  entityType: SyncQueueEntry['entityType'];
  operationType: SyncQueueEntry['operationType'];
  entityId: string;
  displayStatus: SyncOperationDisplayStatus;
  /** Persisted error (last_error) when the operation failed. */
  error?: string;
  /** Extra note for the ⚠️ waiting state (e.g. "Aguardando resposta"). */
  waitingReason?: string;
}

const ENTITY_LABEL: Record<SyncQueueEntry['entityType'], string> = {
  inspection: 'Inspeção',
  answer: 'Resposta',
  evidence: 'Foto',
  non_conformity: 'Não conformidade',
};

/** Best-effort friendly identifier extracted from a queued operation payload. */
function friendlyDetail(entry: SyncQueueEntry): string {
  try {
    const payload = JSON.parse(entry.payload) as Record<string, unknown>;
    const itemId = payload.itemId;
    if (typeof itemId === 'string' && itemId.length > 0) return `Item ${itemId}`;
    const status = payload.status;
    if (typeof status === 'string' && status.length > 0) return status;
  } catch {
    // ignore malformed payloads — fall back to the entity id below
  }
  return entry.entityId;
}

/**
 * `SyncQueueEntry` may or may not carry an explicit `dependencyIds` column
 * depending on the branch: it exists once PBI-044 lands, but not on the current
 * develop base. We read it defensively so this screen works in BOTH cases
 * without a second sync implementation.
 */
type EntryWithOptionalDeps = SyncQueueEntry & { dependencyIds?: string[] };

/**
 * Set of operation ids that are still "blocking" (not yet applied): anything
 * sitting in the queue as pending/in_progress/error. When an operation declares
 * `dependencyIds` (PBI-044), it must wait until none of them are in this set
 * (RN-069). Mirrors SyncQueueRepository.getReady().
 */
function buildBlockingOpIds(entries: SyncQueueEntry[]): Set<string> {
  const blocking = new Set<string>();
  for (const entry of entries) {
    if (entry.status === 'pending' || entry.status === 'in_progress' || entry.status === 'error') {
      blocking.add(entry.id);
    }
  }
  return blocking;
}

/**
 * Domain dependency reconstructed from payloads, used as a FALLBACK when the
 * outbox has no explicit `dependencyIds` (develop base, pre-PBI-044): a photo
 * (evidence) can only upload after the answer of the SAME item is synced
 * (RN-069/RN-078). Answer ops are enqueued with entityId `${inspectionId}-${itemId}`,
 * and evidences carry `inspectionId`/`itemId` in their payload.
 */
function buildBlockingItemSet(entries: SyncQueueEntry[]): Set<string> {
  const blocked = new Set<string>();
  for (const entry of entries) {
    if (entry.entityType !== 'answer') continue;
    if (entry.status === 'pending' || entry.status === 'error' || entry.status === 'in_progress') {
      // entityId is `${inspectionId}-${itemId}`.
      blocked.add(entry.entityId);
    }
  }
  return blocked;
}

function evidenceDependencyKey(entry: SyncQueueEntry): string | null {
  if (entry.entityType !== 'evidence') return null;
  try {
    const payload = JSON.parse(entry.payload) as { inspectionId?: string; itemId?: string };
    if (payload.inspectionId && payload.itemId) {
      return `${payload.inspectionId}-${payload.itemId}`;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Decide whether a still-unsent operation is waiting on a dependency (⚠️).
 *
 * Prefers the REAL `dependencyIds` when present (PBI-044): the op waits while
 * any declared dependency is still blocking. Falls back to the payload-derived
 * photo→answer relation when the column is absent (develop base).
 */
function isWaitingOnDependency(
  entry: EntryWithOptionalDeps,
  blockingOpIds: Set<string>,
  blockingItems: Set<string>,
): boolean {
  if (Array.isArray(entry.dependencyIds) && entry.dependencyIds.length > 0) {
    return entry.dependencyIds.some((depId) => blockingOpIds.has(depId));
  }
  const depKey = evidenceDependencyKey(entry);
  return depKey !== null && blockingItems.has(depKey);
}

/** Map a raw outbox entry (+ dependency context) to a display view. */
export function mapEntryToView(
  entry: SyncQueueEntry,
  blockingItems: Set<string>,
  blockingOpIds: Set<string> = new Set(),
): SyncOperationView {
  const label = ENTITY_LABEL[entry.entityType] ?? entry.entityType;
  const title = `${label} — ${friendlyDetail(entry)}`;

  const base = {
    id: entry.id,
    title,
    entityType: entry.entityType,
    operationType: entry.operationType,
    entityId: entry.entityId,
  } as const;

  // A pending operation blocked by an unsynced dependency is "waiting" (⚠️),
  // not a plain pending — this makes the dependency visible to the technician.
  if (entry.status === 'pending' || entry.status === 'in_progress') {
    if (isWaitingOnDependency(entry, blockingOpIds, blockingItems)) {
      return { ...base, displayStatus: 'waiting', waitingReason: 'Aguardando sincronização da resposta' };
    }
    return { ...base, displayStatus: 'pending' };
  }

  if (entry.status === 'error') {
    return { ...base, displayStatus: 'error', error: entry.lastError ?? undefined };
  }

  // 'sent'
  return { ...base, displayStatus: 'synced' };
}

/** Pure mapper for a whole outbox snapshot. */
export function mapOutboxToViews(entries: SyncQueueEntry[]): SyncOperationView[] {
  const blockingItems = buildBlockingItemSet(entries);
  const blockingOpIds = buildBlockingOpIds(entries);
  return entries.map((entry) => mapEntryToView(entry, blockingItems, blockingOpIds));
}
