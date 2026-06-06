import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "./ThemeProvider";
import { radius, spacing, withAlpha } from "./theme";

/** Balanced inner padding for the glass pill. */
export const TAB_BAR_VERTICAL_PADDING = spacing.sm;

/** Reserved space below icons where tab labels sit. */
export const TAB_LABEL_RESERVED_HEIGHT = 14;

/** Glass pill height for icon + label tabs. */
export const TAB_BAR_CONTENT_HEIGHT = 68;

export const TAB_BAR_FLOAT_MARGIN = spacing.md;

export const TAB_BAR_FLOAT_RADIUS = radius.xxl;

/** Prevent React Navigation from adding bottom inset inside the pill. */
export const TAB_BAR_SAFE_AREA_INSETS = { bottom: 0 } as const;

const HIDDEN_TAB_BAR_STYLE = { display: "none" } as const;

/** Hide the tab bar on full-screen nested routes (e.g. club chat thread). */
export function shouldHideTabBar(pathname: string): boolean {
  const parts = pathname.replace(/^\//, "").split("/").filter(Boolean);
  const chatsIndex = parts.indexOf("chats");
  return chatsIndex >= 0 && parts.length > chatsIndex + 1;
}

export function resolveTabBarStyle(
  pathname: string,
  visibleStyle: ReturnType<typeof useTabBarStyle>,
) {
  return shouldHideTabBar(pathname) ? HIDDEN_TAB_BAR_STYLE : visibleStyle;
}

export function useTabBarInsets() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 8 : 0,
  );

  return {
    bottomInset,
    height: TAB_BAR_CONTENT_HEIGHT,
    totalHeight: TAB_BAR_CONTENT_HEIGHT + TAB_BAR_FLOAT_MARGIN + bottomInset,
  };
}

export function useTabBarPadding(extra = spacing.md) {
  const { totalHeight } = useTabBarInsets();
  return totalHeight + extra;
}

export function useTabBarStyle() {
  const { isDark } = useTheme();
  const { bottomInset, height } = useTabBarInsets();
  const edgeColor = withAlpha(
    isDark ? "#FFFFFF" : "#000000",
    isDark ? 0.16 : 0.1,
  );

  return {
    position: "absolute" as const,
    left: TAB_BAR_FLOAT_MARGIN,
    right: TAB_BAR_FLOAT_MARGIN,
    bottom: bottomInset + TAB_BAR_FLOAT_MARGIN,
    height,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: edgeColor,
    borderRadius: TAB_BAR_FLOAT_RADIUS,
    paddingTop: TAB_BAR_VERTICAL_PADDING,
    paddingBottom: TAB_BAR_VERTICAL_PADDING,
    paddingHorizontal: spacing.xs,
    overflow: "hidden" as const,
    ...createFloatingTabBarShadow(isDark),
  };
}

function createFloatingTabBarShadow(isDark: boolean) {
  const opacity = isDark ? 0.28 : 0.1;

  if (Platform.OS === "web") {
    return { boxShadow: `0px 10px 28px rgba(0, 0, 0, ${opacity})` };
  }

  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: opacity,
    shadowRadius: 20,
    elevation: 12,
  };
}
