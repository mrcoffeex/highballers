import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

/** Expo Go cannot register remote push tokens on Android (SDK 53+). Use a development build. */
export function isPushNotificationsSupportedEnvironment(): boolean {
  if (Platform.OS === "web") return false;
  if (isRunningInExpoGo()) return false;
  return true;
}
