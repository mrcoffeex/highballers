import { getSupabase, resetSupabaseClient } from './supabase';

let cachedResult: boolean | null = null;

export async function validateSupabaseConnection(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) {
    return 'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env';
  }

  if (cachedResult === true) return null;

  const { error } = await supabase.auth.getSession();

  if (error?.message?.toLowerCase().includes('invalid api key')) {
    return 'Invalid Supabase publishable key. Copy it from Supabase Dashboard → Project Settings → API → Publishable key (sb_publishable_...).';
  }

  if (error && !error.message.toLowerCase().includes('session')) {
    return error.message;
  }

  cachedResult = true;
  return null;
}

export function resetSupabaseValidationCache() {
  cachedResult = null;
  resetSupabaseClient();
}
