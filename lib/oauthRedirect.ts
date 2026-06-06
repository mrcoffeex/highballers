/** Must match Supabase Auth redirect allow list and app.json `scheme` + intent filters. */
export const NATIVE_OAUTH_REDIRECT_URI = "highballers://oauth-callback";

/** Prefer the live Metro redirect; stale EXPO_PUBLIC_OAUTH_REDIRECT_URI values break OAuth. */
export function pickOAuthRedirectUri(
  envRedirectUri: string | undefined,
  runtimeRedirectUri: string,
): string {
  const envUri = envRedirectUri?.trim();
  if (!envUri) return runtimeRedirectUri;
  if (envUri === runtimeRedirectUri) return envUri;
  return runtimeRedirectUri;
}

export type OAuthRedirectContext = {
  platformOs: string;
  appOwnership: "expo" | "guest" | null;
  windowOrigin?: string;
  appUrl?: string;
  envRedirectUri?: string;
  expoGoRedirectUri: string;
};

/** Resolve the redirect URL sent to Supabase as `redirectTo`. */
export function resolveOAuthRedirectUri(context: OAuthRedirectContext): string {
  if (context.platformOs === "web") {
    if (context.windowOrigin) {
      return `${context.windowOrigin.replace(/\/$/, "")}/oauth-callback`;
    }

    const appUrl = context.appUrl?.replace(/\/$/, "");
    if (appUrl) {
      return `${appUrl}/oauth-callback`;
    }

    return "http://localhost:8081/oauth-callback";
  }

  // Expo Go cannot register the app scheme; preview/store builds always use it.
  if (context.appOwnership === "expo") {
    return pickOAuthRedirectUri(
      context.envRedirectUri,
      context.expoGoRedirectUri,
    );
  }

  return NATIVE_OAUTH_REDIRECT_URI;
}

export function getRedirectToFromAuthorizeUrl(
  authorizeUrl: string,
): string | null {
  try {
    const value = new URL(authorizeUrl).searchParams.get("redirect_to");
    return value ? decodeURIComponent(value) : null;
  } catch {
    return null;
  }
}

export function buildRedirectRejectedMessage(requestedRedirect: string): string {
  return [
    `Supabase rejected redirect URL: ${requestedRedirect}`,
    "When a redirect is not on the allow list, Supabase sends users to Site URL (e.g. http://localhost:8081) instead of your app.",
    "In Supabase → Authentication → URL Configuration, add this exact URL:",
    requestedRedirect,
    "Optional wildcard: highballers://**",
  ].join("\n");
}
