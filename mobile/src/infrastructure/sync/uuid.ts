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
 * Deterministic v4-shaped UUID derived from a seed (four FNV-1a 32-bit hashes
 * with different salts). The evidence upload endpoint requires a UUID
 * idempotency key, but the outbox row id is a readable string that must stay
 * stable across retries and app restarts (issue #229, RN-068). Deriving the UUID
 * from that id means a resend always carries the same key without storing it.
 * Not cryptographic: used only as an idempotency key.
 */
export function deterministicUuid(seed: string): string {
  const words = [0, 1, 2, 3].map((salt) => {
    let hash = (0x811c9dc5 ^ (salt * 0x9e3779b1)) >>> 0;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  });
  const hex = words.join('');
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
