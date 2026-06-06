import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";

export type EventActionTone =
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

interface TonePalette {
  row: ViewStyle;
  iconWrap: ViewStyle;
  title: { color: string };
  iconColor: string;
  chevronColor: string;
}

interface EventActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  tone?: EventActionTone;
  disabled?: boolean;
  loading?: boolean;
  expanded?: boolean;
  onPress: () => void;
}

export function EventActionRow({
  icon,
  title,
  subtitle,
  tone = "neutral",
  disabled,
  loading,
  expanded,
  onPress,
}: EventActionRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tonePalette = useMemo(
    () => getTonePalette(colors, tone),
    [colors, tone],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        tonePalette.row,
        (pressed || expanded) && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={[styles.iconWrap, tonePalette.iconWrap]}>
        <Ionicons name={icon} size={20} color={tonePalette.iconColor} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, tonePalette.title]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={
          expanded != null
            ? expanded
              ? "chevron-up"
              : "chevron-down"
            : "chevron-forward"
        }
        size={18}
        color={tonePalette.chevronColor}
      />
    </Pressable>
  );
}

function getTonePalette(
  colors: ThemeColors,
  tone: EventActionTone,
): TonePalette {
  const palettes: Record<EventActionTone, TonePalette> = {
    primary: {
      row: {
        backgroundColor: colors.primaryContainer,
        borderColor: withAlpha(colors.primary, 0.35),
      },
      iconWrap: { backgroundColor: withAlpha(colors.primary, 0.2) },
      iconColor: colors.primary,
      title: { color: colors.onPrimaryContainer },
      chevronColor: colors.primary,
    },
    accent: {
      row: {
        backgroundColor: colors.tertiaryContainer,
        borderColor: withAlpha(colors.tertiary, 0.35),
      },
      iconWrap: { backgroundColor: withAlpha(colors.tertiary, 0.2) },
      iconColor: colors.tertiary,
      title: { color: colors.onTertiaryContainer },
      chevronColor: colors.tertiary,
    },
    success: {
      row: {
        backgroundColor: withAlpha(colors.success, 0.12),
        borderColor: withAlpha(colors.success, 0.35),
      },
      iconWrap: { backgroundColor: withAlpha(colors.success, 0.18) },
      iconColor: colors.success,
      title: { color: colors.text },
      chevronColor: colors.success,
    },
    warning: {
      row: {
        backgroundColor: withAlpha(colors.warning, 0.12),
        borderColor: withAlpha(colors.warning, 0.35),
      },
      iconWrap: { backgroundColor: withAlpha(colors.warning, 0.18) },
      iconColor: colors.warning,
      title: { color: colors.text },
      chevronColor: colors.warning,
    },
    danger: {
      row: {
        backgroundColor: colors.errorContainer,
        borderColor: withAlpha(colors.error, 0.4),
      },
      iconWrap: { backgroundColor: withAlpha(colors.error, 0.15) },
      iconColor: colors.error,
      title: { color: colors.onErrorContainer },
      chevronColor: colors.error,
    },
    neutral: {
      row: {
        backgroundColor: colors.surfaceContainerLow,
        borderColor: colors.outlineVariant,
      },
      iconWrap: { backgroundColor: colors.surfaceContainer },
      iconColor: colors.textMuted,
      title: { color: colors.text },
      chevronColor: colors.textDim,
    },
  };

  return palettes[tone];
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    rowPressed: {
      opacity: 0.9,
    },
    rowDisabled: {
      opacity: 0.45,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...typography.body,
      fontWeight: "600",
      fontSize: 15,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
      lineHeight: 17,
    },
  });
}
