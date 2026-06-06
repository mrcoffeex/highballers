import { Stack } from "@/lib/expoRouter";

import { useTheme } from "../../../lib/ThemeProvider";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function ClubsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="create"
        options={{
          headerShown: true,
          headerTitle: "New Club",
          headerBackTitle: "Back",
          headerTintColor: colors.primary,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.text },
        }}
      />
    </Stack>
  );
}
