import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

import { colors } from '../lib/theme';
import { useAppStore } from '../store/useAppStore';

export default function RootLayout() {
  const hydrated = useAppStore((state) => state.hydrated);
  const setHydrated = useAppStore((state) => state.setHydrated);

  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
    }
  }, [hydrated, setHydrated]);

  if (!hydrated) {
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
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="club/[id]"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerTintColor: colors.primary,
            headerStyle: { backgroundColor: colors.background },
          }}
        />
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
          name="club/create"
          options={{
            headerShown: true,
            headerTitle: 'New Club',
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
