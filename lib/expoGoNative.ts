import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

/** Native modules like worklets/reanimated are unavailable in Expo Go. */
export function isExpoGoNative(): boolean {
  return Platform.OS !== "web" && isRunningInExpoGo();
}
