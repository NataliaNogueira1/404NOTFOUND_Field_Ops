import { Severity } from './types';

/** Prevents reporting a critical risk before its checklist item has evidence. */
export function criticalNonConformityRequiresEvidence(
  severity: Severity,
  evidenceCount: number,
): boolean {
  return severity === Severity.CRITICAL && evidenceCount === 0;
}
