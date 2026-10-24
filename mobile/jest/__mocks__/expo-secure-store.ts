/**
 * In-memory mock of expo-secure-store for the "node" Jest project.
 *
 * The node project runs without a React Native / Expo runtime, so the native
 * SecureStore module is unavailable. This mock provides the same async API
 * backed by a plain Map, which is sufficient for the sync/storage tests.
 */
const store = new Map<string, string>();

export async function getItemAsync(key: string): Promise<string | null> {
  return store.get(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  store.set(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  store.delete(key);
}
