export function getSupabaseUrl() {
  return process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
}

/** Prefer EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY; legacy anon key env is fallback only. */
export function getSupabasePublishableKey() {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

export const isSupabaseEnabled = Boolean(
  getSupabaseUrl() && getSupabasePublishableKey(),
);

/** Google Cloud OAuth 2.0 Web client ID — required for native Google Sign-In on Android/iOS. */
export function getGoogleWebClientId() {
  return process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "";
}

/** Google Cloud iOS client ID — required for native Google Sign-In on iOS builds. */
export function getGoogleIosClientId() {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? "";
}

export function isGoogleNativeSignInConfigured() {
  return Boolean(getGoogleWebClientId());
}

/** Reversed iOS client ID for @react-native-google-signin config plugin (com.googleusercontent.apps.*). */
export function getGoogleIosUrlScheme() {
  return process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim() ?? "";
}

export function isLegacyAnonKeyFallback() {
  return (
    !process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
    Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
  );
}
