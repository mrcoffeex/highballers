import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ActivityStorySlide as StorySlide } from "../lib/activityStories";
import { colors, radius, spacing, typography } from "../lib/theme";
import { BOX_SCORE_FIELDS, BOX_SCORE_LABELS, UserProfile } from "../lib/types";
import { Avatar } from "./ui";

interface ActivityStorySlideProps {
  slide: StorySlide;
  user: UserProfile;
}

export const ActivityStoryCanvas = forwardRef<View, ActivityStorySlideProps>(
  function ActivityStoryCanvas({ slide, user }, ref) {
    const title = slide.game.event?.title ?? "Pickup game";
    const when = slide.game.event?.dateTime ?? slide.recordedAt;
    const topStat = [...BOX_SCORE_FIELDS].sort(
      (a, b) => slide.game.stats[b] - slide.game.stats[a],
    )[0];

    return (
      <View ref={ref} style={styles.frame} collapsable={false}>
        <LinearGradient
          colors={["#1A1030", "#0A0E14", "#142238"]}
          locations={[0, 0.55, 1]}
          style={styles.gradient}
        >
          <View style={styles.courtLines}>
            <View style={styles.centerCircle} />
          </View>

          <View style={styles.topRow}>
            <Avatar
              name={user.name}
              color={user.avatarColor}
              size={44}
              imageUrl={user.avatarUrl}
            />
            <View style={styles.topInfo}>
              <Text style={styles.userName}>{user.nickname ?? user.name}</Text>
              <Text style={styles.meta}>
                {slide.clubName ? `${slide.clubName} · ` : ""}
                {format(new Date(when), "MMM d")}
              </Text>
            </View>
            <View style={styles.brandMark}>
              <Ionicons name="basketball" size={16} color={colors.primary} />
            </View>
          </View>

          <View style={styles.heroBlock}>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {title}
            </Text>
            <Text style={styles.heroLabel}>
              {BOX_SCORE_LABELS[topStat]} leader
            </Text>
            <Text style={styles.heroStat}>{slide.game.stats[topStat]}</Text>
            <View style={styles.gameScorePill}>
              <Text style={styles.gameScoreLabel}>GAME SCORE</Text>
              <Text style={styles.gameScoreValue}>
                {slide.performanceScore}
              </Text>
            </View>
          </View>

          <View style={styles.statGrid}>
            {BOX_SCORE_FIELDS.map((field) => (
              <View
                key={field}
                style={[
                  styles.statCell,
                  field === topStat && styles.statCellHighlight,
                ]}
              >
                <Text style={styles.statValue}>{slide.game.stats[field]}</Text>
                <Text style={styles.statKey}>{BOX_SCORE_LABELS[field]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.watermark}>HIGHBALLERS</Text>
        </LinearGradient>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  gradient: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  courtLines: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.12,
  },
  centerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  topInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    ...typography.heading,
    color: colors.text,
    fontSize: 17,
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}22`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  heroBlock: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  eventTitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroLabel: {
    ...typography.label,
    color: colors.secondary,
    fontSize: 11,
  },
  heroStat: {
    fontSize: 88,
    fontWeight: "900",
    color: colors.text,
    lineHeight: 92,
    letterSpacing: -2,
  },
  gameScorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
    backgroundColor: `${colors.secondary}18`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
  },
  gameScoreLabel: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 10,
  },
  gameScoreValue: {
    ...typography.heading,
    color: colors.secondary,
    fontSize: 20,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
  },
  statCell: {
    minWidth: 56,
    alignItems: "center",
    backgroundColor: `${colors.surface}99`,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statCellHighlight: {
    borderColor: `${colors.primary}66`,
    backgroundColor: `${colors.primary}18`,
  },
  statValue: {
    ...typography.heading,
    color: colors.text,
    fontSize: 22,
  },
  statKey: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 9,
    marginTop: 2,
  },
  watermark: {
    ...typography.label,
    color: colors.textDim,
    textAlign: "center",
    letterSpacing: 4,
    opacity: 0.7,
  },
});
