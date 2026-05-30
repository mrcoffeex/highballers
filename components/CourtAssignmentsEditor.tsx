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
import { getCourtGameLabel, sanitizeCourtGames } from "../lib/eventRoster";
import { colors, radius, spacing, typography } from "../lib/theme";
import { CourtGame, UserProfile } from "../lib/types";

interface CourtAssignmentsEditorProps {
  participants: UserProfile[];
  initialCourtGames: CourtGame[];
  playersPerGame: number;
  saving?: boolean;
  refreshControl?: ScrollViewProps["refreshControl"];
  onSave: (courtGames: CourtGame[]) => void;
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
  refreshControl,
  onSave,
}: CourtAssignmentsEditorProps) {
  const teamSize = getTeamSize(playersPerGame);
  const [courtGames, setCourtGames] = useState<CourtGame[]>(() =>
    cloneCourts(initialCourtGames),
  );
  const [selectedCourtIndex, setSelectedCourtIndex] = useState(0);
  const [selectedUnassignedId, setSelectedUnassignedId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setCourtGames(cloneCourts(initialCourtGames));
    setSelectedCourtIndex(0);
    setSelectedUnassignedId(null);
  }, [initialCourtGames]);

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
      next[target] = [...next[target], userId];
      return next;
    });
  };

  const addToTeam = (courtIndex: number, userId: string, target: TeamSide) => {
    if (!participantMap.has(userId) || assignedIds.has(userId)) return;

    updateCourt(courtIndex, (game) => ({
      ...game,
      [target]: [...game[target], userId],
    }));
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
    onSave(
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

    return (
      <View style={styles.teamColumn}>
        <View style={styles.teamHeader}>
          <Text style={[styles.teamTitle, { color }]}>{label}</Text>
          <Text style={styles.teamCount}>
            {ids.length}/{teamSize}
          </Text>
          {selectedUnassignedId ? (
            <Pressable
              style={[styles.addBtn, { borderColor: `${color}88` }]}
              onPress={() => addToTeam(courtIndex, selectedUnassignedId, side)}
            >
              <Ionicons name="add" size={16} color={color} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.teamList}>
          {ids.map((userId) => {
            const player = participantMap.get(userId);
            if (!player) return null;
            const otherTeam: TeamSide = side === "teamA" ? "teamB" : "teamA";

            return (
              <View key={userId} style={styles.playerRow}>
                <Avatar
                  name={player.name}
                  color={player.avatarColor}
                  size={32}
                  imageUrl={player.avatarUrl}
                />
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.nickname ?? player.name}
                  </Text>
                  <Text style={styles.playerMeta}>{player.position}</Text>
                </View>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => moveToTeam(courtIndex, userId, otherTeam)}
                  hitSlop={6}
                >
                  <Ionicons
                    name="swap-horizontal"
                    size={16}
                    color={colors.textMuted}
                  />
                </Pressable>
                <Pressable
                  style={styles.iconBtn}
                  onPress={() => removeFromCourt(courtIndex, userId)}
                  hitSlop={6}
                >
                  <Ionicons name="close" size={16} color={colors.error} />
                </Pressable>
              </View>
            );
          })}

          {ids.length === 0 ? (
            <Text style={styles.emptyTeam}>No players yet</Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (courtGames.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>
          Shuffle first, or add a court to assign players manually.
        </Text>
        <Button title="Add Court" onPress={addCourt} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.courtTabs}
      >
        {courtGames.map((game, index) => {
          const selected = index === safeCourtIndex;
          const count = game.teamA.length + game.teamB.length;
          return (
            <Pressable
              key={`court-${index}`}
              style={[styles.courtTab, selected && styles.courtTabActive]}
              onPress={() => setSelectedCourtIndex(index)}
            >
              <Text
                style={[
                  styles.courtTabText,
                  selected && styles.courtTabTextActive,
                ]}
              >
                {getCourtGameLabel(index)}
              </Text>
              <Text style={styles.courtTabMeta}>{count} players</Text>
            </Pressable>
          );
        })}
        <Pressable style={styles.addCourtTab} onPress={addCourt}>
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={styles.addCourtTabText}>Court</Text>
        </Pressable>
      </ScrollView>

      {selectedCourt ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.courtToolbar}>
            <Text style={styles.courtHint}>
              {formatGameSizeLabel(playersPerGame)} target · tap swap to move
              teams, X to unassign
            </Text>
            {courtGames.length > 1 ? (
              <Pressable onPress={() => removeCourt(safeCourtIndex)}>
                <Text style={styles.removeCourtText}>Remove court</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.teamsRow}>
            {renderTeam(safeCourtIndex, "teamA", "Team A", colors.teamA)}
            {renderTeam(safeCourtIndex, "teamB", "Team B", colors.teamB)}
          </View>
        </ScrollView>
      ) : null}

      <View style={styles.unassignedSection}>
        <Text style={styles.unassignedTitle}>
          Substitutes ({unassigned.length})
        </Text>
        {selectedUnassignedId ? (
          <Text style={styles.unassignedHint}>
            Tap + on Team A or B to assign
          </Text>
        ) : (
          <Text style={styles.unassignedHint}>
            Tap a player, then tap + on a team
          </Text>
        )}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.unassignedStrip}
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
                  size={28}
                  imageUrl={player.avatarUrl}
                />
                <Text style={styles.unassignedName} numberOfLines={1}>
                  {player.name.split(" ")[0]}
                </Text>
              </Pressable>
            );
          })}
          {unassigned.length === 0 ? (
            <Text style={styles.allAssigned}>
              All joined players are assigned
            </Text>
          ) : null}
        </ScrollView>

        <Button
          title="Save Assignments"
          loading={saving}
          onPress={handleSave}
          icon={
            <Ionicons name="checkmark-done" size={18} color={colors.text} />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  courtTabs: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: "center",
  },
  courtTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    minWidth: 84,
  },
  courtTabActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}18`,
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
    fontSize: 9,
    marginTop: 2,
  },
  addCourtTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  addCourtTabText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  courtToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  courtHint: {
    ...typography.caption,
    color: colors.textDim,
    flex: 1,
  },
  removeCourtText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: "600",
  },
  teamsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  teamColumn: {
    flex: 1,
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
    borderBottomColor: colors.cardBorder,
  },
  teamTitle: {
    ...typography.label,
    fontSize: 11,
    flex: 1,
  },
  teamCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
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
  teamList: {
    padding: spacing.sm,
    gap: spacing.xs,
    minHeight: 120,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  playerInfo: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
  },
  playerMeta: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 9,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  emptyTeam: {
    ...typography.caption,
    color: colors.textDim,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  unassignedSection: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.sm,
  },
  unassignedTitle: {
    ...typography.label,
    color: colors.warning,
  },
  unassignedHint: {
    ...typography.caption,
    color: colors.textDim,
  },
  unassignedStrip: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  unassignedChip: {
    width: 64,
    alignItems: "center",
    padding: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    gap: 2,
  },
  unassignedChipActive: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}18`,
  },
  unassignedName: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 9,
    maxWidth: 58,
  },
  allAssigned: {
    ...typography.caption,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
