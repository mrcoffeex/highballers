import { Stack } from "@/lib/expoRouter";
import { useMemo } from "react";

import { useTheme } from "../../../lib/ThemeProvider";

export default function ChatsLayout() {
  const { colors } = useTheme();

  const screenOptions = useMemo(
    () => ({
      animation: "slide_from_right" as const,
      headerShown: true,
      headerBackTitle: "Back",
      headerTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.background },
    }),
    [colors],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[clubId]"
        options={{
          headerTitle: "Club Chat",
          headerTitleStyle: { color: colors.text },
        }}
      />
    </Stack>
  );
}
