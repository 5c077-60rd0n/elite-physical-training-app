import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface NativeNotificationStatus {
  isNative: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unknown';
  scheduledCount: number;
}

export async function getNativeNotificationStatus(): Promise<NativeNotificationStatus> {
  if (!Capacitor.isNativePlatform()) {
    return {
      isNative: false,
      permission: 'unknown',
      scheduledCount: 0,
    };
  }

  const permissions = await LocalNotifications.checkPermissions();
  const pending = await LocalNotifications.getPending();
  return {
    isNative: true,
    permission: permissions.display,
    scheduledCount: pending.notifications.length,
  };
}

export async function syncDailyTrainingReminder(enabled: boolean, time: string) {
  if (!Capacitor.isNativePlatform()) {
    return { scheduled: false, reason: 'Not running in a native wrapper.' };
  }

  await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

  if (!enabled) {
    return { scheduled: false, reason: 'Reminder disabled.' };
  }

  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') {
    return { scheduled: false, reason: 'Notification permission not granted.' };
  }

  const [hour, minute] = time.split(':').map(Number);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: 'Physical Climb',
        body: 'Daily training window is open. Log your session and keep the streak alive.',
        schedule: {
          on: {
            hour,
            minute,
          },
          repeats: true,
          allowWhileIdle: true,
        },
      },
    ],
  });

  return { scheduled: true };
}