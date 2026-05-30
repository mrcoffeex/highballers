import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { savePushToken } from "./supabaseSync";
import { isSupabaseEnabled } from "./config";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId?: string) {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("game-reminders", {
      name: "Game Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync("club-chat", {
      name: "Club Chat",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 120, 120, 120],
    });
    await Notifications.setNotificationChannelAsync("club-games", {
      name: "Club Games",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 120, 200],
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  let token: string | null = null;

  try {
    const tokenData = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    token = tokenData.data;
  } catch {
    return null;
  }

  if (userId && isSupabaseEnabled && token) {
    await savePushToken(userId, token).catch(() => undefined);
  }

  return token;
}

export async function scheduleGameReminder(
  eventId: string,
  title: string,
  dateTime: string,
) {
  const gameTime = new Date(dateTime).getTime();
  const reminderTime = gameTime - 60 * 60 * 1000;

  if (reminderTime <= Date.now()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Game starting soon",
      body: `${title} starts in 1 hour. Lace up!`,
      data: { eventId, url: `/event/${eventId}` },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(reminderTime),
      channelId: Platform.OS === "android" ? "game-reminders" : undefined,
    },
    identifier: `game-reminder-${eventId}`,
  });
}

export async function cancelGameReminder(eventId: string) {
  await Notifications.cancelScheduledNotificationAsync(
    `game-reminder-${eventId}`,
  ).catch(() => undefined);
}

export function addNotificationResponseListener(
  handler: (payload: {
    eventId?: string;
    clubId?: string;
    url?: string;
  }) => void,
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      handler({
        eventId: typeof data?.eventId === "string" ? data.eventId : undefined,
        clubId: typeof data?.clubId === "string" ? data.clubId : undefined,
        url: typeof data?.url === "string" ? data.url : undefined,
      });
    },
  );

  return () => subscription.remove();
}
