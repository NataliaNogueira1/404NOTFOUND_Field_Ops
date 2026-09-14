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
