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

const ACTION_WIDTH = 80;

export type { SwipeableMethods };

type SwipeableMemberRowProps = {
  children: React.ReactNode;
  enabled: boolean;
  onKick: () => void;
  onBan: () => void;
  onSwipeOpen?: (methods: SwipeableMethods) => void;
  style?: StyleProp<ViewStyle>;
  /** Captain-only: assign or remove sub-captain (max 2 per club). */
  onSubCaptain?: () => void;
  isSubCaptain?: boolean;
  subCaptainAtCapacity?: boolean;
};

function SubCaptainAction({
  isSubCaptain,
  atCapacity,
  onPress,
  compact,
}: {
  isSubCaptain: boolean;
  atCapacity: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const disabled = atCapacity && !isSubCaptain;
  const label = isSubCaptain ? "Remove" : "+ Sub-Captain";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isSubCaptain ? "Remove sub-captain" : "Assign sub-captain"
      }
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        compact ? styles.webAction : styles.action,
        styles.subCaptainAction,
        disabled && styles.actionDisabled,
        pressed && !disabled && styles.actionPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={isSubCaptain ? "shield-outline" : "add-circle-outline"}
        size={compact ? 18 : 22}
        color={disabled ? colors.textDim : colors.accent}
      />
      <Text
        style={[
          styles.actionLabel,
          styles.subCaptainLabel,
          disabled && styles.actionLabelDisabled,
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SwipeableMemberRow({
  children,
  enabled,
  onKick,
  onBan,
  onSwipeOpen,
  style,
  onSubCaptain,
  isSubCaptain = false,
  subCaptainAtCapacity = false,
}: SwipeableMemberRowProps) {
  const swipeRef = useRef<SwipeableMethods>(null);
  const actionCount = onSubCaptain ? 3 : 2;
  const actionsWidth = ACTION_WIDTH * actionCount;

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
          {onSubCaptain ? (
            <SubCaptainAction
              compact
              isSubCaptain={isSubCaptain}
              atCapacity={subCaptainAtCapacity}
              onPress={onSubCaptain}
            />
          ) : null}
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
        <View style={[styles.actionsRow, { width: actionsWidth }]}>
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
          {onSubCaptain ? (
            <SubCaptainAction
              isSubCaptain={isSubCaptain}
              atCapacity={subCaptainAtCapacity}
              onPress={() => closeThen(onSubCaptain)}
            />
          ) : null}
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
  subCaptainAction: {
    backgroundColor: `${colors.accent}22`,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.cardBorder,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    ...typography.caption,
    fontWeight: "600",
    textAlign: "center",
    fontSize: 11,
  },
  actionLabelDisabled: {
    color: colors.textDim,
  },
  kickLabel: {
    color: colors.warning,
  },
  banLabel: {
    color: colors.error,
  },
  subCaptainLabel: {
    color: colors.accent,
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
