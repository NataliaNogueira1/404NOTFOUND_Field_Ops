/**
 * PBI-274 (mobile) — rotating login phrases.
 *
 * Covers the pure rotation logic backing useRotatingPhrase (index wrapping and
 * the static single-phrase guard) plus the shape of the shared phrase list.
 * The timing/cleanup wiring is identical to the web hook, which is covered by a
 * renderer-based test on that platform; here the RN runtime is intentionally
 * avoided so the suite stays in the fast Node project.
 */

import { LOGIN_PHRASES, LOGIN_PHRASE_INTERVAL_MS } from '@/features/auth/loginPhrases';
import { nextPhraseIndex, shouldRotatePhrases } from '@/features/auth/useRotatingPhrase';

describe('nextPhraseIndex', () => {
  it('advances to the next index', () => {
    expect(nextPhraseIndex(0, 5)).toBe(1);
    expect(nextPhraseIndex(3, 5)).toBe(4);
  });

  it('wraps back to the first index after the last', () => {
    expect(nextPhraseIndex(4, 5)).toBe(0);
  });

  it('stays at 0 for an empty list', () => {
    expect(nextPhraseIndex(0, 0)).toBe(0);
  });
});

describe('shouldRotatePhrases', () => {
  it('rotates when there is more than one phrase and a positive interval', () => {
    expect(shouldRotatePhrases(5, 4000)).toBe(true);
  });

  it('does not rotate a single phrase', () => {
    expect(shouldRotatePhrases(1, 4000)).toBe(false);
  });

  it('does not rotate with a non-positive interval', () => {
    expect(shouldRotatePhrases(5, 0)).toBe(false);
  });
});

describe('LOGIN_PHRASES', () => {
  it('provides several non-empty phrases to rotate', () => {
    expect(LOGIN_PHRASES.length).toBeGreaterThan(1);
    expect(LOGIN_PHRASES.every((phrase) => phrase.trim().length > 0)).toBe(true);
  });

  it('rotates on a ~4s cadence', () => {
    expect(LOGIN_PHRASE_INTERVAL_MS).toBe(4000);
  });
});
