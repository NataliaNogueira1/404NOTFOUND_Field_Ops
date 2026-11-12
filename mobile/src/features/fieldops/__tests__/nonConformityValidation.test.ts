import { Severity } from '../types';
import { criticalEvidenceValidationError } from '../nonConformityValidation';

describe('critical non-conformity evidence validation', () => {
  it('requires at least one evidence item for critical severity', () => {
    expect(criticalEvidenceValidationError(Severity.CRITICAL, 0))
      .toBe('Adicione uma evidência ao item antes de registrar uma não conformidade crítica.');
  });

  it('allows critical non-conformities when the item has evidence', () => {
    expect(criticalEvidenceValidationError(Severity.CRITICAL, 1)).toBeNull();
  });

  it('does not require evidence for other severity levels', () => {
    expect(criticalEvidenceValidationError(Severity.HIGH, 0)).toBeNull();
  });
});
