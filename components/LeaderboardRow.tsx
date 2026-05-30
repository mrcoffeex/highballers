import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  formatLeaderboardValue,
  getLeaderboardValueLabel,
  LeaderboardCategory,
} from "../lib/leaderboards";
import { colors, radius, spacing, typography } from "../lib/theme";
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

function rankStyle(rank: number) {
  if (rank === 1) return styles.rankGold;
  if (rank === 2) return styles.rankSilver;
  if (rank === 3) return styles.rankBronze;
  return null;
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
  const title = club?.name ?? user?.nickname ?? user?.name ?? "Unknown";
  const valueLabel = getLeaderboardValueLabel(category);
  const formattedValue = formatLeaderboardValue(category, value);

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
      <View style={[styles.rankBadge, rankStyle(rank)]}>
        {rank <= 3 ? (
          <Ionicons
            name="trophy"
            size={14}
            color={
              rank === 1
                ? colors.secondary
                : rank === 2
                  ? colors.text
                  : colors.primary
            }
          />
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

const styles = StyleSheet.create({
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
    backgroundColor: `${colors.primary}12`,
  },
  rowPodium: {
    borderColor: `${colors.secondary}44`,
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
    backgroundColor: `${colors.secondary}22`,
    borderColor: `${colors.secondary}66`,
  },
  rankSilver: {
    backgroundColor: `${colors.textMuted}18`,
    borderColor: `${colors.textMuted}55`,
  },
  rankBronze: {
    backgroundColor: `${colors.primary}18`,
    borderColor: `${colors.primary}55`,
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
