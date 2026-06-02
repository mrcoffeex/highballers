import { isPushNotificationsSupportedEnvironment } from "./notificationsConfig";
import * as stub from "./notifications.stub";

export { isPushNotificationsSupportedEnvironment } from "./notificationsConfig";

async function loadImpl() {
  return import("./notifications.impl.native");
}

export async function registerForPushNotifications(userId?: string) {
  if (!isPushNotificationsSupportedEnvironment()) {
    return stub.registerForPushNotifications(userId);
  }
  return (await loadImpl()).registerForPushNotifications(userId);
}

export async function scheduleGameReminder(
  eventId: string,
  title: string,
  dateTime: string,
) {
  if (!isPushNotificationsSupportedEnvironment()) {
    return stub.scheduleGameReminder(eventId, title, dateTime);
  }
  return (await loadImpl()).scheduleGameReminder(eventId, title, dateTime);
}

export async function cancelGameReminder(eventId: string) {
  if (!isPushNotificationsSupportedEnvironment()) {
    return stub.cancelGameReminder(eventId);
  }
  return (await loadImpl()).cancelGameReminder(eventId);
}

export async function addNotificationResponseListener(
  handler: (payload: {
    eventId?: string;
    clubId?: string;
    url?: string;
  }) => void,
) {
  if (!isPushNotificationsSupportedEnvironment()) {
    return stub.addNotificationResponseListener(handler);
  }
  return (await loadImpl()).addNotificationResponseListener(handler);
}
