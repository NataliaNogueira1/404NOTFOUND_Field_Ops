import Constants from 'expo-constants';
import { Platform } from 'react-native';
// Type-only import: erased at compile time, never loads the native module at
// runtime (safe under Expo Go). The actual module is required lazily — same
// lazy-load pattern used in pushNotifications.ts.
import type * as NotificationsModule from 'expo-notifications';

import { notificationsStorage } from '@/infrastructure/storage/tokenStorage';

/**
 * Expo Go dropped local scheduling support in SDK 53. We follow the same
 * lazy-load pattern as pushNotifications.ts to avoid crashing under Expo Go.
 */
const isExpoGo = Constants.executionEnvironment === 'storeClient';

/** Whether local notifications can be scheduled in the current runtime. */
function isLocalNotificationsAvailable(): boolean {
  return !isExpoGo && Platform.OS !== 'web';
}

/** Lazily loads expo-notifications; returns null when unavailable. */
function loadNotifications(): typeof NotificationsModule | null {
  if (!isLocalNotificationsAvailable()) return null;
  return require('expo-notifications') as typeof NotificationsModule;
}

// ─── Channel setup ─────────────────────────────────────────────────────────────

let channelEnsured = false;

/**
 * Creates (or reuses) the Android notification channel for local reminders.
 * The channel id `inspections` is shared with push notifications so that all
 * inspection-related alerts follow the same user preference.
 */
async function ensureAndroidChannel(
  notifications: typeof NotificationsModule,
): Promise<void> {
  if (Platform.OS !== 'android' || channelEnsured) return;
  channelEnsured = true;

  const existing = await notifications.getNotificationChannelAsync('inspections');
  if (existing) return;

  await notifications.setNotificationChannelAsync('inspections', {
    name: 'Inspeções atribuídas',
    importance: notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
  });
}

// ─── Permission ────────────────────────────────────────────────────────────────

/**
 * Requests notification permission on first call.
 * Degrades gracefully: returns `false` without throwing when unavailable or
 * when the user denies.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const notifications = loadNotifications();
  if (!notifications) return false;

  try {
    const { status: existing } = await notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.warn('[localNotifications] Could not request permission:', err);
    return false;
  }
}

/** Snapshot of the notification state the profile screen needs to render. */
export interface NotificationSettings {
  /** The user's in-app preference (persisted), independent of OS permission. */
  enabled: boolean;
  /** Whether local notifications can run in this runtime (not Expo Go / web). */
  supported: boolean;
  /** Whether the OS permission is currently granted. */
  permissionGranted: boolean;
  /**
   * Whether we can still prompt for the OS permission. When `false` and not
   * granted, the user must enable it from the system settings.
   */
  canAskPermission: boolean;
}

/**
 * Reads the current notification settings (user preference + OS permission)
 * without prompting the user. Safe everywhere: returns sane defaults when the
 * runtime does not support local notifications.
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  const enabled = await notificationsStorage.isEnabled();
  const notifications = loadNotifications();

  if (!notifications) {
    return { enabled, supported: false, permissionGranted: false, canAskPermission: false };
  }

  try {
    const perm = await notifications.getPermissionsAsync();
    return {
      enabled,
      supported: true,
      permissionGranted: perm.status === 'granted',
      canAskPermission: perm.canAskAgain ?? false,
    };
  } catch (err) {
    console.warn('[localNotifications] Could not read permission state:', err);
    return { enabled, supported: true, permissionGranted: false, canAskPermission: false };
  }
}

/**
 * Turns local deadline reminders on or off from the profile screen (PBI-084).
 *
 * - When enabling: persists the preference, requests OS permission if needed,
 *   and reschedules reminders for the provided inspections. Returns the final
 *   settings so the UI can reflect a denied permission.
 * - When disabling: persists the preference and cancels every scheduled
 *   reminder.
 *
 * Never throws — notification failures must not break the settings screen.
 */
export async function setNotificationsEnabled(
  enabled: boolean,
  inspections: InspectionReminderInput[] = [],
): Promise<NotificationSettings> {
  if (enabled) {
    await notificationsStorage.enable();
    // Make sure the OS permission is in place before scheduling.
    await requestNotificationPermission();
    await rescheduleAllReminders(inspections);
  } else {
    await notificationsStorage.disable();
    await cancelAllInspectionReminders();
  }

  return getNotificationSettings();
}

/**
 * DEV-only helper: fires a sample local reminder after a few seconds so the
 * notification pipeline (permission, Android channel, tap-to-open) can be
 * verified without waiting for a real 08:00/17:00 trigger. Not used in
 * production flows.
 *
 * Returns `true` when the test notification was scheduled, `false` when the
 * runtime does not support it or permission is missing.
 */
export async function sendTestReminder(seconds = 5): Promise<boolean> {
  const notifications = loadNotifications();
  if (!notifications) return false;

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  try {
    await ensureAndroidChannel(notifications);
    const channelId = Platform.OS === 'android' ? 'inspections' : undefined;

    await notifications.scheduleNotificationAsync({
      identifier: 'local-test-reminder',
      content: {
        title: '🔔 Teste de lembrete',
        body: 'Esta é uma notificação local de teste do FieldOps.',
        data: { test: true },
      },
      trigger: {
        type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, seconds),
        ...(channelId ? { channelId } : {}),
      },
    });
    return true;
  } catch (err) {
    console.warn('[localNotifications] Failed to schedule test reminder:', err);
    return false;
  }
}

// ─── Inspection input type ─────────────────────────────────────────────────────

export interface InspectionReminderInput {
  id: string;
  title: string;
  /** ISO date string: 'YYYY-MM-DD' */
  dueDate: string;
  /** Optional time: 'HH:mm' */
  dueTime?: string;
  /** Inspection status string (InspectionStatus enum value) */
  status: string;
}

// Statuses that should NOT have reminders scheduled.
const TERMINAL_STATUSES = new Set([
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CANCELED',
  // Also treat DRAFT as terminal for reminders (not yet assigned to technician)
  'DRAFT',
]);

// ─── Identifier helpers ────────────────────────────────────────────────────────

/** Default hour for the due-day reminder when the inspection has no `dueTime`. */
const DEFAULT_DUE_HOUR = 8;
/** Hour for the "day before" reminder (fixed early-warning at 17:00). */
const PRE_REMINDER_HOUR = 17;

/** Notification id for the "on the due day" reminder. */
function dueDayId(inspectionId: string): string {
  return `local-due-${inspectionId}`;
}

/** Notification id for the "1 day before" reminder (fires at 17:00). */
function preReminderId(inspectionId: string): string {
  return `local-pre-${inspectionId}`;
}

// ─── Schedule helpers ──────────────────────────────────────────────────────────

/**
 * Parses an optional `HH:mm` time string.
 * Returns `null` when empty/absent or malformed, so callers can fall back to a
 * default hour. Accepts only valid 24h times (00:00–23:59).
 */
function parseDueTime(dueTime?: string): { hour: number; minute: number } | null {
  if (!dueTime) return null;

  const match = /^(\d{1,2}):(\d{2})$/.exec(dueTime.trim());
  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

/**
 * Build a Date object for a specific time on a given `YYYY-MM-DD` date.
 * Returns `null` if the resulting time is in the past.
 */
function buildTriggerDate(
  dateStr: string,
  hour: number,
  minute: number,
): Date | null {
  // Parse YYYY-MM-DD without timezone shifting.
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const trigger = new Date(year, month, day, hour, minute, 0, 0);
  return trigger > new Date() ? trigger : null;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Schedules up to two local reminders for a single inspection:
 *   1. "On the due day"  → fires at the inspection's `dueTime` ('HH:mm') on
 *                          `dueDate`, or at 08:00 when `dueTime` is absent/invalid.
 *   2. "1 day before"   → fires at 17:00 the day before `dueDate` (fixed
 *                          early-warning; independent of `dueTime`).
 *
 * - Only schedules for inspections in ASSIGNED or IN_PROGRESS status.
 * - Skips silently if the trigger date is already in the past.
 * - Cancels existing reminders first so rescheduling is always safe to call.
 */
export async function scheduleInspectionReminders(
  inspection: InspectionReminderInput,
): Promise<void> {
  const notifications = loadNotifications();
  if (!notifications) return;

  // Cancel any previous reminders before rescheduling (idempotent).
  await cancelInspectionReminders(inspection.id);

  // Respect the user's in-app preference (PBI-084). When reminders are turned
  // off in the profile screen, we leave everything cancelled and schedule
  // nothing — the OS permission may still be granted, but the user opted out.
  if (!(await notificationsStorage.isEnabled())) return;

  // Terminal or unexpected statuses: leave cancelled, do nothing else.
  if (TERMINAL_STATUSES.has(inspection.status)) return;

  // Only ASSIGNED and IN_PROGRESS get reminders.
  if (inspection.status !== 'ASSIGNED' && inspection.status !== 'IN_PROGRESS') return;

  try {
    await ensureAndroidChannel(notifications);

    const channelId =
      Platform.OS === 'android' ? 'inspections' : undefined;

    // ── 1. Due-day notification (at the inspection's dueTime, else 08:00) ───
    const dueTime = parseDueTime(inspection.dueTime);
    const dueHour = dueTime?.hour ?? DEFAULT_DUE_HOUR;
    const dueMinute = dueTime?.minute ?? 0;
    const dueDayTrigger = buildTriggerDate(inspection.dueDate, dueHour, dueMinute);
    if (dueDayTrigger) {
      await notifications.scheduleNotificationAsync({
        identifier: dueDayId(inspection.id),
        content: {
          title: '📋 Inspeção no prazo hoje',
          body: inspection.title,
          data: { inspectionId: inspection.id },
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.DATE,
          date: dueDayTrigger,
          ...(channelId ? { channelId } : {}),
        },
      });
    }

    // ── 2. Pre-reminder notification (17:00 the day before) ─────────────────
    // Build the "day before" by subtracting one day from the parsed date.
    const [yearStr, monthStr, dayStr] = inspection.dueDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const dayBefore = new Date(year, month, day - 1);
      const dayBeforeStr = [
        String(dayBefore.getFullYear()),
        String(dayBefore.getMonth() + 1).padStart(2, '0'),
        String(dayBefore.getDate()).padStart(2, '0'),
      ].join('-');

      const preTrigger = buildTriggerDate(dayBeforeStr, PRE_REMINDER_HOUR, 0);
      if (preTrigger) {
        await notifications.scheduleNotificationAsync({
          identifier: preReminderId(inspection.id),
          content: {
            title: '⏰ Inspeção vence amanhã',
            body: inspection.title,
            data: { inspectionId: inspection.id },
          },
          trigger: {
            type: notifications.SchedulableTriggerInputTypes.DATE,
            date: preTrigger,
            ...(channelId ? { channelId } : {}),
          },
        });
      }
    }
  } catch (err) {
    console.warn(
      `[localNotifications] Failed to schedule reminders for ${inspection.id}:`,
      err,
    );
  }
}

/**
 * Cancels both scheduled reminders for the given inspection.
 * Safe to call when no reminders exist (expo-notifications ignores unknown ids).
 */
export async function cancelInspectionReminders(
  inspectionId: string,
): Promise<void> {
  const notifications = loadNotifications();
  if (!notifications) return;

  try {
    await notifications.cancelScheduledNotificationAsync(dueDayId(inspectionId));
    await notifications.cancelScheduledNotificationAsync(preReminderId(inspectionId));
  } catch (err) {
    console.warn(
      `[localNotifications] Failed to cancel reminders for ${inspectionId}:`,
      err,
    );
  }
}

/** Cancels ALL locally scheduled inspection reminders. */
export async function cancelAllInspectionReminders(): Promise<void> {
  const notifications = loadNotifications();
  if (!notifications) return;

  try {
    await notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('[localNotifications] Failed to cancel all reminders:', err);
  }
}

/**
 * Reschedules reminders for the given list of inspections.
 * Called after a sync pull so the local schedule always reflects the latest
 * server data.  Errors are swallowed so they never break the sync flow.
 */
export async function rescheduleAllReminders(
  inspections: InspectionReminderInput[],
): Promise<void> {
  if (!isLocalNotificationsAvailable()) return;

  for (const inspection of inspections) {
    try {
      await scheduleInspectionReminders(inspection);
    } catch (err) {
      console.warn(
        `[localNotifications] rescheduleAllReminders error for ${inspection.id}:`,
        err,
      );
    }
  }
}
