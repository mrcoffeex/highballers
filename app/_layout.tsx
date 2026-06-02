import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from "@/lib/expoRouter";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { AppSplashScreen } from "../components/AppSplashScreen";
import { GestureRoot } from "../components/GestureRoot";
import { isSupabaseEnabled } from "../lib/config";
import { syncActiveAllStarEntitlement } from "../lib/allStarPurchase";
import { isExpoGoNative } from "../lib/expoGoNative";
import { isIapSupportedEnvironment } from "../lib/iapConfig";
import { isPushNotificationsSupportedEnvironment } from "../lib/notificationsConfig";
import {
  registerForPushNotifications,
  setupNotificationResponseListener,
} from "../lib/notificationsLazy";
import { AppThemeProvider, useTheme } from "../lib/ThemeProvider";
import { useAppStore } from "../store/useAppStore";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutInner />
    </AppThemeProvider>
  );
}

function RootLayoutInner() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const bootstrappedRef = useRef(false);
  const hydrated = useAppStore((state) => state.hydrated);
  const authChecked = useAppStore((state) => state.authChecked);
  const authReady = useAppStore((state) => state.authReady);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const initAuth = useAppStore((state) => state.initAuth);
  const startSync = useAppStore((state) => state.startSync);
  const setHydrated = useAppStore((state) => state.setHydrated);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.surface,
        border: colors.cardBorder,
        text: colors.text,
        primary: colors.primary,
      },
    };
  }, [colors, isDark]);

  const headerScreenOptions = useMemo(
    () => ({
      headerTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.background },
      headerTitleStyle: { color: colors.text },
      headerBackTitle: "Back",
    }),
    [colors],
  );

  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
    }
  }, [hydrated, setHydrated]);

  useEffect(() => {
    initAuth().catch(() => undefined);
  }, [initAuth]);

  useEffect(() => {
    if (!isSupabaseEnabled || !authReady || !currentUserId) {
      return undefined;
    }

    const unsubscribe = startSync();
    return unsubscribe;
  }, [authReady, currentUserId, startSync]);

  useEffect(() => {
    if (!hydrated || !authReady) return;

    SplashScreen.hideAsync().catch(() => undefined);
  }, [authReady, hydrated]);

  useEffect(() => {
    if (!onboardingComplete || !currentUserId || !isIapSupportedEnvironment()) {
      return;
    }

    syncActiveAllStarEntitlement()
      .then((synced) => {
        if (synced) {
          void upgradeToAllStar();
        }
      })
      .catch(() => undefined);
  }, [currentUserId, onboardingComplete, upgradeToAllStar]);

  useEffect(() => {
    if (
      !isPushNotificationsSupportedEnvironment() ||
      !onboardingComplete ||
      !currentUserId
    ) {
      return;
    }

    registerForPushNotifications(currentUserId).catch(() => undefined);

    let removeListener = () => undefined;
    void setupNotificationResponseListener(({ eventId, clubId, url }) => {
      if (typeof url === "string" && url.startsWith("/")) {
        router.push(url as `/event/${string}`);
        return;
      }
      if (clubId) {
        router.push(`/chats/${clubId}`);
        return;
      }
      if (eventId) {
        router.push(`/event/${eventId}`);
      }
    }).then((unsubscribe) => {
      removeListener = unsubscribe;
    });

    return () => removeListener();
  }, [currentUserId, onboardingComplete, router]);

  const appReady = hydrated && authChecked && authReady;

  if (appReady) {
    bootstrappedRef.current = true;
  }

  const showSplashOverlay = !appReady && !bootstrappedRef.current;

  return (
    <GestureRoot style={[styles.root, { backgroundColor: colors.background }]}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: !isExpoGoNative(),
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" options={{ animation: "fade" }} />
          <Stack.Screen
            name="oauth-callback"
            options={{ animation: "fade", headerShown: false }}
          />
          <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          <Stack.Screen
            name="(tabs)"
            options={{
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="event/[id]"
            options={{
              ...headerScreenOptions,
              headerShown: true,
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="event/edit/[id]"
            options={{
              ...headerScreenOptions,
              headerShown: true,
              headerTitle: "Edit Game",
            }}
          />
          <Stack.Screen
            name="event/stats/[id]"
            options={{
              ...headerScreenOptions,
              headerShown: true,
              headerTitle: "Scorekeeper",
            }}
          />
          <Stack.Screen
            name="event/courts/[id]"
            options={{
              ...headerScreenOptions,
              headerShown: true,
              headerTitle: "Edit Courts",
            }}
          />
          <Stack.Screen
            name="event/create"
            options={{
              ...headerScreenOptions,
              headerShown: true,
              headerTitle: "New Game",
            }}
          />
          <Stack.Screen
            name="profile/edit"
            options={{
              ...headerScreenOptions,
              headerShown: true,
              headerTitle: "Edit Profile",
            }}
          />
          <Stack.Screen
            name="leaderboards/index"
            options={{
              ...headerScreenOptions,
              headerShown: true,
              headerTitle: "Leaderboards",
            }}
          />
          <Stack.Screen
            name="player/[id]"
            options={{
              ...headerScreenOptions,
              headerShown: true,
              headerTitle: "Player",
            }}
          />
          <Stack.Screen name="legal" options={{ headerShown: false }} />
        </Stack>
        {showSplashOverlay ? (
          <View
            style={[
              styles.splashOverlay,
              { backgroundColor: colors.background },
            ]}
          >
            <AppSplashScreen />
          </View>
        ) : null}
      </ThemeProvider>
    </GestureRoot>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
  },
});
