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

const ACTION_WIDTH = 80;

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
  style?: StyleProp<ViewStyle>;
  /** Captain-only: assign or remove sub-captain (max 2 per club). */
  onSubCaptain?: () => void;
  isSubCaptain?: boolean;
  subCaptainAtCapacity?: boolean;
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

function InlineMemberActions({
  onKick,
  onBan,
  onSubCaptain,
  isSubCaptain,
  subCaptainAtCapacity,
  styles,
  colors,
}: Pick<
  SwipeableMemberRowProps,
  | "onKick"
  | "onBan"
  | "onSubCaptain"
  | "isSubCaptain"
  | "subCaptainAtCapacity"
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
    containerStyle?: StyleProp<ViewStyle>;
    onSwipeableWillOpen?: () => void;
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
  style,
  onSubCaptain,
  isSubCaptain = false,
  subCaptainAtCapacity = false,
  styles,
  colors,
  Swipeable,
}: NativeSwipeableProps) {
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
    onSwipeOpen,
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
        {children}
        <InlineMemberActions
          onKick={onKick}
          onBan={onBan}
          onSubCaptain={onSubCaptain}
          isSubCaptain={isSubCaptain}
          subCaptainAtCapacity={subCaptainAtCapacity}
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
      backgroundColor: withAlpha(colors.warning, 0.14),
    },
    banAction: {
      backgroundColor: withAlpha(colors.error, 0.14),
    },
    subCaptainAction: {
      backgroundColor: withAlpha(colors.accent, 0.14),
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
      borderColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
  });
}
