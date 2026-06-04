import Constants from "expo-constants";
import { Platform } from "react-native";

import { shouldEnableGoogleSignIn } from "./appEnvironmentPolicy";

export { shouldEnableGoogleSignIn } from "./appEnvironmentPolicy";

export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

export function isGoogleSignInEnabled(): boolean {
  return shouldEnableGoogleSignIn({
    isDev: __DEV__,
    isExpoGo: isExpoGo(),
    platformOs: Platform.OS,
    webHostname:
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.hostname
        : undefined,
  });
}
