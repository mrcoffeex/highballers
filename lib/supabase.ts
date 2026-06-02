import "../lib/cryptoPolyfill";
import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseEnabled,
} from "./config";

let client: SupabaseClient | null = null;
let appStateRegistered = false;

function registerAppStateAuthRefresh(supabase: SupabaseClient) {
  if (appStateRegistered || Platform.OS === "web") return;

  appStateRegistered = true;
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseEnabled) return null;

  if (!client) {
    const realtime =
      typeof WebSocket !== "undefined"
        ? { transport: WebSocket as typeof WebSocket }
        : undefined;

    client = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // OAuth is handled explicitly in lib/googleAuth (oauth-callback / WebBrowser).
        detectSessionInUrl: false,
      },
      ...(realtime ? { realtime } : {}),
    });

    registerAppStateAuthRefresh(client);
  }

  return client;
}

export function resetSupabaseClient() {
  client = null;
}
