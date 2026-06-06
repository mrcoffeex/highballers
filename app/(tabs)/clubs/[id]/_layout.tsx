import { Stack } from "@/lib/expoRouter";

import { useTheme } from "../../../../lib/ThemeProvider";

export default function ClubDetailLayout() {
  const { colors } = useTheme();

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
      <Stack.Screen
        name="requests"
        options={{
          headerTitle: "Join Requests",
          headerTitleStyle: { color: colors.text },
        }}
      />
    </Stack>
  );
}
