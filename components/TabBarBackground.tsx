import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

import { useTheme } from "../lib/ThemeProvider";
import { TAB_BAR_FLOAT_RADIUS } from "../lib/tabBar";
import { withAlpha } from "../lib/theme";

export function TabBarBackground() {
  const { colors, isDark } = useTheme();
  const glassTint = withAlpha(colors.surface, isDark ? 0.42 : 0.58);
  const edgeHighlight = withAlpha(
    isDark ? "#FFFFFF" : "#000000",
    isDark ? 0.14 : 0.08,
  );

  return (
    <View style={styles.container}>
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={72}
          tint={
            isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight"
          }
          style={StyleSheet.absoluteFill}
        />
      ) : Platform.OS === "android" ? (
        <BlurView
          blurMethod="dimezisBlurViewSdk31Plus"
          intensity={48}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backdropFilter: "saturate(180%) blur(20px)",
              WebkitBackdropFilter: "saturate(180%) blur(20px)",
            } as ViewStyle,
          ]}
        />
      )}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: glassTint }]}
      />
      <View
        pointerEvents="none"
        style={[styles.edge, { borderColor: edgeHighlight }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    borderRadius: TAB_BAR_FLOAT_RADIUS,
    overflow: "hidden",
  },
  edge: {
    ...StyleSheet.absoluteFill,
    borderRadius: TAB_BAR_FLOAT_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
