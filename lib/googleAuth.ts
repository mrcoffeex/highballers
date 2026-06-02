import * as QueryParams from "expo-auth-session/build/QueryParams";
import { makeRedirectUri } from "expo-auth-session";
import Constants, { ExecutionEnvironment } from "expo-constants";
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

function nativeOAuthRedirectUri() {
  return Linking.createURL("oauth-callback", { scheme: "highballers" });
}

/** When true, OAuth uses exp://127.0.0.1:8081 (must match Metro --localhost + adb reverse). */
export function oauthPreferLocalhost(): boolean {
  const value = process.env.EXPO_PUBLIC_OAUTH_PREFER_LOCALHOST;
  return value === "true" || value === "1";
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

  // Preview / production native builds must use the app scheme, not exp://.
  if (Constants.executionEnvironment === ExecutionEnvironment.Standalone) {
    return nativeOAuthRedirectUri();
  }

  const useDevRedirect =
    __DEV__ ||
    Constants.appOwnership === "expo" ||
    Constants.appOwnership === null;

  if (!useDevRedirect) {
    return nativeOAuthRedirectUri();
  }

  if (process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI?.trim()) {
    return process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI.trim();
  }

  return makeRedirectUri({
    scheme: "highballers",
    path: "oauth-callback",
    preferLocalhost: oauthPreferLocalhost(),
  });
}

/** Redirect URLs to whitelist in Supabase Auth → URL Configuration. */
export function getOAuthRedirectUriHints(): string[] {
  const hints = new Set<string>([getOAuthRedirectUri(), nativeOAuthRedirectUri()]);

  if (Platform.OS === "web") {
    hints.add("http://localhost:8081/oauth-callback");
    hints.add("http://127.0.0.1:8081/oauth-callback");
  } else {
    hints.add(
      makeRedirectUri({
        scheme: "highballers",
        path: "oauth-callback",
        preferLocalhost: true,
      }),
    );
    hints.add(
      makeRedirectUri({
        scheme: "highballers",
        path: "oauth-callback",
        preferLocalhost: false,
      }),
    );
  }

  return [...hints];
}

export function buildOAuthTimeoutMessage(): string {
  const redirects = getOAuthRedirectUriHints();
  return [
    "Sign in timed out waiting for Google to return to the app.",
    "The redirect URL must match Metro (see OAuth redirect on the sign-in screen).",
    "In Supabase → Authentication → URL Configuration, add every redirect URL below (exact match):",
    ...redirects.map((uri) => `• ${uri}`),
    "Reload the app in Expo Go after changing Metro host (LAN vs localhost), then try again.",
  ].join("\n");
}

/** Wait for Supabase to persist the session after code exchange (AsyncStorage). */
export async function waitForSupabaseSession(
  attempts = 24,
  delayMs = 250,
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data: initial } = await supabase.auth.getSession();
  if (initial.session) return true;

  return new Promise((resolve) => {
    let settled = false;
    let pollCount = 0;

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      subscription.unsubscribe();
      clearInterval(interval);
      resolve(value);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(true);
    });

    const interval = setInterval(async () => {
      pollCount += 1;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        finish(true);
        return;
      }
      if (pollCount >= attempts) {
        finish(false);
      }
    }, delayMs);
  });
}

export function buildCallbackHrefFromParams(
  params: SearchParams,
): string | null {
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

  try {
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl && urlHasOAuthPayload(initialUrl)) {
      return initialUrl;
    }
  } catch {
    // getInitialURL can fail on some platforms; fall through.
  }

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
  return keys.map((key) => `${key}=${firstParam(params[key]) ?? ""}`).join("&");
}

function parseAuthParams(url: string) {
  return QueryParams.getQueryParams(url);
}

function watchOAuthCallbackUrl(timeoutMs = 30000) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let subscription: { remove: () => void } | null = null;
  let settled = false;

  const cleanup = () => {
    if (timeout) clearTimeout(timeout);
    subscription?.remove();
    timeout = null;
    subscription = null;
  };

  const promise = new Promise<string | null>((resolve) => {
    const finish = (url: string | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(url);
    };

    subscription = Linking.addEventListener("url", ({ url }) => {
      if (urlHasOAuthPayload(url)) finish(url);
    });

    timeout = setTimeout(() => finish(null), timeoutMs);
  });

  return {
    promise,
    stop: cleanup,
  };
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
      const hasSession = await waitForSupabaseSession();
      return hasSession ? null : "Sign in session expired. Please try again.";
    }

    exchangedCodes.add(params.code);

    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      exchangedCodes.delete(params.code);
      const hasSession = await waitForSupabaseSession(8, 200);
      if (hasSession) return null;
      return error.message;
    }

    const hasSession = await waitForSupabaseSession();
    return hasSession ? null : "Sign in session expired. Please try again.";
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

  const callbackWatcher = watchOAuthCallbackUrl();

  try {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
      showInRecents: true,
    });

    const callbackUrl =
      result.type === "success" && result.url
        ? result.url
        : await Promise.race([
            callbackWatcher.promise,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
          ]);

    if (callbackUrl) {
      const sessionError = await createSessionFromUrl(callbackUrl);
      if (!sessionError) return null;

      const { data } = await supabase.auth.getSession();
      if (data.session) return null;

      return sessionError;
    }

    const hasSession = await waitForSupabaseSession(12, 250);
    if (hasSession) return null;

    if (result.type === "cancel" || result.type === "dismiss") {
      return buildOAuthTimeoutMessage();
    }

    return "Google sign in was interrupted.";
  } finally {
    callbackWatcher.stop();
  }
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
