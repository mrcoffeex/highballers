import { StyleSheet, Text, View } from "react-native";

import { calculatePlayerRating } from "../lib/teamBalancer";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";
import { POSITION_LABELS, UserProfile } from "../lib/types";
import { Avatar, Badge, Card } from "./ui";

interface PlayerCardProps {
  player: UserProfile;
  compact?: boolean;
  /** Removes bottom margin when nested in lists or swipe rows. */
  flush?: boolean;
  showRating?: boolean;
  badge?: { label: string; color?: string };
  onPress?: () => void;
}

export function PlayerCard({
  player,
  compact,
  flush,
  showRating = true,
  badge,
  onPress,
}: PlayerCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const rating = calculatePlayerRating(player.stats);

  return (
    <Card
      style={
        compact
          ? [styles.compactCard, flush && styles.compactCardFlush]
          : undefined
      }
      onPress={onPress}
    >
      <View style={styles.row}>
        <Avatar
          name={player.name}
          color={player.avatarColor}
          size={compact ? 40 : 52}
          imageUrl={player.avatarUrl}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{player.nickname ?? player.name}</Text>
          {!compact && player.nickname ? (
            <Text style={styles.fullName}>{player.name}</Text>
          ) : null}
          <View style={styles.meta}>
            <Badge label={player.position} color={colors.primary} />
            {badge ? (
              <Badge
                label={badge.label}
                color={badge.color ?? colors.warning}
              />
            ) : null}
            {!compact && showRating ? (
              <Text style={styles.rating}>OVR {rating}</Text>
            ) : null}
          </View>
        </View>
        {compact && showRating ? (
          <View style={styles.compactRating}>
            <Text style={styles.compactRatingLabel}>OVR</Text>
            <Text style={styles.compactRatingValue}>{rating}</Text>
          </View>
        ) : null}
      </View>
      {!compact ? (
        <Text style={styles.position}>{POSITION_LABELS[player.position]}</Text>
      ) : null}
    </Card>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    compactCard: {
      padding: spacing.sm + 4,
      marginBottom: spacing.sm,
    },
    compactCardFlush: {
      marginBottom: 0,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    info: {
      flex: 1,
    },
    name: {
      ...typography.heading,
      color: colors.text,
    },
    fullName: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    rating: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "700",
    },
    compactRating: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 44,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: withAlpha(colors.primary, 0.09),
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, 0.25),
    },
    compactRatingLabel: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 9,
    },
    compactRatingValue: {
      ...typography.heading,
      color: colors.primary,
      fontSize: 16,
      lineHeight: 18,
    },
    position: {
      ...typography.caption,
      color: colors.textDim,
      marginTop: spacing.sm,
    },
  });
}
