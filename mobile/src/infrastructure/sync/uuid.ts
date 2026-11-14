/**
 * RFC 4122 version 4 UUID generator (pure JS).
 *
 * Hermes — the default engine on React Native 0.86 / Expo SDK 57 — does not
 * implement `crypto.randomUUID()` or `crypto.getRandomValues()` natively, so we
 * generate the UUID with `Math.random`. This value is only used as a sync
 * idempotency key (operationId), not for any security-sensitive purpose, so a
 * non-cryptographic source is acceptable here.
 */
export function randomUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Deterministic UUID-shaped id derived from a seed string.
 *
 * Unlike {@link randomUuidV4}, the same seed always produces the same value, so
 * it is safe to use as an idempotency key that must stay stable across retries
 * (RN-068). Used as a fallback for legacy outbox rows that were enqueued before
 * a stable operationId was persisted in their payload: deriving it from the
 * local entity id keeps every resend of that row mapping to the same server
 * operation, so the backend never creates a duplicate.
 *
 * Not cryptographic (FNV-1a hash seeding a small LCG) — only an idempotency key.
 */
export function stableUuidFromSeed(seed: string): string {
  // FNV-1a 32-bit hash of the seed, used to seed a tiny PRNG.
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  let state = hash >>> 0;
  const next = (): number => {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state;
  };
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = next() & 15;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
