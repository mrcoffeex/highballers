/** Web stub — avoids loading expo-notifications (push token listener warnings on web). */

export async function registerForPushNotifications(_userId?: string) {
  return null;
}

export async function scheduleGameReminder(
  _eventId: string,
  _title: string,
  _dateTime: string,
) {
  return null;
}

export async function cancelGameReminder(_eventId: string) {
  return undefined;
}

export function addNotificationResponseListener(
  _handler: (payload: {
    eventId?: string;
    clubId?: string;
    url?: string;
  }) => void,
) {
  return () => undefined;
}
