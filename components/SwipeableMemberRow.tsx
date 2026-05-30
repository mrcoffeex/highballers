import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Swipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";

import { colors, radius, spacing, typography } from "../lib/theme";

const ACTION_WIDTH = 76;

export type { SwipeableMethods };

type SwipeableMemberRowProps = {
  children: React.ReactNode;
  enabled: boolean;
  onKick: () => void;
  onBan: () => void;
  onSwipeOpen?: (methods: SwipeableMethods) => void;
  style?: StyleProp<ViewStyle>;
};

export function SwipeableMemberRow({
  children,
  enabled,
  onKick,
  onBan,
  onSwipeOpen,
  style,
}: SwipeableMemberRowProps) {
  const swipeRef = useRef<SwipeableMethods>(null);

  const closeThen = (action: () => void) => {
    swipeRef.current?.close();
    action();
  };

  if (!enabled) {
    return <View style={[styles.wrapper, style]}>{children}</View>;
  }

  if (Platform.OS === "web") {
    return (
      <View style={[styles.wrapper, style]}>
        {children}
        <View style={styles.webActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kick member"
            style={({ pressed }) => [
              styles.webAction,
              styles.kickAction,
              pressed && styles.actionPressed,
            ]}
            onPress={onKick}
          >
            <Ionicons name="exit-outline" size={18} color={colors.warning} />
            <Text style={[styles.actionLabel, styles.kickLabel]}>Kick</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ban member"
            style={({ pressed }) => [
              styles.webAction,
              styles.banAction,
              pressed && styles.actionPressed,
            ]}
            onPress={onBan}
          >
            <Ionicons
              name="remove-circle-outline"
              size={18}
              color={colors.error}
            />
            <Text style={[styles.actionLabel, styles.banLabel]}>Ban</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootRight={false}
      rightThreshold={ACTION_WIDTH}
      containerStyle={[styles.swipeContainer, style]}
      onSwipeableWillOpen={() => {
        if (swipeRef.current) onSwipeOpen?.(swipeRef.current);
      }}
      renderRightActions={() => (
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kick member"
            style={({ pressed }) => [
              styles.action,
              styles.kickAction,
              pressed && styles.actionPressed,
            ]}
            onPress={() => closeThen(onKick)}
          >
            <Ionicons name="exit-outline" size={22} color={colors.warning} />
            <Text style={[styles.actionLabel, styles.kickLabel]}>Kick</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ban member"
            style={({ pressed }) => [
              styles.action,
              styles.banAction,
              pressed && styles.actionPressed,
            ]}
            onPress={() => closeThen(onBan)}
          >
            <Ionicons
              name="remove-circle-outline"
              size={22}
              color={colors.error}
            />
            <Text style={[styles.actionLabel, styles.banLabel]}>Ban</Text>
          </Pressable>
        </View>
      )}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  swipeContainer: {
    overflow: "hidden",
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
    width: ACTION_WIDTH * 2,
    height: "100%",
  },
  action: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  kickAction: {
    backgroundColor: `${colors.warning}22`,
  },
  banAction: {
    backgroundColor: `${colors.error}22`,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    ...typography.caption,
    fontWeight: "600",
  },
  kickLabel: {
    color: colors.warning,
  },
  banLabel: {
    color: colors.error,
  },
  webActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  webAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
