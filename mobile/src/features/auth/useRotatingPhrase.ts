import { useEffect, useState } from 'react';

/**
 * Whether a phrase list of `count` items should rotate on `intervalMs`.
 * A list with 0 or 1 phrases, or a non-positive interval, stays static — the
 * hook relies on this to avoid scheduling a useless timer.
 */
export function shouldRotatePhrases(count: number, intervalMs: number): boolean {
  return count > 1 && intervalMs > 0;
}

/** Index that follows `current`, wrapping back to 0 after the last phrase. */
export function nextPhraseIndex(current: number, count: number): number {
  if (count <= 0) return 0;
  return (current + 1) % count;
}

/**
 * Rotates through a list of phrases on a fixed interval (PBI-274).
 *
 * Returns the index of the phrase currently active. The caller renders the
 * phrase and animates the transition; this hook only owns the timing. The
 * interval is cleared on unmount and whenever its inputs change, so there is no
 * leaked timer. Lists with 0 or 1 phrases never schedule an interval, keeping
 * the single-phrase case static.
 */
export function useRotatingPhrase(count: number, intervalMs: number): number {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!shouldRotatePhrases(count, intervalMs)) return;

    const timer = setInterval(() => {
      setIndex((current) => nextPhraseIndex(current, count));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [count, intervalMs]);

  // Guard against a shrinking list leaving the index out of range.
  return count > 0 ? index % count : 0;
}
