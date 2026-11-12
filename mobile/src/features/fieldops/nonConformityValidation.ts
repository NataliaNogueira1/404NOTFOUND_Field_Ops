import { Severity } from './types';

export function criticalEvidenceValidationError(severity: Severity, evidenceCount: number): string | null {
  if (severity === Severity.CRITICAL && evidenceCount < 1) {
    return 'Adicione uma evidência ao item antes de registrar uma não conformidade crítica.';
  }
  return null;
}
