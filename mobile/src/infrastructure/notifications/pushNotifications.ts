import Constants from 'expo-constants';
import { Platform } from 'react-native';
// Type-only import: erased at compile time, so it never loads the native
// module at runtime (safe under Expo Go). The actual module is required lazily.
import type * as NotificationsModule from 'expo-notifications';

import { apiClient } from '@/infrastructure/api/client';

type NotificationData = { inspectionId?: unknown };
export type PushNotification = NotificationsModule.Notification;

/**
 * Expo Go dropped remote push notifications in SDK 53. Even *importing*
 * expo-notifications statically crashes app startup under Expo Go, so we never
 * import it at module scope — we lazily require() it only when push is actually
 * available (development builds / production). Expo Go is detected via
 * Constants.executionEnvironment === 'storeClient'.
 * See https://docs.expo.dev/develop/development-builds/introduction/.
 */
const isExpoGo = Constants.executionEnvironment === 'storeClient';

/** Whether push notifications are available in the current runtime (false in Expo Go / web). */
export function isPushAvailable(): boolean {
  return !isExpoGo && Platform.OS !== 'web';
}

/** Lazily loads expo-notifications; returns null when push is unavailable. */
function loadNotifications(): typeof NotificationsModule | null {
  if (!isPushAvailable()) return null;
  return require('expo-notifications') as typeof NotificationsModule;
}

let handlerConfigured = false;

/** Registers the foreground notification handler once, on first use. */
function ensureHandler(notifications: typeof NotificationsModule): void {
  if (handlerConfigured) return;
  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

export async function registerPushToken(accessToken: string): Promise<void> {
  const notifications = loadNotifications();
  if (!notifications) return;
  ensureHandler(notifications);

  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync('inspections', {
      name: 'Inspeções atribuídas',
      importance: notifications.AndroidImportance.HIGH,
    });
  }
  const permission = await notifications.getPermissionsAsync();
  const finalStatus = permission.status === 'granted'
    ? permission.status
    : (await notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;
  const pushToken = (await notifications.getExpoPushTokenAsync({ projectId })).data;
  await apiClient.post('/api/v1/devices/register', {
    pushToken,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
  }, accessToken);
}

/**
 * Subscribes to notification taps and forwards the inspection id to `onOpen`.
 * No-op (returns an empty cleanup) when push is unavailable. The expo-notifications
 * module is only required inside this function, keeping Expo Go safe.
 */
export function subscribeToNotificationTaps(onOpen: (inspectionId: string) => void): () => void {
  const notifications = loadNotifications();
  if (!notifications) return () => {};
  ensureHandler(notifications);

  function open(notification: PushNotification): void {
    const inspectionId = inspectionIdFromNotification(notification);
    if (inspectionId) onOpen(inspectionId);
  }
  const lastResponse = notifications.getLastNotificationResponse();
  if (lastResponse?.notification) open(lastResponse.notification);
  const subscription = notifications.addNotificationResponseReceivedListener((response) => {
    open(response.notification);
  });
  return () => subscription.remove();
}

export function inspectionIdFromNotification(notification: PushNotification): string | null {
  const inspectionId = (notification.request.content.data as NotificationData | undefined)?.inspectionId;
  return typeof inspectionId === 'string' || typeof inspectionId === 'number'
    ? String(inspectionId)
    : null;
}
