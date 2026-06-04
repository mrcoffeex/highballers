import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../lib/ThemeProvider";
import { Avatar } from "./ui";
import { UNASSIGNED_ROSTER_LABEL } from "../lib/eventRoster";
import { colors, radius, shadows, spacing, typography } from "../lib/theme";
import {
  BOX_SCORE_FIELDS,
  BOX_SCORE_LABELS,
  BoxScoreStats,
  EMPTY_BOX_SCORE,
  UserProfile,
} from "../lib/types";

interface GameStatsRecorderProps {
  participants: UserProfile[];
  teamA?: UserProfile[];
  teamB?: UserProfile[];
  courtLabel?: string;
  initialStats: Record<string, BoxScoreStats>;
  saving?: boolean;
  saved?: boolean;
  saveError?: string | null;
  refreshControl?: ScrollViewProps["refreshControl"];
  onSave: (
    statsByPlayer: Record<string, BoxScoreStats>,
  ) => void | Promise<void>;
}

const STAT_META: Record<
  keyof BoxScoreStats,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  points: { icon: "basketball", color: colors.primary },
  rebounds: { icon: "arrow-up-circle", color: colors.accent },
  assists: { icon: "git-network-outline", color: colors.success },
  blocks: { icon: "shield-checkmark", color: colors.secondary },
  steals: { icon: "flash", color: colors.warning },
};

function clampStat(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(99, Math.round(value));
}

const SECONDARY_STAT_FIELDS = BOX_SCORE_FIELDS.filter(
  (field) => field !== "points",
);

const SAVE_FAB_SIZE = 56;

function StatPad({
  field,
  value,
  featured,
  onIncrement,
  onDecrement,
}: {
  field: keyof BoxScoreStats;
  value: number;
  featured?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const meta = STAT_META[field];

  return (
    <View
      style={[
        styles.statPad,
        featured ? styles.statPadFeatured : styles.statPadCompact,
        { borderColor: `${meta.color}44` },
      ]}
    >
      <View
        style={[styles.statPadHeader, featured && styles.statPadHeaderFeatured]}
      >
        <View
          style={[styles.statIconWrap, { backgroundColor: `${meta.color}22` }]}
        >
          <Ionicons
            name={meta.icon}
            size={featured ? 20 : 18}
            color={meta.color}
          />
        </View>
        <Text style={[styles.statLabel, { color: meta.color }]}>
          {BOX_SCORE_LABELS[field]}
        </Text>
      </View>

      <Text style={[styles.statValue, featured && styles.statValueFeatured]}>
        {value}
      </Text>

      <View
        style={[styles.statControls, featured && styles.statControlsFeatured]}
      >
        <Pressable
          style={[styles.statBtn, featured && styles.statBtnFeatured]}
          onPress={onDecrement}
          hitSlop={6}
          accessibilityLabel={`Decrease ${BOX_SCORE_LABELS[field]}`}
        >
          <Ionicons name="remove" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={[
            styles.statBtn,
            styles.statBtnPrimary,
            featured && styles.statBtnFeatured,
            { backgroundColor: `${meta.color}33` },
          ]}
          onPress={onIncrement}
          hitSlop={6}
          accessibilityLabel={`Increase ${BOX_SCORE_LABELS[field]}`}
        >
          <Ionicons name="add" size={22} color={meta.color} />
        </Pressable>
      </View>
    </View>
  );
}

export function GameStatsRecorder({
  participants,
  teamA,
  teamB,
  courtLabel,
  initialStats,
  saving,
  saved,
  saveError,
  refreshControl,
  onSave,
}: GameStatsRecorderProps) {
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
  const roster = useMemo(() => {
    if (teamA?.length && teamB?.length) {
      return [...teamA, ...teamB];
    }
    return participants;
  }, [participants, teamA, teamB]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState<Record<string, BoxScoreStats>>({});

  const rosterKey = useMemo(
    () => roster.map((player) => player.id).join(","),
    [roster],
  );

  useEffect(() => {
    if (saving) return;

    const next: Record<string, BoxScoreStats> = {};
    for (const player of roster) {
      next[player.id] = initialStats[player.id] ?? { ...EMPTY_BOX_SCORE };
    }
    setDraft(next);
  }, [roster, rosterKey, initialStats, saving]);

  useEffect(() => {
    setActiveIndex(0);
  }, [roster]);

  const activePlayer = roster[activeIndex];
  const activeStats = activePlayer
    ? (draft[activePlayer.id] ?? EMPTY_BOX_SCORE)
    : EMPTY_BOX_SCORE;
  const activeTeamLabel = teamA?.some(
    (player) => player.id === activePlayer?.id,
  )
    ? "Team A"
    : teamB?.some((player) => player.id === activePlayer?.id)
      ? "Team B"
      : null;

  const isUnassignedRoster = courtLabel === UNASSIGNED_ROSTER_LABEL;
  const rosterAccent = isUnassignedRoster ? colors.warning : colors.primary;

  const totals = useMemo(() => {
    return BOX_SCORE_FIELDS.reduce(
      (acc, field) => {
        acc[field] = roster.reduce(
          (sum, player) => sum + (draft[player.id]?.[field] ?? 0),
          0,
        );
        return acc;
      },
      { ...EMPTY_BOX_SCORE },
    );
  }, [draft, roster]);

  const updateStat = (
    playerId: string,
    field: keyof BoxScoreStats,
    delta: number,
  ) => {
    setDraft((current) => {
      const currentStats = current[playerId] ?? { ...EMPTY_BOX_SCORE };
      return {
        ...current,
        [playerId]: {
          ...currentStats,
          [field]: clampStat(currentStats[field] + delta),
        },
      };
    });
  };

  const goToPlayer = (index: number) => {
    if (roster.length === 0) return;
    setActiveIndex((index + roster.length) % roster.length);
  };

  const renderPlayerChip = (
    item: UserProfile,
    index: number,
    teamColor: string,
  ) => {
    const selected = index === activeIndex;
    const stats = draft[item.id] ?? EMPTY_BOX_SCORE;

    return (
      <Pressable
        key={item.id}
        style={[
          styles.avatarChip,
          { borderColor: selected ? teamColor : `${teamColor}44` },
          selected && { backgroundColor: `${teamColor}22` },
        ]}
        onPress={() => setActiveIndex(index)}
        accessibilityLabel={`${item.name}, ${stats.points} points`}
      >
        <Avatar
          name={item.name}
          color={item.avatarColor}
          size={34}
          imageUrl={item.avatarUrl}
        />
        {stats.points > 0 ? (
          <View style={[styles.ptsBadge, { backgroundColor: teamColor }]}>
            <Text style={styles.ptsBadgeText}>{stats.points}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const renderTeamRow = (
    label: string,
    shortLabel: string,
    players: UserProfile[],
    teamColor: string,
    startIndex: number,
  ) => (
    <View style={styles.teamRow}>
      <View
        style={[
          styles.teamBadge,
          { backgroundColor: `${teamColor}18`, borderColor: `${teamColor}55` },
        ]}
      >
        <Text style={[styles.teamBadgeShort, { color: teamColor }]}>
          {shortLabel}
        </Text>
        <Text
          style={[styles.teamBadgeLabel, { color: teamColor }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <View style={styles.avatarGrid}>
        {players.map((player, index) =>
          renderPlayerChip(player, startIndex + index, teamColor),
        )}
      </View>
    </View>
  );

  const saveTitle = saved
    ? "Saved!"
    : courtLabel
      ? `Save ${courtLabel}`
      : "Save Box Score";
  const saveDisabled = saving || roster.length === 0;
  const scrollBottomInset =
    spacing.xl + SAVE_FAB_SIZE + spacing.lg + insets.bottom;

  const renderBottomChrome = () => (
    <>
      {roster.length > 0 ? (
        <View
          style={[
            styles.totalsBar,
            { paddingBottom: SAVE_FAB_SIZE / 2 + spacing.sm + insets.bottom },
          ]}
        >
          <View style={styles.totalsRow}>
            {BOX_SCORE_FIELDS.map((field) => (
              <View key={field} style={styles.totalItem}>
                <Text style={styles.totalKey}>{BOX_SCORE_LABELS[field]}</Text>
                <Text style={styles.totalVal}>{totals[field]}</Text>
              </View>
            ))}
          </View>
          {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
        </View>
      ) : saveError ? (
        <View
          style={[
            styles.totalsBar,
            { paddingBottom: SAVE_FAB_SIZE / 2 + spacing.sm + insets.bottom },
          ]}
        >
          <Text style={styles.saveError}>{saveError}</Text>
        </View>
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          styles.saveFabWrap,
          { bottom: spacing.md + insets.bottom },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.saveFab,
            saved && styles.saveFabSaved,
            saveDisabled && styles.saveFabDisabled,
            pressed && !saveDisabled && styles.saveFabPressed,
          ]}
          disabled={saveDisabled}
          accessibilityRole="button"
          accessibilityLabel={saveTitle}
          accessibilityHint="Save box score stats for this court"
          onPress={() => {
            void onSave(draft);
          }}
        >
          {saving ? (
            <ActivityIndicator color={themeColors.onPrimary} />
          ) : (
            <Ionicons
              name={saved ? "checkmark" : "checkmark-done"}
              size={26}
              color={saved ? themeColors.success : themeColors.onPrimary}
            />
          )}
        </Pressable>
      </View>
    </>
  );

  if (roster.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            No players on this court. Re-shuffle teams and try again.
          </Text>
        </View>
        {renderBottomChrome()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.playerPicker}>
        {teamA?.length && teamB?.length ? (
          <>
            {renderTeamRow("Team A", "A", teamA, colors.teamA, 0)}
            <View style={styles.teamDivider} />
            {renderTeamRow("Team B", "B", teamB, colors.teamB, teamA.length)}
          </>
        ) : (
          <View style={styles.singleTeamRow}>
            {isUnassignedRoster ? (
              <View
                style={[
                  styles.unassignedBadge,
                  { borderColor: `${colors.warning}55` },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={colors.warning}
                />
                <Text style={styles.unassignedBadgeText}>Substitute</Text>
              </View>
            ) : null}
            <View style={styles.avatarGrid}>
              {roster.map((player, index) =>
                renderPlayerChip(player, index, rosterAccent),
              )}
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomInset },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        nestedScrollEnabled
        refreshControl={refreshControl}
      >
        <View style={styles.activePlayerBar}>
          <Pressable
            style={styles.navBtn}
            onPress={() => goToPlayer(activeIndex - 1)}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.activePlayerCenter}>
            {isUnassignedRoster ? (
              <View
                style={[
                  styles.activeTeamPill,
                  {
                    backgroundColor: `${colors.warning}22`,
                    borderColor: `${colors.warning}66`,
                  },
                ]}
              >
                <Text
                  style={[styles.activeTeamPillText, { color: colors.warning }]}
                >
                  Substitutes
                </Text>
              </View>
            ) : activeTeamLabel ? (
              <View
                style={[
                  styles.activeTeamPill,
                  {
                    backgroundColor: `${activeTeamLabel === "Team A" ? colors.teamA : colors.teamB}22`,
                    borderColor: `${activeTeamLabel === "Team A" ? colors.teamA : colors.teamB}66`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.activeTeamPillText,
                    {
                      color:
                        activeTeamLabel === "Team A"
                          ? colors.teamA
                          : colors.teamB,
                    },
                  ]}
                >
                  {activeTeamLabel}
                </Text>
              </View>
            ) : null}
            {courtLabel ? (
              <Text style={styles.activeMeta}>{courtLabel}</Text>
            ) : null}
            <Text style={styles.activeName} numberOfLines={1}>
              {activePlayer?.name}
            </Text>
            <Text style={styles.activeSub}>
              {activeIndex + 1} of {roster.length}
              {activePlayer?.position ? ` · ${activePlayer.position}` : ""}
            </Text>
          </View>

          <Pressable
            style={styles.navBtn}
            onPress={() => goToPlayer(activeIndex + 1)}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.quickLine}>
          {BOX_SCORE_FIELDS.map((field) => (
            <View key={field} style={styles.quickItem}>
              <Text
                style={[styles.quickKey, { color: STAT_META[field].color }]}
              >
                {BOX_SCORE_LABELS[field]}
              </Text>
              <Text style={styles.quickVal}>{activeStats[field]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.padGrid}>
          <StatPad
            field="points"
            featured
            value={activeStats.points}
            onIncrement={() =>
              activePlayer && updateStat(activePlayer.id, "points", 1)
            }
            onDecrement={() =>
              activePlayer && updateStat(activePlayer.id, "points", -1)
            }
          />

          <View style={styles.secondaryGrid}>
            {SECONDARY_STAT_FIELDS.map((field) => (
              <View key={field} style={styles.secondaryGridCell}>
                <StatPad
                  field={field}
                  value={activeStats[field]}
                  onIncrement={() =>
                    activePlayer && updateStat(activePlayer.id, field, 1)
                  }
                  onDecrement={() =>
                    activePlayer && updateStat(activePlayer.id, field, -1)
                  }
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      </View>

      {renderBottomChrome()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  emptyWrap: {
    flex: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  playerPicker: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  teamDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: spacing.xs,
  },
  singleTeamRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  unassignedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    backgroundColor: `${colors.warning}12`,
  },
  unassignedBadgeText: {
    ...typography.label,
    color: colors.warning,
    fontSize: 9,
  },
  teamBadge: {
    width: 52,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  teamBadgeShort: {
    ...typography.label,
    fontWeight: "800",
    fontSize: 13,
    lineHeight: 14,
  },
  teamBadgeLabel: {
    ...typography.label,
    fontSize: 8,
    lineHeight: 10,
    marginTop: 1,
  },
  avatarGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  avatarChip: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  ptsBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  ptsBadgeText: {
    color: colors.text,
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  activePlayerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.sm,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  activePlayerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  activeMeta: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  activeTeamPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: 2,
  },
  activeTeamPillText: {
    ...typography.label,
    fontSize: 10,
    fontWeight: "700",
  },
  activeName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  activeSub: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  quickLine: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickItem: {
    flex: 1,
    alignItems: "center",
  },
  quickKey: {
    ...typography.label,
    fontSize: 9,
  },
  quickVal: {
    ...typography.body,
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 20,
  },
  padGrid: {
    gap: spacing.sm,
  },
  secondaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs / 2,
  },
  secondaryGridCell: {
    width: "50%",
    paddingHorizontal: spacing.xs / 2,
    paddingBottom: spacing.xs,
  },
  statPad: {
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  statPadFeatured: {
    minHeight: 112,
  },
  statPadCompact: {
    flex: 1,
    minHeight: 132,
  },
  statPadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statPadHeaderFeatured: {
    justifyContent: "center",
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    ...typography.label,
    fontSize: 11,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 36,
    textAlign: "center",
  },
  statValueFeatured: {
    fontSize: 44,
    lineHeight: 48,
  },
  statControls: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: "auto",
  },
  statControlsFeatured: {
    maxWidth: 220,
    alignSelf: "center",
    width: "100%",
  },
  statBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statBtnFeatured: {
    height: 44,
  },
  statBtnPrimary: {
    borderColor: "transparent",
  },
  totalsBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
    gap: spacing.xs,
    zIndex: 1,
  },
  saveFabWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    height: SAVE_FAB_SIZE,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 3,
  },
  saveFab: {
    width: SAVE_FAB_SIZE,
    height: SAVE_FAB_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
  saveFabSaved: {
    backgroundColor: colors.primaryContainer,
    borderWidth: 2,
    borderColor: colors.success,
  },
  saveFabDisabled: {
    opacity: 0.45,
  },
  saveFabPressed: {
    opacity: 0.88,
  },
  saveError: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
  },
  totalsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
  },
  totalItem: {
    flex: 1,
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
    color: colors.textMuted,
    fontWeight: "700",
  },
});
