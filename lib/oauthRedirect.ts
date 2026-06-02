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
