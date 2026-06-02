import { Stack } from "@/lib/expoRouter";

import { colors } from "../../lib/theme";

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }} />
      <Stack.Screen name="terms" options={{ title: "Terms & Conditions" }} />
    </Stack>
  );
}
