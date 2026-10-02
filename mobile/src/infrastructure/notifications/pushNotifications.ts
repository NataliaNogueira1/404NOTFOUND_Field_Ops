import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiClient } from '@/infrastructure/api/client';

type NotificationData = { inspectionId?: unknown };

/**
 * Expo Go dropped remote push notifications in SDK 53, so touching the
 * expo-notifications native module there throws and crashes app startup.
 * Detect Expo Go (executionEnvironment === 'storeClient') and skip every push
 * call; the feature works normally on development builds and production.
 * See https://docs.expo.dev/develop/development-builds/introduction/.
 */
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Registering the handler reaches into the native module, so guard it too —
// otherwise importing this file under Expo Go crashes before any screen loads.
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerPushToken(accessToken: string): Promise<void> {
  if (isExpoGo || Platform.OS === 'web') return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('inspections', {
      name: 'Inspeções atribuídas',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const permission = await Notifications.getPermissionsAsync();
  const finalStatus = permission.status === 'granted'
    ? permission.status
    : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;
  const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await apiClient.post('/api/v1/devices/register', {
    pushToken,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
  }, accessToken);
}

export function inspectionIdFromNotification(notification: Notifications.Notification): string | null {
  const inspectionId = (notification.request.content.data as NotificationData | undefined)?.inspectionId;
  return typeof inspectionId === 'string' || typeof inspectionId === 'number'
    ? String(inspectionId)
    : null;
}

/** Whether push notifications are available in the current runtime (false in Expo Go). */
export function isPushAvailable(): boolean {
  return !isExpoGo;
}
