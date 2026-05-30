import { Stack } from "expo-router";

import { colors } from "../../../../lib/theme";

export default function ClubDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerTitle: "" }} />
      <Stack.Screen
        name="members"
        options={{
          headerTitle: "Members",
          headerTitleStyle: { color: colors.text },
        }}
      />
    </Stack>
  );
}
