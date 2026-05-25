import { Stack } from 'expo-router';

import { colors } from '../../../lib/theme';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function ClubsLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Back',
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          headerShown: true,
          headerTitle: 'New Club',
          headerBackTitle: 'Back',
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
        }}
      />
    </Stack>
  );
}
