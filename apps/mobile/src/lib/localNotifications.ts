import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDER_IDS = {
  morning: 'pts-morning',
  midday: 'pts-midday',
  evening: 'pts-evening',
} as const;

export type ReminderId = (typeof REMINDER_IDS)[keyof typeof REMINDER_IDS];

export { REMINDER_IDS };

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted ?? false;
}

export async function scheduleDailyReminders() {
  if (Platform.OS === 'web') return;
  const ok = await ensureNotificationPermission();
  if (!ok) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const triggers: { id: string; hour: number; minute: number; title: string; body: string }[] = [
    {
      id: REMINDER_IDS.morning,
      hour: 8,
      minute: 0,
      title: 'Good morning',
      body: 'Start with your quick check-in on Today.',
    },
    {
      id: REMINDER_IDS.midday,
      hour: 10,
      minute: 0,
      title: 'Read-out ready',
      body: 'Take a moment for your daily read-out.',
    },
    {
      id: REMINDER_IDS.evening,
      hour: 19,
      minute: 0,
      title: 'End of day',
      body: 'How did today go? Finish your evening check-in.',
    },
  ];

  for (const t of triggers) {
    await Notifications.scheduleNotificationAsync({
      identifier: t.id,
      content: { title: t.title, body: t.body, data: { screen: 'today' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: t.hour,
        minute: t.minute,
      },
    });
  }
}

export async function cancelDailyReminders() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelReminder(id: ReminderId) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

/** Cancel reminders whose linked Today tasks are already complete. */
export async function syncRemindersForProgress(progress: {
  checkInDone?: boolean;
  readoutDone?: boolean;
  eveningDone?: boolean;
  allMorningDone?: boolean;
}) {
  if (Platform.OS === 'web') return;
  if (progress.checkInDone) await cancelReminder(REMINDER_IDS.morning);
  if (progress.readoutDone) await cancelReminder(REMINDER_IDS.midday);
  if (progress.eveningDone) await cancelReminder(REMINDER_IDS.evening);
  if (progress.allMorningDone) {
    await cancelReminder(REMINDER_IDS.morning);
    await cancelReminder(REMINDER_IDS.midday);
  }
}

export async function registerPushTokenWithServer(authToken: string) {
  if (Platform.OS === 'web') return;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const { apiRegisterPushToken } = await import('@/lib/api');
    await apiRegisterPushToken(authToken, tokenData.data);
  } catch {
    /* device may lack push capability */
  }
}
