import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseEnabled } from './config';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseEnabled) return null;

  if (!client) {
    client = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }

  return client;
}

export function resetSupabaseClient() {
  client = null;
}
