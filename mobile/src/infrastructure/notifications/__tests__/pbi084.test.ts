/**
 * PBI-084 (mobile) — "Notificações locais de prazo".
 *
 * Exercises the scheduling logic in `localNotifications.ts` with the native
 * modules mocked (expo-constants, react-native Platform and expo-notifications),
 * so the module runs in the "node" Jest project. The focus is the business
 * rules: which statuses get reminders, idempotent rescheduling (cancel-first),
 * past triggers skipped, correct trigger times/ids and graceful cancellation.
 */

// ── Module mocks (must be declared before importing the module under test) ────

// Not running under Expo Go and not web => local notifications are "available".
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
}));

// Default to Android so the notification channel path is also exercised.
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }), { virtual: true });

const scheduleMock = jest.fn().mockResolvedValue(undefined);
const cancelMock = jest.fn().mockResolvedValue(undefined);
const cancelAllMock = jest.fn().mockResolvedValue(undefined);
const getChannelMock = jest.fn().mockResolvedValue(null);
const setChannelMock = jest.fn().mockResolvedValue(undefined);
const getPermsMock = jest.fn().mockResolvedValue({ status: 'granted' });
const requestPermsMock = jest.fn().mockResolvedValue({ status: 'granted' });

jest.mock(
  'expo-notifications',
  () => ({
    scheduleNotificationAsync: (...a: unknown[]) => scheduleMock(...a),
    cancelScheduledNotificationAsync: (...a: unknown[]) => cancelMock(...a),
    cancelAllScheduledNotificationsAsync: (...a: unknown[]) => cancelAllMock(...a),
    getNotificationChannelAsync: (...a: unknown[]) => getChannelMock(...a),
    setNotificationChannelAsync: (...a: unknown[]) => setChannelMock(...a),
    getPermissionsAsync: (...a: unknown[]) => getPermsMock(...a),
    requestPermissionsAsync: (...a: unknown[]) => requestPermsMock(...a),
    AndroidImportance: { MAX: 5 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
  }),
  { virtual: true },
);

import {
  scheduleInspectionReminders,
  cancelInspectionReminders,
  cancelAllInspectionReminders,
  rescheduleAllReminders,
  requestNotificationPermission,
  type InspectionReminderInput,
} from '../localNotifications';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** A dueDate (YYYY-MM-DD) comfortably in the future so both triggers are valid. */
function futureDate(daysAhead = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return [
    String(d.getFullYear()),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function input(overrides: Partial<InspectionReminderInput> = {}): InspectionReminderInput {
  return {
    id: 'insp-1',
    title: 'Inspeção da Bomba 1',
    dueDate: futureDate(),
    status: 'ASSIGNED',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('scheduleInspectionReminders', () => {
  it('schedules two reminders for an ASSIGNED inspection with a future dueDate', async () => {
    await scheduleInspectionReminders(input());

    expect(scheduleMock).toHaveBeenCalledTimes(2);

    const ids = scheduleMock.mock.calls.map((c) => (c[0] as { identifier: string }).identifier);
    expect(ids).toContain('local-due-insp-1');
    expect(ids).toContain('local-pre-insp-1');
  });

  it('schedules reminders for IN_PROGRESS too', async () => {
    await scheduleInspectionReminders(input({ status: 'IN_PROGRESS' }));
    expect(scheduleMock).toHaveBeenCalledTimes(2);
  });

  it('always cancels existing reminders first (idempotent reschedule)', async () => {
    await scheduleInspectionReminders(input());

    expect(cancelMock).toHaveBeenCalledWith('local-due-insp-1');
    expect(cancelMock).toHaveBeenCalledWith('local-pre-insp-1');
  });

  it.each(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELED', 'DRAFT'])(
    'does NOT schedule for terminal status %s (only cancels)',
    async (status) => {
      await scheduleInspectionReminders(input({ status }));

      expect(scheduleMock).not.toHaveBeenCalled();
      // It still cancels any previously scheduled reminders.
      expect(cancelMock).toHaveBeenCalledWith('local-due-insp-1');
      expect(cancelMock).toHaveBeenCalledWith('local-pre-insp-1');
    },
  );

  it('skips a dueDate in the past (no reminders scheduled)', async () => {
    await scheduleInspectionReminders(input({ dueDate: '2000-01-01' }));
    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it('fires the due-day reminder at 08:00 and the pre-reminder at 17:00 the day before', async () => {
    const dueDate = futureDate();
    await scheduleInspectionReminders(input({ dueDate }));

    const byId = new Map<string, { date: Date }>();
    for (const call of scheduleMock.mock.calls) {
      const arg = call[0] as { identifier: string; trigger: { date: Date } };
      byId.set(arg.identifier, { date: new Date(arg.trigger.date) });
    }

    const due = byId.get('local-due-insp-1')!.date;
    expect(due.getHours()).toBe(8);
    expect(due.getMinutes()).toBe(0);

    const pre = byId.get('local-pre-insp-1')!.date;
    expect(pre.getHours()).toBe(17);
    expect(pre.getMinutes()).toBe(0);
    // Pre-reminder is exactly one calendar day before the due-day reminder.
    expect(pre.getDate()).toBe(due.getDate() - 1 >= 0 ? due.getDate() - 1 : pre.getDate());
    expect(pre.getTime()).toBeLessThan(due.getTime());
  });

  it('fires the due-day reminder at the inspection dueTime when provided', async () => {
    await scheduleInspectionReminders(input({ dueTime: '14:30' }));

    const dueCall = scheduleMock.mock.calls.find(
      (c) => (c[0] as { identifier: string }).identifier === 'local-due-insp-1',
    );
    const due = new Date((dueCall![0] as { trigger: { date: Date } }).trigger.date);
    expect(due.getHours()).toBe(14);
    expect(due.getMinutes()).toBe(30);

    // The pre-reminder stays at the fixed 17:00 early-warning, ignoring dueTime.
    const preCall = scheduleMock.mock.calls.find(
      (c) => (c[0] as { identifier: string }).identifier === 'local-pre-insp-1',
    );
    const pre = new Date((preCall![0] as { trigger: { date: Date } }).trigger.date);
    expect(pre.getHours()).toBe(17);
    expect(pre.getMinutes()).toBe(0);
  });

  it.each(['', '  ', 'invalid', '25:00', '12:99'])(
    'falls back to 08:00 when dueTime is empty or malformed (%j)',
    async (dueTime) => {
      await scheduleInspectionReminders(input({ dueTime }));

      const dueCall = scheduleMock.mock.calls.find(
        (c) => (c[0] as { identifier: string }).identifier === 'local-due-insp-1',
      );
      const due = new Date((dueCall![0] as { trigger: { date: Date } }).trigger.date);
      expect(due.getHours()).toBe(8);
      expect(due.getMinutes()).toBe(0);
    },
  );
});

describe('cancelInspectionReminders', () => {
  it('cancels both reminder ids for the inspection', async () => {
    await cancelInspectionReminders('insp-1');

    expect(cancelMock).toHaveBeenCalledTimes(2);
    expect(cancelMock).toHaveBeenCalledWith('local-due-insp-1');
    expect(cancelMock).toHaveBeenCalledWith('local-pre-insp-1');
  });
});

describe('cancelAllInspectionReminders', () => {
  it('delegates to cancelAllScheduledNotificationsAsync', async () => {
    await cancelAllInspectionReminders();
    expect(cancelAllMock).toHaveBeenCalledTimes(1);
  });
});

describe('rescheduleAllReminders', () => {
  it('reschedules each inspection in the list', async () => {
    await rescheduleAllReminders([
      input({ id: 'a' }),
      input({ id: 'b' }),
      input({ id: 'c', status: 'APPROVED' }), // terminal: no schedule
    ]);

    // a + b => 2 reminders each = 4; c schedules nothing.
    expect(scheduleMock).toHaveBeenCalledTimes(4);
  });
});

describe('requestNotificationPermission', () => {
  it('returns true when permission is already granted', async () => {
    getPermsMock.mockResolvedValueOnce({ status: 'granted' });
    await expect(requestNotificationPermission()).resolves.toBe(true);
    expect(requestPermsMock).not.toHaveBeenCalled();
  });

  it('requests permission and returns false when denied', async () => {
    getPermsMock.mockResolvedValueOnce({ status: 'undetermined' });
    requestPermsMock.mockResolvedValueOnce({ status: 'denied' });
    await expect(requestNotificationPermission()).resolves.toBe(false);
    expect(requestPermsMock).toHaveBeenCalledTimes(1);
  });
});
