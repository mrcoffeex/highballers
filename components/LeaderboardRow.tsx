import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  formatLeaderboardValue,
  getLeaderboardValueLabel,
  LeaderboardCategory,
} from "../lib/leaderboards";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";
import { Club, UserProfile } from "../lib/types";
import { Avatar } from "./ui";
import { ClubIcon } from "./ClubIcon";

interface LeaderboardRowProps {
  rank: number;
  category: LeaderboardCategory;
  value: number;
  highlighted?: boolean;
  club?: Club;
  user?: UserProfile;
  subtitle?: string;
  onPress?: () => void;
}

export function LeaderboardRow({
  rank,
  category,
  value,
  highlighted,
  club,
  user,
  subtitle,
  onPress,
}: LeaderboardRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const title = club?.name ?? user?.nickname ?? user?.name ?? "Unknown";
  const valueLabel = getLeaderboardValueLabel(category);
  const formattedValue = formatLeaderboardValue(category, value);

  const rankBadgeStyle =
    rank === 1
      ? styles.rankGold
      : rank === 2
        ? styles.rankSilver
        : rank === 3
          ? styles.rankBronze
          : null;

  const trophyColor =
    rank === 1
      ? colors.secondary
      : rank === 2
        ? colors.textMuted
        : colors.primary;

  return (
    <Pressable
      style={[
        styles.row,
        highlighted && styles.rowHighlighted,
        rank <= 3 && styles.rowPodium,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.rankBadge, rankBadgeStyle]}>
        {rank <= 3 ? (
          <Ionicons name="trophy" size={14} color={trophyColor} />
        ) : (
          <Text style={styles.rankText}>{rank}</Text>
        )}
      </View>

      {club ? (
        <ClubIcon
          name={club.name}
          iconColor={club.iconColor}
          iconUrl={club.iconUrl}
          size={42}
        />
      ) : user ? (
        <Avatar
          name={user.name}
          color={user.avatarColor}
          size={42}
          imageUrl={user.avatarUrl}
        />
      ) : null}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : user ? (
          <Text style={styles.subtitle}>{user.position}</Text>
        ) : null}
      </View>

      <View style={styles.valueWrap}>
        <Text style={styles.value}>{formattedValue}</Text>
        <Text style={styles.valueLabel}>{valueLabel}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    rowHighlighted: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, 0.07),
    },
    rowPodium: {
      borderColor: withAlpha(colors.secondary, 0.27),
    },
    rankBadge: {
      width: 32,
      height: 32,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    rankGold: {
      backgroundColor: withAlpha(colors.secondary, 0.13),
      borderColor: withAlpha(colors.secondary, 0.4),
    },
    rankSilver: {
      backgroundColor: withAlpha(colors.textMuted, 0.09),
      borderColor: withAlpha(colors.textMuted, 0.33),
    },
    rankBronze: {
      backgroundColor: withAlpha(colors.primary, 0.09),
      borderColor: withAlpha(colors.primary, 0.33),
    },
    rankText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "800",
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
    },
    subtitle: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    valueWrap: {
      alignItems: "flex-end",
      minWidth: 52,
    },
    value: {
      ...typography.heading,
      color: colors.secondary,
      fontSize: 18,
    },
    valueLabel: {
      ...typography.label,
      color: colors.textDim,
      fontSize: 9,
    },
  });
}
