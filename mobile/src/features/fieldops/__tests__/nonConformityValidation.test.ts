import { Severity } from '../types';
import { criticalNonConformityRequiresEvidence } from '../nonConformityValidation';

describe('criticalNonConformityRequiresEvidence', () => {
  it('requires an evidence for a critical non-conformity', () => {
    expect(criticalNonConformityRequiresEvidence(Severity.CRITICAL, 0)).toBe(true);
  });

  it('allows a critical non-conformity when its item has an evidence', () => {
    expect(criticalNonConformityRequiresEvidence(Severity.CRITICAL, 1)).toBe(false);
  });

  it('does not require evidence for other severities', () => {
    expect(criticalNonConformityRequiresEvidence(Severity.HIGH, 0)).toBe(false);
  });
});
