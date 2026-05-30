import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "./theme";

/** Icon + label area above the home-indicator safe area. */
export const TAB_BAR_CONTENT_HEIGHT =
  Platform.select({ ios: 49, android: 56, default: 56 }) ?? 56;

export function useTabBarInsets() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 8 : 0,
  );

  return {
    bottomInset,
    height: TAB_BAR_CONTENT_HEIGHT + bottomInset,
  };
}

export function useTabBarPadding(extra = 16) {
  const { height } = useTabBarInsets();
  return height + extra;
}

export function useTabBarStyle() {
  const { bottomInset, height } = useTabBarInsets();

  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
    height,
    paddingTop: spacing.xs,
    paddingBottom: bottomInset,
    ...createTabBarShadow(),
  };
}

function createTabBarShadow() {
  if (Platform.OS === "web") {
    return { boxShadow: "0px -6px 10px rgba(0, 0, 0, 0.2)" };
  }

  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 16,
  };
}
