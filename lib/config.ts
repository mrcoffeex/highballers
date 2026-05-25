export function getSupabaseUrl() {
  return process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
}

/** Prefer EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY; legacy anon key env is fallback only. */
export function getSupabasePublishableKey() {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  );
}

export const isSupabaseEnabled = Boolean(getSupabaseUrl() && getSupabasePublishableKey());

export function isLegacyAnonKeyFallback() {
  return !process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY && Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}
