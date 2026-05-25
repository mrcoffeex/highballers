import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

import { addNotificationResponseListener, registerForPushNotifications } from '../lib/notifications';
import { colors } from '../lib/theme';
import { useAppStore } from '../store/useAppStore';

export default function RootLayout() {
  const router = useRouter();
  const hydrated = useAppStore((state) => state.hydrated);
  const authReady = useAppStore((state) => state.authReady);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);
  const initAuth = useAppStore((state) => state.initAuth);
  const startSync = useAppStore((state) => state.startSync);
  const setHydrated = useAppStore((state) => state.setHydrated);

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
    if (Platform.OS === 'web' || !onboardingComplete || !currentUserId) return;

    registerForPushNotifications(currentUserId).catch(() => undefined);
    const removeListener = addNotificationResponseListener((eventId) => {
      router.push(`/event/${eventId}`);
    });

    return removeListener;
  }, [currentUserId, onboardingComplete, router]);

  if (!hydrated || !authReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" options={{ animation: 'fade' }} />
        <Stack.Screen name="oauth-callback" options={{ animation: 'fade', headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="event/edit/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Edit Game',
            headerBackTitle: 'Back',
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen
          name="event/stats/[id]"
          options={{
            headerShown: true,
            headerTitle: 'Scorekeeper',
            headerBackTitle: 'Back',
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen
          name="event/create"
          options={{
            headerShown: true,
            headerTitle: 'New Game',
            headerBackTitle: 'Back',
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
        <Stack.Screen
          name="profile/edit"
          options={{
            headerShown: true,
            headerTitle: 'Edit Profile',
            headerBackTitle: 'Back',
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
            headerTitleStyle: { color: colors.text },
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
