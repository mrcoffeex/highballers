import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from "react-native";

import { Avatar, Button } from "./ui";
import { formatGameSizeLabel, getTeamSize } from "../lib/gameFormats";
import {
  getCourtGameLabel,
  getCourtPlayersPerGame,
  isActiveCourtGame,
  sanitizeCourtGames,
} from "../lib/eventRoster";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";
import { CourtGame, UserProfile } from "../lib/types";

interface CourtAssignmentsEditorProps {
  participants: UserProfile[];
  initialCourtGames: CourtGame[];
  playersPerGame: number;
  saving?: boolean;
  bottomInset?: number;
  /** @deprecated Flex layout uses full height; refresh not shown on this screen */
  refreshControl?: ScrollViewProps["refreshControl"];
  onSave: (courtGames: CourtGame[]) => void | Promise<void>;
}

type TeamSide = "teamA" | "teamB";

function cloneCourts(courts: CourtGame[]): CourtGame[] {
  return courts.map((game) => ({
    teamA: [...game.teamA],
    teamB: [...game.teamB],
  }));
}

export function CourtAssignmentsEditor({
  participants,
  initialCourtGames,
  playersPerGame,
  saving,
  bottomInset = 0,
  onSave,
}: CourtAssignmentsEditorProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const teamSize = getTeamSize(playersPerGame);
  const gameSizeLabel = formatGameSizeLabel(playersPerGame);
  const [courtGames, setCourtGames] = useState<CourtGame[]>(() =>
    cloneCourts(initialCourtGames),
  );
  const [selectedCourtIndex, setSelectedCourtIndex] = useState(0);
  const [selectedUnassignedId, setSelectedUnassignedId] = useState<
    string | null
  >(null);

  const initialCourtsKey = useMemo(
    () => JSON.stringify(initialCourtGames),
    [initialCourtGames],
  );

  useEffect(() => {
    setCourtGames(cloneCourts(initialCourtGames));
    setSelectedCourtIndex(0);
    setSelectedUnassignedId(null);
  }, [initialCourtsKey, initialCourtGames]);

  const participantMap = useMemo(
    () => new Map(participants.map((player) => [player.id, player])),
    [participants],
  );

  const assignedIds = useMemo(
    () => new Set(courtGames.flatMap((game) => [...game.teamA, ...game.teamB])),
    [courtGames],
  );

  const unassigned = useMemo(
    () => participants.filter((player) => !assignedIds.has(player.id)),
    [participants, assignedIds],
  );

  const safeCourtIndex = Math.min(
    selectedCourtIndex,
    Math.max(courtGames.length - 1, 0),
  );
  const selectedCourt = courtGames[safeCourtIndex];
  const selectedCourtCount = selectedCourt
    ? getCourtPlayersPerGame(selectedCourt)
    : 0;
  const selectedCourtReady = selectedCourt
    ? isActiveCourtGame(selectedCourt, playersPerGame)
    : false;

  const updateCourt = (
    courtIndex: number,
    updater: (game: CourtGame) => CourtGame,
  ) => {
    setCourtGames((current) =>
      current.map((game, index) =>
        index === courtIndex ? updater(game) : game,
      ),
    );
  };

  const removeFromCourt = (courtIndex: number, userId: string) => {
    updateCourt(courtIndex, (game) => ({
      teamA: game.teamA.filter((id) => id !== userId),
      teamB: game.teamB.filter((id) => id !== userId),
    }));
  };

  const moveToTeam = (courtIndex: number, userId: string, target: TeamSide) => {
    updateCourt(courtIndex, (game) => {
      const next = {
        teamA: game.teamA.filter((id) => id !== userId),
        teamB: game.teamB.filter((id) => id !== userId),
      };
      if (next[target].length >= teamSize) return game;
      next[target] = [...next[target], userId];
      return next;
    });
  };

  const addToTeam = (courtIndex: number, userId: string, target: TeamSide) => {
    if (!participantMap.has(userId) || assignedIds.has(userId)) return;

    updateCourt(courtIndex, (game) => {
      if (game[target].length >= teamSize) return game;
      return {
        ...game,
        [target]: [...game[target], userId],
      };
    });
    setSelectedUnassignedId(null);
  };

  const addCourt = () => {
    setCourtGames((current) => [...current, { teamA: [], teamB: [] }]);
    setSelectedCourtIndex(courtGames.length);
  };

  const removeCourt = (courtIndex: number) => {
    setCourtGames((current) =>
      current.filter((_, index) => index !== courtIndex),
    );
    setSelectedCourtIndex(Math.max(0, courtIndex - 1));
  };

  const handleSave = () => {
    void onSave(
      sanitizeCourtGames(
        courtGames,
        participants.map((player) => player.id),
      ),
    );
  };

  const renderTeam = (
    courtIndex: number,
    side: TeamSide,
    label: string,
    color: string,
  ) => {
    const ids = selectedCourt?.[side] ?? [];
    const teamFull = ids.length >= teamSize;

    return (
      <View style={styles.teamColumn}>
        <View
          style={[
            styles.teamHeader,
            { borderBottomColor: withAlpha(color, 0.27) },
          ]}
        >
          <View style={[styles.teamDot, { backgroundColor: color }]} />
          <Text style={[styles.teamTitle, { color }]}>{label}</Text>
          <Text style={styles.teamCount}>
            {ids.length}/{teamSize}
          </Text>
          {selectedUnassignedId && !teamFull ? (
            <Pressable
              style={[styles.addBtn, { borderColor: withAlpha(color, 0.53) }]}
              onPress={() => addToTeam(courtIndex, selectedUnassignedId, side)}
              accessibilityLabel={`Add to ${label}`}
            >
              <Ionicons name="add" size={16} color={color} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          style={styles.teamScroll}
          contentContainerStyle={styles.teamScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {ids.map((userId) => {
            const player = participantMap.get(userId);
            if (!player) return null;
            const otherTeam: TeamSide = side === "teamA" ? "teamB" : "teamA";
            const otherFull =
              (selectedCourt?.[otherTeam].length ?? 0) >= teamSize;

            return (
              <View key={userId} style={styles.playerRow}>
                <Avatar
                  name={player.name}
                  color={player.avatarColor}
                  size={30}
                  imageUrl={player.avatarUrl}
                />
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.nickname ?? player.name}
                </Text>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => moveToTeam(courtIndex, userId, otherTeam)}
                  disabled={otherFull}
                  hitSlop={6}
                  accessibilityLabel="Move to other team"
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={15}
                    color={otherFull ? colors.textDim : colors.textMuted}
                  />
                </Pressable>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => removeFromCourt(courtIndex, userId)}
                  hitSlop={6}
                  accessibilityLabel="Remove from court"
                >
                  <Ionicons name="close" size={15} color={colors.error} />
                </Pressable>
              </View>
            );
          })}

          {ids.length === 0 ? (
            <View style={styles.emptyTeam}>
              <Ionicons
                name="person-add-outline"
                size={20}
                color={colors.textDim}
              />
              <Text style={styles.emptyTeamText}>
                {selectedUnassignedId
                  ? "Tap + to add"
                  : "Select a substitute below"}
              </Text>
            </View>
          ) : null}

          {Array.from({ length: Math.max(0, teamSize - ids.length) }).map(
            (_, slot) => (
              <View key={`slot-${slot}`} style={styles.emptySlot}>
                <Text style={styles.emptySlotText}>Open slot</Text>
              </View>
            ),
          )}
        </ScrollView>
      </View>
    );
  };

  if (courtGames.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="grid-outline" size={40} color={colors.textDim} />
        <Text style={styles.emptyTitle}>No courts yet</Text>
        <Text style={styles.emptyText}>
          Shuffle from the game page, or add a court to assign players manually.
        </Text>
        <Button title="Add Court" onPress={addCourt} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.courtTabs}
        >
          {courtGames.map((game, index) => {
            const selected = index === safeCourtIndex;
            const count = getCourtPlayersPerGame(game);
            const ready = isActiveCourtGame(game, playersPerGame);
            return (
              <Pressable
                key={`court-${index}`}
                style={[styles.courtTab, selected && styles.courtTabActive]}
                onPress={() => setSelectedCourtIndex(index)}
              >
                <View style={styles.courtTabTop}>
                  <Text
                    style={[
                      styles.courtTabText,
                      selected && styles.courtTabTextActive,
                    ]}
                  >
                    {getCourtGameLabel(index)}
                  </Text>
                  {ready ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.success}
                    />
                  ) : null}
                </View>
                <Text style={styles.courtTabMeta}>
                  {count}/{playersPerGame}
                </Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.addCourtTab} onPress={addCourt}>
            <Ionicons name="add" size={18} color={colors.primary} />
            <Text style={styles.addCourtTabText}>Court</Text>
          </Pressable>
        </ScrollView>

        {selectedCourt ? (
          <View style={styles.statusBar}>
            <Text style={styles.statusLabel}>
              {gameSizeLabel} · {selectedCourtCount}/{playersPerGame} on court
            </Text>
            {selectedCourtReady ? (
              <View style={styles.readyPill}>
                <Text style={styles.readyPillText}>Ready</Text>
              </View>
            ) : (
              <Text style={styles.statusHint}>Balance teams to activate</Text>
            )}
            {courtGames.length > 1 ? (
              <Pressable
                onPress={() => removeCourt(safeCourtIndex)}
                hitSlop={8}
              >
                <Text style={styles.removeCourtText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {selectedCourt ? (
        <View style={styles.workspace}>
          <View style={styles.teamsRow}>
            {renderTeam(safeCourtIndex, "teamA", "Team A", colors.teamA)}
            <View style={styles.teamDivider} />
            {renderTeam(safeCourtIndex, "teamB", "Team B", colors.teamB)}
          </View>
        </View>
      ) : (
        <View style={styles.workspace} />
      )}

      <View
        style={[styles.footer, { paddingBottom: spacing.md + bottomInset }]}
      >
        <View style={styles.footerHeader}>
          <Text style={styles.unassignedTitle}>
            Substitutes ({unassigned.length})
          </Text>
          <Text style={styles.unassignedHint} numberOfLines={1}>
            {selectedUnassignedId
              ? "Tap + on a team"
              : "Tap a player to assign"}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.substitutesScroll}
          contentContainerStyle={styles.substitutesContent}
        >
          {unassigned.map((player) => {
            const selected = selectedUnassignedId === player.id;
            return (
              <Pressable
                key={player.id}
                style={[
                  styles.unassignedChip,
                  selected && styles.unassignedChipActive,
                ]}
                onPress={() =>
                  setSelectedUnassignedId(selected ? null : player.id)
                }
              >
                <Avatar
                  name={player.name}
                  color={player.avatarColor}
                  size={32}
                  imageUrl={player.avatarUrl}
                />
                <Text style={styles.unassignedName} numberOfLines={1}>
                  {player.nickname ?? player.name.split(" ")[0]}
                </Text>
              </Pressable>
            );
          })}
          {unassigned.length === 0 ? (
            <Text style={styles.allAssigned}>Everyone is on a court</Text>
          ) : null}
        </ScrollView>

        <Button
          title="Save Assignments"
          loading={saving}
          onPress={handleSave}
          icon={
            <Ionicons
              name="checkmark-done"
              size={18}
              color={colors.onPrimary}
            />
          }
        />
      </View>
    </View>
  );
}

const TEAM_COLUMN_MIN_HEIGHT = 200;

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      minHeight: 0,
    },
    emptyWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
      gap: spacing.md,
    },
    emptyTitle: {
      ...typography.heading,
      color: colors.text,
      fontSize: 18,
    },
    emptyText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: "center",
      fontSize: 14,
      lineHeight: 20,
    },
    header: {
      flexGrow: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
    courtTabs: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      gap: spacing.sm,
      alignItems: "center",
    },
    courtTab: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      minWidth: 76,
    },
    courtTabActive: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, 0.08),
    },
    courtTabTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    courtTabText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "700",
    },
    courtTabTextActive: {
      color: colors.primary,
    },
    courtTabMeta: {
      ...typography.label,
      color: colors.textDim,
      fontSize: 10,
      marginTop: 2,
    },
    addCourtTab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: "dashed",
      minHeight: 48,
      justifyContent: "center",
    },
    addCourtTabText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "600",
    },
    statusBar: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    statusLabel: {
      ...typography.caption,
      color: colors.text,
      fontWeight: "600",
      flex: 1,
      minWidth: 120,
    },
    statusHint: {
      ...typography.caption,
      color: colors.textDim,
      fontSize: 11,
    },
    readyPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
      backgroundColor: withAlpha(colors.success, 0.13),
      borderWidth: 1,
      borderColor: withAlpha(colors.success, 0.33),
    },
    readyPillText: {
      ...typography.label,
      color: colors.success,
      fontSize: 10,
      fontWeight: "700",
    },
    removeCourtText: {
      ...typography.caption,
      color: colors.error,
      fontWeight: "600",
    },
    workspace: {
      flex: 1,
      minHeight: 0,
      padding: spacing.md,
    },
    teamsRow: {
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
      minHeight: TEAM_COLUMN_MIN_HEIGHT,
    },
    teamDivider: {
      width: 1,
      backgroundColor: colors.cardBorder,
      marginVertical: spacing.xs,
    },
    teamColumn: {
      flex: 1,
      minWidth: 0,
      minHeight: TEAM_COLUMN_MIN_HEIGHT,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: "hidden",
    },
    teamHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
    },
    teamDot: {
      width: 8,
      height: 8,
      borderRadius: radius.full,
    },
    teamTitle: {
      ...typography.label,
      fontSize: 11,
      fontWeight: "700",
      flex: 1,
    },
    teamCount: {
      ...typography.caption,
      color: colors.textMuted,
      fontSize: 11,
      fontVariant: ["tabular-nums"],
    },
    addBtn: {
      width: 28,
      height: 28,
      borderRadius: radius.full,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },
    teamScroll: {
      flex: 1,
    },
    teamScrollContent: {
      padding: spacing.sm,
      gap: spacing.xs,
      flexGrow: 1,
    },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingVertical: 6,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: colors.card,
    },
    playerName: {
      ...typography.caption,
      color: colors.text,
      fontWeight: "600",
      flex: 1,
      minWidth: 0,
    },
    iconBtn: {
      width: 26,
      height: 26,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },
    emptyTeam: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.lg,
      gap: spacing.xs,
    },
    emptyTeamText: {
      ...typography.caption,
      color: colors.textDim,
      textAlign: "center",
    },
    emptySlot: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.cardBorder,
      alignItems: "center",
    },
    emptySlotText: {
      ...typography.label,
      color: colors.textDim,
      fontSize: 10,
    },
    footer: {
      flexGrow: 0,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      backgroundColor: colors.surface,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    footerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    unassignedTitle: {
      ...typography.label,
      color: colors.warning,
      fontWeight: "700",
    },
    unassignedHint: {
      ...typography.caption,
      color: colors.textDim,
      flex: 1,
      textAlign: "right",
    },
    substitutesScroll: {
      maxHeight: 88,
      flexGrow: 0,
    },
    substitutesContent: {
      gap: spacing.sm,
      alignItems: "flex-start",
      paddingBottom: spacing.xs,
    },
    unassignedChip: {
      width: 72,
      alignItems: "center",
      padding: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      gap: 4,
    },
    unassignedChipActive: {
      borderColor: colors.warning,
      backgroundColor: withAlpha(colors.warning, 0.09),
    },
    unassignedName: {
      ...typography.label,
      color: colors.textMuted,
      fontSize: 10,
      maxWidth: 68,
      textAlign: "center",
    },
    allAssigned: {
      ...typography.caption,
      color: colors.textMuted,
      alignSelf: "center",
      paddingVertical: spacing.md,
    },
  });
}
