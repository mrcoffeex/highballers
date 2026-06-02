/** Web stub — avoids loading expo-notifications (push token listener warnings on web). */

export { isPushNotificationsSupportedEnvironment } from "./notificationsConfig";
export {
  addNotificationResponseListener,
  cancelGameReminder,
  registerForPushNotifications,
  scheduleGameReminder,
} from "./notifications.stub";
