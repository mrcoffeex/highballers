import * as Haptics from "expo-haptics";
import { Platform, StyleSheet } from "react-native";

import { PlatformPressable } from "expo-router/build/react-navigation/elements";
import type { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs/types";

import { useTheme } from "../lib/ThemeProvider";
import { radius, withAlpha } from "../lib/theme";

export function TabBarButton({
  onPress,
  style,
  children,
  accessibilityState,
  ...rest
}: BottomTabBarButtonProps) {
  const { colors, isDark } = useTheme();
  const focused = accessibilityState?.selected;

  return (
    <PlatformPressable
      {...rest}
      accessibilityState={accessibilityState}
      style={[
        style,
        styles.item,
        focused && {
          backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.12),
          borderColor: withAlpha(colors.primary, isDark ? 0.42 : 0.28),
        },
      ]}
      onPress={(event) => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => undefined,
          );
        }
        onPress?.(event);
      }}
    >
      {children}
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  item: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    marginHorizontal: 2,
  },
});
