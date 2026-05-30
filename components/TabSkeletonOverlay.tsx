import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../lib/theme";
import { TabSkeletonShell } from "./TabSkeletonShell";

interface TabSkeletonOverlayProps {
  showDataLoading?: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

export function TabSkeletonOverlay({
  showDataLoading = false,
  skeleton,
  children,
}: TabSkeletonOverlayProps) {
  const showSkeleton = showDataLoading;

  return (
    <View style={styles.root}>
      {children}
      {showSkeleton ? (
        <View style={styles.overlay} pointerEvents="none">
          <TabSkeletonShell>{skeleton}</TabSkeletonShell>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});
