import { isPushNotificationsSupportedEnvironment } from "./notificationsConfig";

type NotificationsModule = typeof import("./notifications");

async function loadNotifications(): Promise<NotificationsModule> {
  return import("./notifications");
}

export async function registerForPushNotifications(userId?: string) {
  if (!isPushNotificationsSupportedEnvironment()) return null;
  const mod = await loadNotifications();
  return mod.registerForPushNotifications(userId);
}

export async function scheduleGameReminder(
  eventId: string,
  title: string,
  dateTime: string,
) {
  if (!isPushNotificationsSupportedEnvironment()) return null;
  const mod = await loadNotifications();
  return mod.scheduleGameReminder(eventId, title, dateTime);
}

export async function cancelGameReminder(eventId: string) {
  if (!isPushNotificationsSupportedEnvironment()) return undefined;
  const mod = await loadNotifications();
  return mod.cancelGameReminder(eventId);
}

export async function setupNotificationResponseListener(
  handler: (payload: {
    eventId?: string;
    clubId?: string;
    url?: string;
  }) => void,
) {
  if (!isPushNotificationsSupportedEnvironment()) {
    return () => undefined;
  }
  const mod = await loadNotifications();
  return mod.addNotificationResponseListener(handler);
}
