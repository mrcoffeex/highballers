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

import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { Avatar } from "./ui";
import { UNASSIGNED_ROSTER_LABEL } from "../lib/eventRoster";
import {
  radius,
  shadows,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";
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

function getStatMeta(
  colors: ThemeColors,
): Record<
  keyof BoxScoreStats,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> {
  return {
    points: { icon: "basketball", color: colors.primary },
    rebounds: { icon: "arrow-up-circle", color: colors.accent },
    assists: { icon: "git-network-outline", color: colors.success },
    blocks: { icon: "shield-checkmark", color: colors.tertiary },
    steals: { icon: "flash", color: colors.warning },
  };
}

function clampStat(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(99, Math.round(value));
}

const SECONDARY_STAT_FIELDS = BOX_SCORE_FIELDS.filter(
  (field) => field !== "points",
);

const BOTTOM_DOCK_SAVE_HEIGHT = 48;

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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const meta = getStatMeta(colors)[field];

  return (
    <View
      style={[
        styles.statPad,
        featured ? styles.statPadFeatured : styles.statPadCompact,
        { borderColor: withAlpha(meta.color, 0.28) },
      ]}
    >
      <View
        style={[styles.statPadHeader, featured && styles.statPadHeaderFeatured]}
      >
        <View
          style={[
            styles.statIconWrap,
            { backgroundColor: withAlpha(meta.color, 0.14) },
          ]}
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
            { backgroundColor: withAlpha(meta.color, 0.2) },
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const statMeta = useMemo(() => getStatMeta(colors), [colors]);
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
          { borderColor: withAlpha(teamColor, selected ? 1 : 0.27) },
          selected && { backgroundColor: withAlpha(teamColor, 0.13) },
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
          {
            backgroundColor: withAlpha(teamColor, 0.09),
            borderColor: withAlpha(teamColor, 0.33),
          },
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
  const showTotals = roster.length > 0;
  const bottomDockHeight =
    (showTotals ? 52 : 0) +
    (saveError ? 22 : 0) +
    BOTTOM_DOCK_SAVE_HEIGHT +
    spacing.sm * 3;
  const scrollBottomInset = bottomDockHeight + insets.bottom + spacing.md;

  const renderBottomChrome = () => (
    <View
      style={[styles.bottomDock, { paddingBottom: spacing.sm + insets.bottom }]}
    >
      {showTotals ? (
        <View style={styles.totalsRow}>
          {BOX_SCORE_FIELDS.map((field) => (
            <View key={field} style={styles.totalItem}>
              <Text style={styles.totalKey}>{BOX_SCORE_LABELS[field]}</Text>
              <Text style={styles.totalVal}>{totals[field]}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          saved && styles.saveButtonSaved,
          saveDisabled && styles.saveButtonDisabled,
          pressed && !saveDisabled && styles.saveButtonPressed,
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
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <Ionicons
              name={saved ? "checkmark-circle" : "checkmark-done"}
              size={20}
              color={colors.onPrimary}
            />
            <Text style={styles.saveButtonText}>{saveTitle}</Text>
          </>
        )}
      </Pressable>
    </View>
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
                    { borderColor: withAlpha(colors.warning, 0.33) },
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
                      backgroundColor: withAlpha(colors.warning, 0.13),
                      borderColor: withAlpha(colors.warning, 0.4),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.activeTeamPillText,
                      { color: colors.warning },
                    ]}
                    numberOfLines={1}
                  >
                    Substitutes
                  </Text>
                </View>
              ) : activeTeamLabel ? (
                <View
                  style={[
                    styles.activeTeamPill,
                    {
                      backgroundColor: withAlpha(
                        activeTeamLabel === "Team A"
                          ? colors.teamA
                          : colors.teamB,
                        0.13,
                      ),
                      borderColor: withAlpha(
                        activeTeamLabel === "Team A"
                          ? colors.teamA
                          : colors.teamB,
                        0.4,
                      ),
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
                    numberOfLines={1}
                  >
                    {activeTeamLabel}
                  </Text>
                </View>
              ) : null}
              {courtLabel ? (
                <View style={styles.activeMetaPill}>
                  <Text style={styles.activeMetaText} numberOfLines={1}>
                    {courtLabel}
                  </Text>
                </View>
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
                  style={[styles.quickKey, { color: statMeta[field].color }]}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      backgroundColor: withAlpha(colors.warning, 0.08),
    },
    unassignedBadgeText: {
      ...typography.label,
      color: colors.warning,
      fontSize: 9,
    },
    teamBadge: {
      alignSelf: "flex-start",
      flexShrink: 0,
      minHeight: 44,
      borderRadius: radius.sm,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
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
      color: colors.onPrimary,
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
      minWidth: 0,
    },
    activeMetaPill: {
      alignSelf: "center",
      flexShrink: 0,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: withAlpha(colors.textMuted, 0.1),
      marginTop: 2,
      marginBottom: 2,
    },
    activeMetaText: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 10,
      flexShrink: 0,
    },
    activeTeamPill: {
      alignSelf: "center",
      flexShrink: 0,
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
      flexShrink: 0,
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
    bottomDock: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      backgroundColor: colors.surface,
      zIndex: 2,
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      height: BOTTOM_DOCK_SAVE_HEIGHT,
      borderRadius: radius.md,
      backgroundColor: colors.primary,
      ...shadows.card,
    },
    saveButtonSaved: {
      backgroundColor: colors.success,
    },
    saveButtonDisabled: {
      opacity: 0.45,
    },
    saveButtonPressed: {
      opacity: 0.88,
    },
    saveButtonText: {
      ...typography.body,
      color: colors.onPrimary,
      fontWeight: "700",
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
}
