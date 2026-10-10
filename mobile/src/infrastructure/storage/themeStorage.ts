import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Persists the theme preference (PBI-091). Reuses the same storage strategy as
 * tokenStorage: SecureStore on native, localStorage on web. No new dependency.
 */
const THEME_PREFERENCE_KEY = 'fieldops_theme_preference';

const isWeb = Platform.OS === 'web';

const webStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore: storage unavailable should never break the app.
    }
  },
};

const getItem = isWeb ? webStorage.getItem : SecureStore.getItemAsync;
const setItem = isWeb ? webStorage.setItem : SecureStore.setItemAsync;

export const themeStorage = {
  async getPreference(): Promise<string | null> {
    try {
      return await getItem(THEME_PREFERENCE_KEY);
    } catch {
      return null;
    }
  },

  async savePreference(preference: string): Promise<void> {
    try {
      await setItem(THEME_PREFERENCE_KEY, preference);
    } catch {
      // Ignore persistence errors.
    }
  },
};
