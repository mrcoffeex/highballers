import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { PlatformPressable } from "expo-router/build/react-navigation/elements";
import type { BottomTabBarButtonProps } from "expo-router/build/react-navigation/bottom-tabs/types";

export function TabBarButton({
  onPress,
  style,
  children,
  ...rest
}: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...rest}
      style={style}
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
