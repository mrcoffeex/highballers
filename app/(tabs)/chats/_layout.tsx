import { Stack } from "@/lib/expoRouter";

import { colors } from "../../../lib/theme";

export default function ChatsLayout() {
  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
      }}
    >
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
