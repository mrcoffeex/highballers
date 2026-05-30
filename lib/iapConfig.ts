import Constants from "expo-constants";
import { Platform } from "react-native";

/** App Store / Play Console subscription product ID — configure the same SKU in both stores. */
export const ALL_STAR_SUBSCRIPTION_ID =
  process.env.EXPO_PUBLIC_ALL_STAR_PRODUCT_ID ??
  Constants.expoConfig?.extra?.allStarProductId ??
  "com.highballers.app.all_star_monthly";

export const ANDROID_PACKAGE_NAME =
  Constants.expoConfig?.android?.package ?? "com.highballers.app";

export function isNativeStorePlatform(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/** Expo Go cannot load native IAP modules — use a development build. */
export function isIapSupportedEnvironment(): boolean {
  if (!isNativeStorePlatform()) return false;
  if (Constants.appOwnership === "expo") return false;
  return true;
}

export const SUBSCRIPTION_DISCLOSURE =
  "Payment is charged to your Apple ID or Google Play account at confirmation. " +
  "All-Star Baller renews automatically unless canceled at least 24 hours before the end of the current period. " +
  "Your account is charged for renewal within 24 hours prior to the end of the current period. " +
  "Manage or cancel anytime in your device subscription settings.";
