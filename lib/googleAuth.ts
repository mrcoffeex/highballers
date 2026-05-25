import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { getSupabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const exchangedCodes = new Set<string>();

export function getOAuthRedirectUri() {
  return makeRedirectUri({
    scheme: 'highballers',
    path: 'oauth-callback',
  });
}

export async function getOAuthCallbackUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.href;
  }

  return Linking.getInitialURL();
}

function parseAuthParams(url: string) {
  return QueryParams.getQueryParams(url);
}

export async function createSessionFromUrl(url: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return 'Cloud sync is not configured.';

  const { params, errorCode } = parseAuthParams(url);

  if (errorCode) return errorCode;
  if (params.error_description) return String(params.error_description);
  if (params.error) return String(params.error);

  if (params.code) {
    if (exchangedCodes.has(params.code)) {
      const { data } = await supabase.auth.getSession();
      return data.session ? null : 'Sign in session expired. Please try again.';
    }

    exchangedCodes.add(params.code);

    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      exchangedCodes.delete(params.code);
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

  return 'No auth code or tokens found in redirect URL.';
}

export async function signInWithGoogle(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return 'Cloud sync is not configured.';

  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) return error.message;
  if (!data.url) return 'Unable to start Google sign in.';

  if (Platform.OS === 'web') {
    window.location.assign(data.url);
    return null;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
    showInRecents: true,
  });

  if (result.type === 'success' && result.url) {
    return createSessionFromUrl(result.url);
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return null;
  }

  return 'Google sign in was interrupted.';
}

export function getGoogleProfileHints(session: { user?: { user_metadata?: Record<string, unknown> } } | null) {
  const metadata = session?.user?.user_metadata;
  if (!metadata) {
    return { name: '', avatarUrl: undefined as string | undefined };
  }

  const name =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    '';

  const avatarUrl =
    (typeof metadata.avatar_url === 'string' && metadata.avatar_url) ||
    (typeof metadata.picture === 'string' && metadata.picture) ||
    undefined;

  return { name, avatarUrl };
}

export function clearOAuthCallbackUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState({}, document.title, '/oauth-callback');
  }
}
