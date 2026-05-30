import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import {
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRefreshControl } from "../lib/useRefreshControl";
import { colors, spacing, typography } from "../lib/theme";
import { useTabBarPadding } from "../lib/tabBar";

interface ScreenProps extends ScrollViewProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  refreshable?: boolean;
  onRefreshExtra?: () => void | Promise<void>;
}

export function Screen({
  children,
  title,
  subtitle,
  headerRight,
  scroll = true,
  padded = true,
  refreshable = true,
  onRefreshExtra,
  style,
  contentContainerStyle,
  refreshControl: refreshControlProp,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = useTabBarPadding(spacing.lg);
  const { refreshControl: defaultRefreshControl } = useRefreshControl(
    onRefreshExtra,
    refreshable,
  );

  const content = (
    <>
      {(title || subtitle || headerRight) && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
      )}
      {children}
    </>
  );

  const containerStyle = [
    styles.container,
    {
      paddingTop: insets.top + spacing.sm,
      paddingBottom: bottomPadding,
      paddingHorizontal: padded ? spacing.lg : 0,
    },
    style,
  ];

  if (!scroll) {
    return (
      <LinearGradient
        colors={[colors.background, "#0F1520"]}
        style={containerStyle}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background, "#0F1520"]} style={styles.flex}>
      <ScrollView
        style={[styles.flex, styles.scroll]}
        contentContainerStyle={[
          {
            paddingTop: insets.top + spacing.sm,
            paddingBottom: bottomPadding,
            paddingHorizontal: padded ? spacing.lg : 0,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControlProp ?? defaultRefreshControl}
        {...props}
      >
        {content}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
