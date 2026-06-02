import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GameWithEvent, gamePerformanceScore } from "../lib/playerStats";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../lib/theme";
import { BOX_SCORE_FIELDS, BOX_SCORE_LABELS } from "../lib/types";

interface PlayerActivityCardProps {
  game: GameWithEvent;
  highlight?: keyof typeof BOX_SCORE_LABELS;
  onPress?: () => void;
  onShareStory?: () => void;
}

export function PlayerActivityCard({
  game,
  highlight,
  onPress,
  onShareStory,
}: PlayerActivityCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const title = game.event?.title ?? "Pickup game";
  const when = game.event?.dateTime ?? game.recordedAt;
  const score = gamePerformanceScore(game.stats);
  const topField = highlight ?? "points";

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="basketball" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.date}>
            {format(new Date(when), "EEE, MMM d · h:mm a")}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {onShareStory ? (
            <Pressable
              style={styles.shareBtn}
              onPress={(event) => {
                event.stopPropagation?.();
                onShareStory();
              }}
              hitSlop={8}
              accessibilityLabel="Share as story"
            >
              <Ionicons
                name="paper-plane-outline"
                size={18}
                color={colors.primary}
              />
            </Pressable>
          ) : null}
          <View style={styles.scoreWrap}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreLabel}>GAME</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {BOX_SCORE_FIELDS.map((field) => (
          <View
            key={field}
            style={[
              styles.statPill,
              field === topField &&
                game.stats[field] > 0 &&
                styles.statPillHighlight,
            ]}
          >
            <Text style={styles.statKey}>{BOX_SCORE_LABELS[field]}</Text>
            <Text style={styles.statVal}>{game.stats[field]}</Text>
          </View>
        ))}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: `${colors.primary}22`,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...typography.body,
      color: colors.text,
      fontWeight: "700",
    },
    date: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    shareBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: `${colors.primary}18`,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: `${colors.primary}33`,
    },
    scoreWrap: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    scoreValue: {
      ...typography.heading,
      color: colors.secondary,
      fontSize: 18,
    },
    scoreLabel: {
      ...typography.label,
      color: colors.textDim,
      fontSize: 8,
    },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    statPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    statPillHighlight: {
      borderWidth: 1,
      borderColor: `${colors.secondary}55`,
      backgroundColor: `${colors.secondary}14`,
    },
    statKey: {
      ...typography.label,
      color: colors.textDim,
      fontSize: 9,
    },
    statVal: {
      ...typography.caption,
      color: colors.text,
      fontWeight: "700",
      fontSize: 12,
    },
  });
}
