import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { getSupabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const exchangedCodes = new Set<string>();

export function resetOAuthExchangeState() {
  exchangedCodes.clear();
}

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function paramsHaveOAuthPayload(params: SearchParams): boolean {
  return !!(
    firstParam(params.code) ||
    firstParam(params.access_token) ||
    firstParam(params.error) ||
    firstParam(params.error_description)
  );
}

export function urlHasOAuthPayload(url: string): boolean {
  return /(?:[?&#])(?:code|access_token|error)=/.test(url);
}

export function getOAuthRedirectUri() {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/oauth-callback`;
    }

    const appUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (appUrl) {
      return `${appUrl}/oauth-callback`;
    }
  }

  const useDevRedirect =
    __DEV__ || Constants.appOwnership === "expo" || Constants.appOwnership === null;

  return makeRedirectUri({
    scheme: "highballers",
    path: "oauth-callback",
    preferLocalhost: useDevRedirect,
  });
}

/** Wait for Supabase to persist the session after code exchange (AsyncStorage). */
export async function waitForSupabaseSession(
  attempts = 8,
  delayMs = 250,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

export function buildCallbackHrefFromParams(params: SearchParams): string | null {
  if (!paramsHaveOAuthPayload(params)) return null;

  const search = new URLSearchParams();
  for (const key of [
    "code",
    "access_token",
    "refresh_token",
    "error",
    "error_description",
    "error_code",
  ] as const) {
    const value = firstParam(params[key]);
    if (value) search.set(key, value);
  }

  const qs = search.toString();
  if (!qs) return null;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/oauth-callback?${qs}`;
  }

  return Linking.createURL("oauth-callback", {
    scheme: "highballers",
    queryParams: Object.fromEntries(search.entries()),
  });
}

/** Resolve the OAuth return URL from deep links, router params, or the browser location. */
export async function resolveOAuthCallbackHref(options: {
  linkingUrl?: string | null;
  params?: SearchParams;
}): Promise<string | null> {
  const { linkingUrl = null, params = {} } = options;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const href = window.location.href;
    if (urlHasOAuthPayload(href)) return href;
  }

  if (linkingUrl && urlHasOAuthPayload(linkingUrl)) {
    return linkingUrl;
  }

  const fromRouterParams = buildCallbackHrefFromParams(params);
  if (fromRouterParams) return fromRouterParams;

  // Avoid stale cold-start URLs after logout/login (only when live params are empty).
  const hasLiveParams = paramsHaveOAuthPayload(params);
  if (!hasLiveParams && !linkingUrl) {
    try {
      const parsed = await Linking.parseInitialURLAsync();
      const parsedParams = (parsed.queryParams ?? {}) as SearchParams;

      if (parsedParams && paramsHaveOAuthPayload(parsedParams)) {
        const built = buildCallbackHrefFromParams(parsedParams);
        if (built) return built;
      }
    } catch {
      // parseInitialURLAsync can fail on some platforms; fall through.
    }

    const legacy = await Linking.getInitialURL();
    if (legacy && urlHasOAuthPayload(legacy)) {
      return legacy;
    }
  }

  return null;
}

export function serializeOAuthParams(params: SearchParams): string {
  const keys = [
    "code",
    "access_token",
    "refresh_token",
    "error",
    "error_description",
    "error_code",
  ] as const;
  return keys
    .map((key) => `${key}=${firstParam(params[key]) ?? ""}`)
    .join("&");
}

function parseAuthParams(url: string) {
  return QueryParams.getQueryParams(url);
}

export async function createSessionFromUrl(
  url: string,
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return "Cloud sync is not configured.";

  const { params, errorCode } = parseAuthParams(url);

  if (errorCode) return errorCode;
  if (params.error_description) return String(params.error_description);
  if (params.error) return String(params.error);

  if (params.code) {
    if (exchangedCodes.has(params.code)) {
      const { data } = await supabase.auth.getSession();
      return data.session ? null : "Sign in session expired. Please try again.";
    }

    exchangedCodes.add(params.code);

    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      exchangedCodes.delete(params.code);
      const { data } = await supabase.auth.getSession();
      if (data.session) return null;
      return error.message;
    }

    return null;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return error?.message ?? null;
  }

  const { data } = await supabase.auth.getSession();
  if (data.session) return null;

  return "No auth code or tokens found in redirect URL.";
}

export async function signInWithGoogle(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return "Cloud sync is not configured.";

  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== "web",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) return error.message;
  if (!data.url) return "Unable to start Google sign in.";

  if (Platform.OS === "web") {
    window.location.assign(data.url);
    return null;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: true,
  });

  if (result.type === "success" && result.url) {
    const sessionError = await createSessionFromUrl(result.url);
    if (!sessionError) return null;

    const { data } = await supabase.auth.getSession();
    if (data.session) return null;

    return sessionError;
  }

  if (result.type === "cancel" || result.type === "dismiss") {
    return null;
  }

  return "Google sign in was interrupted.";
}

export function getGoogleProfileHints(
  session: { user?: { user_metadata?: Record<string, unknown> } } | null,
) {
  const metadata = session?.user?.user_metadata;
  if (!metadata) {
    return { name: "", avatarUrl: undefined as string | undefined };
  }

  const name =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    "";

  const avatarUrl =
    (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
    (typeof metadata.picture === "string" && metadata.picture) ||
    undefined;

  return { name, avatarUrl };
}

export function clearOAuthCallbackUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.history.replaceState({}, document.title, "/");
  }
}
