import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getTierLabel } from "../lib/subscription";
import { SubscriptionTier } from "../lib/types";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../lib/theme";

interface SubscriptionBadgeProps {
  tier: SubscriptionTier;
  compact?: boolean;
  prominent?: boolean;
  onPress?: () => void;
}

export function SubscriptionBadge({
  tier,
  compact,
  prominent,
  onPress,
}: SubscriptionBadgeProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isPro = tier === "all_star";
  const label = getTierLabel(tier);

  const content = (
    <>
      <Ionicons
        name={isPro ? "star" : "person-outline"}
        size={prominent ? 14 : compact ? 11 : 12}
        color={isPro ? colors.secondary : colors.textMuted}
      />
      <Text
        style={[
          styles.text,
          compact && styles.textCompact,
          prominent && styles.textProminent,
          isPro && styles.textPro,
        ]}
      >
        {label}
      </Text>
      {!isPro && onPress ? (
        <Ionicons name="chevron-forward" size={12} color={colors.textDim} />
      ) : null}
    </>
  );

  const badgeStyle = [
    styles.badge,
    compact && styles.badgeCompact,
    prominent && styles.badgeProminent,
    isPro ? styles.badgePro : styles.badgeBasic,
    onPress && !isPro && styles.badgePressable,
  ];

  if (onPress && !isPro) {
    return (
      <Pressable onPress={onPress} style={badgeStyle}>
        {content}
      </Pressable>
    );
  }

  if (isPro && prominent) {
    return (
      <LinearGradient
        colors={[`${colors.secondary}33`, `${colors.secondary}12`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[badgeStyle, styles.badgeGradient]}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={badgeStyle}>{content}</View>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    badgeCompact: {
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeProminent: {
      paddingHorizontal: spacing.md,
      paddingVertical: 7,
      marginTop: 0,
    },
    badgeGradient: {
      borderColor: `${colors.secondary}66`,
    },
    badgePressable: {
      borderColor: `${colors.secondary}44`,
      backgroundColor: `${colors.secondary}10`,
    },
    badgeBasic: {
      borderColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
    badgePro: {
      borderColor: `${colors.secondary}66`,
      backgroundColor: `${colors.secondary}18`,
    },
    text: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "700",
    },
    textCompact: {
      fontSize: 10,
    },
    textProminent: {
      fontSize: 12,
    },
    textPro: {
      color: colors.secondary,
    },
  });
}
