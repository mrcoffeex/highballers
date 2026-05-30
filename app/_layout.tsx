import { DarkTheme, Stack, ThemeProvider, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { syncActiveAllStarEntitlement } from "../lib/allStarPurchase";
import { isIapSupportedEnvironment } from "../lib/iapConfig";
import { useEffect, useRef } from "react";

import { AppSplashScreen } from "../components/AppSplashScreen";
import {
  addNotificationResponseListener,
  registerForPushNotifications,
} from "../lib/notifications";
import { colors } from "../lib/theme";
import { useAppStore } from "../store/useAppStore";

SplashScreen.preventAutoHideAsync().catch(() => undefined);
SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.cardBorder,
    text: colors.text,
    primary: colors.primary,
  },
};

export default function RootLayout() {
  const router = useRouter();
  const bootstrappedRef = useRef(false);
  const hydrated = useAppStore((state) => state.hydrated);
  const authReady = useAppStore((state) => state.authReady);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const initAuth = useAppStore((state) => state.initAuth);
  const startSync = useAppStore((state) => state.startSync);
  const setHydrated = useAppStore((state) => state.setHydrated);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);

  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
    }
  }, [hydrated, setHydrated]);

  useEffect(() => {
    initAuth().catch(() => undefined);
  }, [initAuth]);

  useEffect(() => {
    const unsubscribe = startSync();
    return unsubscribe;
  }, [startSync]);

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
    if (Platform.OS === "web" || !onboardingComplete || !currentUserId) return;

    registerForPushNotifications(currentUserId).catch(() => undefined);
    const removeListener = addNotificationResponseListener(
      ({ eventId, clubId, url }) => {
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
      },
    );

    return removeListener;
  }, [currentUserId, onboardingComplete, router]);

  const appReady = hydrated && authReady;

  if (appReady) {
    bootstrappedRef.current = true;
  }

  if (!appReady && !bootstrappedRef.current) {
    return (
      <View style={styles.splashRoot}>
        <StatusBar style="light" />
        <AppSplashScreen />
      </View>
    );
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
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
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Back",
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="event/edit/[id]"
          options={{
            headerShown: true,
            headerTitle: "Edit Game",
            headerBackTitle: "Back",
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen
          name="event/stats/[id]"
          options={{
            headerShown: true,
            headerTitle: "Scorekeeper",
            headerBackTitle: "Back",
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen
          name="event/courts/[id]"
          options={{
            headerShown: true,
            headerTitle: "Edit Courts",
            headerBackTitle: "Back",
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen
          name="event/create"
          options={{
            headerShown: true,
            headerTitle: "New Game",
            headerBackTitle: "Back",
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen
          name="profile/edit"
          options={{
            headerShown: true,
            headerTitle: "Edit Profile",
            headerBackTitle: "Back",
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen
          name="leaderboards/index"
          options={{
            headerShown: true,
            headerTitle: "Leaderboards",
            headerBackTitle: "Back",
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen
          name="player/[id]"
          options={{
            headerShown: true,
            headerTitle: "Player",
            headerBackTitle: "Back",
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen name="legal" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
