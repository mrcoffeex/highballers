import Constants from "expo-constants";
import { Platform } from "react-native";

import {
  getGoogleIosClientId,
  getGoogleIosUrlScheme,
  getGoogleWebClientId,
} from "./config";
import { getSupabase } from "./supabase";
import { canUseNativeGoogleSignIn } from "./googleNativeSignInPolicy";
import { waitForSupabaseSession } from "./googleAuth";

export { canUseNativeGoogleSignIn } from "./googleNativeSignInPolicy";

let configured = false;

export function usesNativeGoogleSignIn(): boolean {
  return canUseNativeGoogleSignIn({
    platformOs: Platform.OS,
    appOwnership: Constants.appOwnership,
    webClientId: getGoogleWebClientId(),
  });
}

export function getNativeGoogleSignInConfigError(): string | null {
  if (Platform.OS === "web" || Constants.appOwnership === "expo") {
    return null;
  }

  const webClientId = getGoogleWebClientId();
  const iosClientId = getGoogleIosClientId();
  const iosUrlScheme = getGoogleIosUrlScheme();

  if (!webClientId) {
    return [
      "Native Google Sign-In is not configured.",
      "Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (Google Cloud Web client ID) in .env,",
      "push to EAS (npm run eas:env:push), then rebuild with npm run build:mobile.",
    ].join("\n");
  }

  if (Platform.OS === "ios") {
    if (!iosClientId) {
      return [
        "iOS Google Sign-In needs EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
        "(Google Cloud → iOS OAuth client for com.highballers.app).",
      ].join(" ");
    }

    if (!iosUrlScheme) {
      return [
        "iOS builds need EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME",
        "(reversed iOS client ID, e.g. com.googleusercontent.apps.XXXX).",
        "Set it before running EAS build so the config plugin is applied.",
      ].join(" ");
    }
  }

  return null;
}

function formatSupabaseGoogleError(message: string): string {
  if (/nonce/i.test(message)) {
    return `${message}\nEnable Skip Nonce Check in Supabase → Authentication → Providers → Google.`;
  }

  return message;
}

/** Native Google Sign-In → Supabase signInWithIdToken. Requires a dev/preview/store build. */
export async function signInWithGoogleNative(): Promise<string | null> {
  if (!usesNativeGoogleSignIn()) {
    return "Native Google Sign-In is unavailable in this environment.";
  }

  const webClientId = getGoogleWebClientId();
  if (!webClientId) {
    return getNativeGoogleSignInConfigError();
  }

  const iosClientId = getGoogleIosClientId();
  const configError = getNativeGoogleSignInConfigError();
  if (configError) return configError;

  const supabase = getSupabase();
  if (!supabase) return "Cloud sync is not configured.";

  const { GoogleSignin, isSuccessResponse, statusCodes } = await import(
    "@react-native-google-signin/google-signin"
  );

  if (!configured) {
    GoogleSignin.configure({
      webClientId,
      ...(Platform.OS === "ios" && iosClientId ? { iosClientId } : {}),
      offlineAccess: false,
    });
    configured = true;
  }

  try {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return null;
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return "Google did not return an ID token. Verify EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID matches your Google Cloud Web client.";
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) {
      return formatSupabaseGoogleError(error.message);
    }

    const hasSession = await waitForSupabaseSession();
    return hasSession ? null : "Sign in session expired. Please try again.";
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (/native module|TurboModuleRegistry|RNGoogleSignin/i.test(message)) {
      return [
        "Native Google Sign-In is not in this build.",
        "Run npm run build:apk, install the new APK (com.highballers.app), then try again.",
      ].join(" ");
    }

    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : undefined;

    if (code === statusCodes.SIGN_IN_CANCELLED) return null;
    if (code === statusCodes.IN_PROGRESS) {
      return "Google sign in is already in progress.";
    }
    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return "Google Play Services is not available on this device.";
    }

    if (code === "10" || /DEVELOPER_ERROR/i.test(message)) {
      return [
        "Google Sign-In configuration error (DEVELOPER_ERROR).",
        "Google Cloud needs an Android OAuth client for com.highballers.app",
        "with the SHA-1 from your EAS preview keystore.",
        "Run: npm run google:android-setup",
        "Use the Web client ID (not Android) in EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.",
      ].join("\n");
    }

    return error instanceof Error ? error.message : "Google sign in failed.";
  }
}
