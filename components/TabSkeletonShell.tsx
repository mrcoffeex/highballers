import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTabBarPadding } from "../lib/tabBar";
import { colors, getScreenGradient, spacing } from "../lib/theme";

interface TabSkeletonShellProps {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle;
}

export function TabSkeletonShell({
  children,
  padded = true,
  style,
}: TabSkeletonShellProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = useTabBarPadding(spacing.lg);

  return (
    <LinearGradient colors={getScreenGradient(colors)} style={styles.fill}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: bottomPadding,
            paddingHorizontal: padded ? spacing.lg : 0,
          },
          style,
        ]}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
