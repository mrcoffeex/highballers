import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { isWithinStoryWindow } from "../lib/activityStories";
import {
  buildPeriodSummary,
  buildPersonalRecords,
  buildWeeklyActivity,
  filterGamesByPeriod,
  formatStatValue,
  STATS_PERIOD_LABELS,
  StatsPeriod,
} from "../lib/playerStats";
import { BASIC_MAX_GAME_HISTORY } from "../lib/subscription";
import { colors, radius, spacing, typography } from "../lib/theme";
import { BOX_SCORE_FIELDS, BOX_SCORE_LABELS } from "../lib/types";
import { usePlayerGameHistory } from "../store/hooks";
import { Button } from "./ui";
import { PlayerActivityCard } from "./PlayerActivityCard";

const PERIODS: StatsPeriod[] = ["week", "month", "year", "all"];

interface PlayerStatsDashboardProps {
  userId: string;
  isOwnProfile?: boolean;
  isPro?: boolean;
  onUpgrade?: () => void;
  onActivityPress?: (eventId: string) => void;
  onShareStory?: (recordId: string) => void;
}

export function PlayerStatsDashboard({
  userId,
  isOwnProfile = false,
  isPro = true,
  onUpgrade,
  onActivityPress,
  onShareStory,
}: PlayerStatsDashboardProps) {
  const allGames = usePlayerGameHistory(userId);
  const [period, setPeriod] = useState<StatsPeriod>("month");

  const periodGames = useMemo(
    () => filterGamesByPeriod(allGames, period),
    [allGames, period],
  );

  const summary = useMemo(() => buildPeriodSummary(periodGames), [periodGames]);
  const records = useMemo(() => buildPersonalRecords(allGames), [allGames]);
  const weeklyActivity = useMemo(
    () => buildWeeklyActivity(allGames),
    [allGames],
  );

  const maxVisible = isPro ? undefined : BASIC_MAX_GAME_HISTORY;
  const visibleGames = maxVisible
    ? periodGames.slice(0, maxVisible)
    : periodGames;
  const hiddenCount = Math.max(periodGames.length - visibleGames.length, 0);

  const maxWeekPoints = Math.max(
    ...weeklyActivity.map((week) => week.points),
    1,
  );
  const maxWeekGames = Math.max(...weeklyActivity.map((week) => week.games), 1);

  const prValues = useMemo(() => {
    const map = new Map<string, number>();
    for (const record of records) {
      map.set(record.field, record.value);
    }
    return map;
  }, [records]);

  if (allGames.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="analytics-outline" size={32} color={colors.textDim} />
        <Text style={styles.emptyTitle}>No recorded runs yet</Text>
        <Text style={styles.emptyText}>
          {isOwnProfile
            ? "Box scores from the scorekeeper will show up here — like Strava activities for the court."
            : "This baller has not logged a scored game yet."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodTabs}
      >
        {PERIODS.map((item) => {
          const selected = item === period;
          return (
            <Pressable
              key={item}
              style={[styles.periodTab, selected && styles.periodTabActive]}
              onPress={() => setPeriod(item)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  selected && styles.periodTabTextActive,
                ]}
              >
                {STATS_PERIOD_LABELS[item]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <LinearGradient
        colors={[`${colors.primary}22`, colors.card]}
        style={styles.summaryCard}
      >
        <Text style={styles.summaryLabel}>
          {STATS_PERIOD_LABELS[period]} summary
        </Text>
        <View style={styles.summaryGrid}>
          <SummaryTile
            label="Games"
            value={String(summary.games)}
            icon="basketball-outline"
          />
          <SummaryTile
            label="PPG"
            value={formatStatValue(summary.averages.points, 1)}
            icon="flame-outline"
          />
          <SummaryTile
            label="RPG"
            value={formatStatValue(summary.averages.rebounds, 1)}
            icon="arrow-up-circle-outline"
          />
          <SummaryTile
            label="APG"
            value={formatStatValue(summary.averages.assists, 1)}
            icon="git-network-outline"
          />
        </View>
        <View style={styles.totalsRow}>
          {BOX_SCORE_FIELDS.map((field) => (
            <View key={field} style={styles.totalPill}>
              <Text style={styles.totalKey}>{BOX_SCORE_LABELS[field]}</Text>
              <Text style={styles.totalVal}>{summary.totals[field]}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <Text style={styles.sectionSub}>Last 8 weeks</Text>
      </View>
      <View style={styles.chartCard}>
        <View style={styles.chartBars}>
          {weeklyActivity.map((week) => (
            <View key={week.label} style={styles.chartCol}>
              <View style={styles.chartBarTrack}>
                <View
                  style={[
                    styles.chartBarFill,
                    {
                      height: `${Math.max((week.points / maxWeekPoints) * 100, week.games > 0 ? 8 : 0)}%`,
                    },
                  ]}
                />
              </View>
              {week.games > 0 ? (
                <View
                  style={[
                    styles.chartDot,
                    { opacity: 0.4 + (week.games / maxWeekGames) * 0.6 },
                  ]}
                />
              ) : null}
              <Text style={styles.chartLabel}>{week.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendSwatch, { backgroundColor: colors.primary }]}
            />
            <Text style={styles.legendText}>Points</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: colors.secondary },
              ]}
            />
            <Text style={styles.legendText}>Games played</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal records</Text>
        <Text style={styles.sectionSub}>Career bests</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recordsRow}
      >
        {records.map((record) => (
          <View key={record.field} style={styles.recordCard}>
            <Text style={styles.recordLabel}>{record.label}</Text>
            <Text style={styles.recordValue}>{record.value}</Text>
            <Text style={styles.recordGame} numberOfLines={1}>
              {record.game.event?.title ?? "Game"}
            </Text>
            <Text style={styles.recordDate}>
              {format(
                new Date(record.game.event?.dateTime ?? record.game.recordedAt),
                "MMM d, yyyy",
              )}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent activities</Text>
        <Text style={styles.sectionSub}>
          {visibleGames.length} game{visibleGames.length !== 1 ? "s" : ""}
          {period !== "all"
            ? ` · ${STATS_PERIOD_LABELS[period].toLowerCase()}`
            : ""}
        </Text>
      </View>

      {visibleGames.map((game) => (
        <PlayerActivityCard
          key={game.id}
          game={game}
          highlight={BOX_SCORE_FIELDS.find(
            (field) =>
              game.stats[field] > 0 &&
              game.stats[field] === prValues.get(field),
          )}
          onPress={
            onActivityPress && game.eventId
              ? () => onActivityPress(game.eventId)
              : undefined
          }
          onShareStory={
            onShareStory && isWithinStoryWindow(game.recordedAt)
              ? () => onShareStory(game.id)
              : undefined
          }
        />
      ))}

      {isOwnProfile && !isPro && hiddenCount > 0 && onUpgrade ? (
        <LinearGradient
          colors={[`${colors.secondary}18`, colors.card]}
          style={styles.lockedCard}
        >
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={colors.secondary}
          />
          <Text style={styles.lockedTitle}>
            {hiddenCount} more activit{hiddenCount !== 1 ? "ies" : "y"} this
            period
          </Text>
          <Text style={styles.lockedText}>
            All-Star unlocks your full stat history and social profile.
          </Text>
          <Button title="Unlock with All-Star" size="sm" onPress={onUpgrade} />
        </LinearGradient>
      ) : null}
    </View>
  );
}

function SummaryTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.summaryTile}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryTileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  periodTabs: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  periodTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  periodTabActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}18`,
  },
  periodTabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
  },
  periodTabTextActive: {
    color: colors.primary,
  },
  summaryCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    ...typography.label,
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryTile: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 4,
  },
  summaryValue: {
    ...typography.title,
    color: colors.text,
    fontSize: 22,
  },
  summaryTileLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.sm,
  },
  totalPill: {
    alignItems: "center",
    gap: 2,
  },
  totalKey: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 9,
  },
  totalVal: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sectionSub: {
    ...typography.caption,
    color: colors.textDim,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    gap: 4,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  chartBarTrack: {
    width: "100%",
    maxWidth: 28,
    height: 88,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBarFill: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    minHeight: 0,
  },
  chartDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    marginTop: 4,
  },
  chartLabel: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 8,
    marginTop: spacing.xs,
  },
  chartLegend: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  recordsRow: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  recordCard: {
    width: 120,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
    padding: spacing.md,
  },
  recordLabel: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 10,
  },
  recordValue: {
    ...typography.title,
    color: colors.secondary,
    fontSize: 28,
    marginVertical: spacing.xs,
  },
  recordGame: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
  },
  recordDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
    fontSize: 11,
  },
  lockedCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  lockedTitle: {
    ...typography.heading,
    color: colors.text,
    fontSize: 16,
    textAlign: "center",
  },
  lockedText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});
