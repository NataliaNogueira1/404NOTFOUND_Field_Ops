import { formatInspectionId, SHORT_INSPECTION_ID_LENGTH } from '../inspectionId';

describe('formatInspectionId (PBI #337)', () => {
  it('abbreviates a full UUID to the first 8 characters with a leading #', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(formatInspectionId(uuid)).toBe('#a1b2c3d4');
    expect(formatInspectionId(uuid)).toHaveLength(SHORT_INSPECTION_ID_LENGTH + 1); // + '#'
  });

  it('keeps ids that are already short (e.g. sequential) as-is', () => {
    expect(formatInspectionId('42')).toBe('#42');
    expect(formatInspectionId('12345678')).toBe('#12345678');
  });

  it('trims surrounding whitespace before formatting', () => {
    expect(formatInspectionId('  a1b2c3d4e5f6  ')).toBe('#a1b2c3d4');
  });

  it('returns an empty string for missing or blank ids', () => {
    expect(formatInspectionId(undefined)).toBe('');
    expect(formatInspectionId(null)).toBe('');
    expect(formatInspectionId('')).toBe('');
    expect(formatInspectionId('   ')).toBe('');
  });
});
