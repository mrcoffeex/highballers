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
  if (AppState.currentState === "active") {
    void supabase.auth.startAutoRefresh();
  }
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

    const isWeb = Platform.OS === "web";

    client = createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: {
        ...(isWeb ? {} : { storage: AsyncStorage }),
        autoRefreshToken: true,
        persistSession: true,
        flowType: "pkce",
        // Web: full-page Google redirect must recover PKCE state from localStorage.
        // Native: oauth-callback / WebBrowser handle the return URL explicitly.
        detectSessionInUrl: isWeb,
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
