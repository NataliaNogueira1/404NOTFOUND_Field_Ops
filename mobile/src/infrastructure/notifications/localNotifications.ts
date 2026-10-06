import Constants from 'expo-constants';
import { Platform } from 'react-native';
// Type-only import: erased at compile time, never loads the native module at
// runtime (safe under Expo Go). The actual module is required lazily — same
// lazy-load pattern used in pushNotifications.ts.
import type * as NotificationsModule from 'expo-notifications';

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

/** Notification id for the "on the due day" reminder (fires at 08:00). */
function dueDayId(inspectionId: string): string {
  return `local-due-${inspectionId}`;
}

/** Notification id for the "1 day before" reminder (fires at 17:00). */
function preReminderId(inspectionId: string): string {
  return `local-pre-${inspectionId}`;
}

// ─── Schedule helpers ──────────────────────────────────────────────────────────

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
 *   1. "On the due day"  → fires at 08:00 on `dueDate`
 *   2. "1 day before"   → fires at 17:00 the day before `dueDate`
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

  // Terminal or unexpected statuses: leave cancelled, do nothing else.
  if (TERMINAL_STATUSES.has(inspection.status)) return;

  // Only ASSIGNED and IN_PROGRESS get reminders.
  if (inspection.status !== 'ASSIGNED' && inspection.status !== 'IN_PROGRESS') return;

  try {
    await ensureAndroidChannel(notifications);

    const channelId =
      Platform.OS === 'android' ? 'inspections' : undefined;

    // ── 1. Due-day notification (08:00 on dueDate) ──────────────────────────
    const dueDayTrigger = buildTriggerDate(inspection.dueDate, 8, 0);
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

      const preTrigger = buildTriggerDate(dayBeforeStr, 17, 0);
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
