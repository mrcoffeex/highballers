import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { isExpoGoNative } from "../lib/expoGoNative";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";

const ACTION_WIDTH = 84;

export type SwipeableMethods = {
  close: () => void;
  openLeft?: () => void;
  openRight?: () => void;
  reset?: () => void;
};

type SwipeableMemberRowProps = {
  children: React.ReactNode;
  enabled: boolean;
  onKick: () => void;
  onBan: () => void;
  onSwipeOpen?: (methods: SwipeableMethods) => void;
  onSwipeClose?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Captain-only: assign or remove sub-captain (max 2 per club). */
  onSubCaptain?: () => void;
  isSubCaptain?: boolean;
  subCaptainAtCapacity?: boolean;
  /** Current captain only: transfer captain role to this member. */
  onMakeCaptain?: () => void;
};

type ThemedActionStyles = ReturnType<typeof createStyles>;

function SubCaptainAction({
  isSubCaptain,
  atCapacity,
  onPress,
  compact,
  styles,
  colors,
}: {
  isSubCaptain: boolean;
  atCapacity: boolean;
  onPress: () => void;
  compact?: boolean;
  styles: ThemedActionStyles;
  colors: ThemeColors;
}) {
  const disabled = atCapacity && !isSubCaptain;
  const label = isSubCaptain ? "Remove" : "Sub-Cap";

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
        color={disabled ? colors.textDim : colors.primary}
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

function CaptainAction({
  onPress,
  compact,
  styles,
  colors,
}: {
  onPress: () => void;
  compact?: boolean;
  styles: ThemedActionStyles;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Make captain"
      style={({ pressed }) => [
        compact ? styles.webAction : styles.action,
        styles.captainAction,
        pressed && styles.actionPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons name="shield-checkmark-outline" size={compact ? 18 : 22} color={colors.warning} />
      <Text style={[styles.actionLabel, styles.captainLabel]} numberOfLines={2}>
        Captain
      </Text>
    </Pressable>
  );
}

function countSwipeActions(
  onSubCaptain?: () => void,
  onMakeCaptain?: () => void,
) {
  let count = 2;
  if (onSubCaptain) count += 1;
  if (onMakeCaptain) count += 1;
  return count;
}

function InlineMemberActions({
  onKick,
  onBan,
  onSubCaptain,
  isSubCaptain,
  subCaptainAtCapacity,
  onMakeCaptain,
  styles,
  colors,
}: Pick<
  SwipeableMemberRowProps,
  | "onKick"
  | "onBan"
  | "onSubCaptain"
  | "isSubCaptain"
  | "subCaptainAtCapacity"
  | "onMakeCaptain"
> & {
  styles: ThemedActionStyles;
  colors: ThemeColors;
}) {
  return (
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
        <Ionicons name="remove-circle-outline" size={18} color={colors.error} />
        <Text style={[styles.actionLabel, styles.banLabel]}>Ban</Text>
      </Pressable>
      {onSubCaptain ? (
        <SubCaptainAction
          compact
          isSubCaptain={isSubCaptain ?? false}
          atCapacity={subCaptainAtCapacity ?? false}
          onPress={onSubCaptain}
          styles={styles}
          colors={colors}
        />
      ) : null}
      {onMakeCaptain ? (
        <CaptainAction
          compact
          onPress={onMakeCaptain}
          styles={styles}
          colors={colors}
        />
      ) : null}
    </View>
  );
}

type NativeSwipeableProps = SwipeableMemberRowProps & {
  styles: ThemedActionStyles;
  colors: ThemeColors;
  Swipeable: React.ComponentType<{
    ref?: React.Ref<SwipeableMethods>;
    friction?: number;
    overshootRight?: boolean;
    rightThreshold?: number;
    activeOffsetX?: number | [number, number];
    failOffsetY?: number | [number, number];
    containerStyle?: StyleProp<ViewStyle>;
    childrenContainerStyle?: StyleProp<ViewStyle>;
    onSwipeableWillOpen?: () => void;
    onSwipeableClose?: () => void;
    renderRightActions?: () => React.ReactNode;
    children: React.ReactNode;
  }>;
};

function NativeSwipeableMemberRow({
  children,
  enabled,
  onKick,
  onBan,
  onSwipeOpen,
  onSwipeClose,
  style,
  onSubCaptain,
  isSubCaptain = false,
  subCaptainAtCapacity = false,
  onMakeCaptain,
  styles,
  colors,
  Swipeable,
}: NativeSwipeableProps) {
  const swipeRef = useRef<SwipeableMethods>(null);
  const actionCount = countSwipeActions(onSubCaptain, onMakeCaptain);
  const actionsWidth = ACTION_WIDTH * actionCount;

  const closeThen = (action: () => void) => {
    swipeRef.current?.close();
    action();
  };

  if (!enabled) {
    return <View style={[styles.wrapper, style]}>{children}</View>;
  }

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootRight={false}
      rightThreshold={Math.min(ACTION_WIDTH, actionsWidth * 0.35)}
      activeOffsetX={[-12, 12]}
      failOffsetY={[-10, 10]}
      containerStyle={[styles.swipeContainer, style]}
      childrenContainerStyle={styles.childContainer}
      onSwipeableWillOpen={() => {
        if (swipeRef.current) onSwipeOpen?.(swipeRef.current);
      }}
      onSwipeableClose={() => {
        onSwipeClose?.();
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
              styles={styles}
              colors={colors}
            />
          ) : null}
          {onMakeCaptain ? (
            <CaptainAction
              onPress={() => closeThen(onMakeCaptain)}
              styles={styles}
              colors={colors}
            />
          ) : null}
        </View>
      )}
    >
      {children}
    </Swipeable>
  );
}

export function SwipeableMemberRow(props: SwipeableMemberRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const {
    children,
    enabled,
    onKick,
    onBan,
    style,
    onSubCaptain,
    isSubCaptain,
    subCaptainAtCapacity,
    onMakeCaptain,
    onSwipeOpen,
    onSwipeClose,
  } = props;
  const [Swipeable, setSwipeable] = useState<
    NativeSwipeableProps["Swipeable"] | null
  >(null);

  useEffect(() => {
    if (isExpoGoNative() || Platform.OS === "web") return;

    void import("react-native-gesture-handler/ReanimatedSwipeable").then(
      (mod) => {
        setSwipeable(
          () => mod.default as unknown as NativeSwipeableProps["Swipeable"],
        );
      },
    );
  }, []);

  if (!enabled) {
    return <View style={[styles.wrapper, style]}>{children}</View>;
  }

  if (Platform.OS === "web" || isExpoGoNative() || !Swipeable) {
    return (
      <View style={[styles.wrapper, style]}>
        <View style={styles.webCardShell}>{children}</View>
        <InlineMemberActions
          onKick={onKick}
          onBan={onBan}
          onSubCaptain={onSubCaptain}
          isSubCaptain={isSubCaptain}
          subCaptainAtCapacity={subCaptainAtCapacity}
          onMakeCaptain={onMakeCaptain}
          styles={styles}
          colors={colors}
        />
      </View>
    );
  }

  return (
    <NativeSwipeableMemberRow
      {...props}
      styles={styles}
      colors={colors}
      Swipeable={Swipeable}
      onSwipeClose={onSwipeClose}
      onSwipeOpen={onSwipeOpen}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: spacing.sm,
    },
    swipeContainer: {
      overflow: "hidden",
      borderRadius: radius.lg,
    },
    childContainer: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
    },
    actionsRow: {
      flexDirection: "row",
      alignSelf: "stretch",
    },
    action: {
      width: ACTION_WIDTH,
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
    },
    kickAction: {
      backgroundColor: withAlpha(colors.warning, 0.18),
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: withAlpha(colors.warning, 0.35),
    },
    banAction: {
      backgroundColor: withAlpha(colors.error, 0.18),
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: withAlpha(colors.error, 0.35),
    },
    subCaptainAction: {
      backgroundColor: withAlpha(colors.primary, 0.14),
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: withAlpha(colors.primary, 0.3),
    },
    captainAction: {
      backgroundColor: withAlpha(colors.warning, 0.14),
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: withAlpha(colors.warning, 0.3),
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
      color: colors.primary,
    },
    captainLabel: {
      color: colors.warning,
    },
    webCardShell: {
      borderRadius: radius.lg,
      overflow: "hidden",
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
      borderColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
  });
}
