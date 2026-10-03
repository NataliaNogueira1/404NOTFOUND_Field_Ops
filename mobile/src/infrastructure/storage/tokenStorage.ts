import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'fieldops_access_token';
const REFRESH_TOKEN_KEY = 'fieldops_refresh_token';

/**
 * On native (iOS/Android) we use SecureStore.
 * On web we fall back to sessionStorage (secure enough for dev/testing).
 */
const isWeb = Platform.OS === 'web';

const webStorage = {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  },
};

const store = {
  getItem: isWeb ? webStorage.getItem : SecureStore.getItemAsync,
  setItem: isWeb ? webStorage.setItem : SecureStore.setItemAsync,
  deleteItem: isWeb ? webStorage.deleteItem : SecureStore.deleteItemAsync,
};

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return store.getItem(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return store.getItem(REFRESH_TOKEN_KEY);
  },

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await store.setItem(ACCESS_TOKEN_KEY, accessToken);
    await store.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clearTokens(): Promise<void> {
    await store.deleteItem(ACCESS_TOKEN_KEY);
    await store.deleteItem(REFRESH_TOKEN_KEY);
  },
};
