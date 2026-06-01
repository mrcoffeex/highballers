import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameStatsRecorder } from "../../../components/GameStatsRecorder";
import { ScoreboardDrawer } from "../../../components/ScoreboardDrawer";
import { useScoreboard } from "../../../hooks/useScoreboard";
import { ScorekeeperSkeleton } from "../../../components/ui";
import { shouldShowEntitySkeleton } from "../../../lib/entityLoading";
import { canManageEventStats } from "../../../lib/gameEvents";
import {
  resolveAllParticipantPlayers,
  UNASSIGNED_ROSTER_INDEX,
  UNASSIGNED_ROSTER_LABEL,
} from "../../../lib/eventRoster";
import { colors, radius, spacing, typography } from "../../../lib/theme";
import { useRefreshControl } from "../../../lib/useRefreshControl";
import { BoxScoreStats } from "../../../lib/types";
import {
  useActiveRoster,
  useClub,
  useCourtGames,
  useEvent,
  useEventWaitlist,
} from "../../../store/hooks";
import { useAppStore } from "../../../store/useAppStore";

interface ScorekeeperTab {
  index: number;
  label: string;
}

export default function EventStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const event = useEvent(id);
  const club = useClub(event?.clubId ?? "");
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const gameStatRecords = useAppStore((state) => state.gameStatRecords);
  const saveEventStats = useAppStore((state) => state.saveEventStats);
  const events = useAppStore((state) => state.events);
  const hydrated = useAppStore((state) => state.hydrated);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [savingStats, setSavingStats] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedTabIndex, setSavedTabIndex] = useState<number | null>(null);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const { refreshControl } = useRefreshControl();

  const courtGames = useCourtGames(event, users);
  const waitlist = useEventWaitlist(event, users);

  const tabs = useMemo((): ScorekeeperTab[] => {
    const items: ScorekeeperTab[] = courtGames.map((game) => ({
      index: game.index,
      label: game.label,
    }));

    if (waitlist.length > 0) {
      items.push({
        index: UNASSIGNED_ROSTER_INDEX,
        label: UNASSIGNED_ROSTER_LABEL,
      });
    }

    if (items.length === 0 && event && event.participantIds.length > 0) {
      return [{ index: 0, label: "All Players" }];
    }

    return items;
  }, [courtGames, event, waitlist.length]);

  const selectedTab =
    tabs.find((tab) => tab.index === selectedTabIndex) ?? tabs[0];
  const activeTabIndex = selectedTab?.index ?? 0;
  const isUnassignedTab = activeTabIndex === UNASSIGNED_ROSTER_INDEX;
  const shuffledRoster = useActiveRoster(event, users, activeTabIndex);
  const activeRoster = useMemo(() => {
    if (!event) return [];
    if (courtGames.length === 0) {
      return resolveAllParticipantPlayers(event, users);
    }
    return shuffledRoster;
  }, [courtGames.length, event, shuffledRoster, users]);
  const selectedGame = courtGames.find((game) => game.index === activeTabIndex);

  const scoreboardKey = id ? `scoreboard:${id}:${activeTabIndex}` : "";
  const scoreboard = useScoreboard(scoreboardKey || "scoreboard:local");

  const eventStats = useMemo(() => {
    const map: Record<string, BoxScoreStats> = {};
    for (const record of gameStatRecords) {
      if (record.eventId === id) {
        map[record.userId] = record.stats;
      }
    }
    return map;
  }, [gameStatRecords, id]);

  const canManage = event
    ? canManageEventStats(event, currentUserId, club)
    : false;

  const handleSave = async (statsByPlayer: Record<string, BoxScoreStats>) => {
    if (!event) return;
    setSavingStats(true);
    setSaveError(null);
    setSavedTabIndex(null);
    try {
      const message = await saveEventStats(
        event.id,
        statsByPlayer,
        activeTabIndex,
        activeRoster.map((player) => player.id),
      );
      if (message) {
        setSaveError(message);
        return;
      }
      setSavedTabIndex(activeTabIndex);
    } finally {
      setSavingStats(false);
    }
  };

  const handleSelectTab = (index: number) => {
    setSelectedTabIndex(index);
    setSavedTabIndex(null);
    setSaveError(null);
  };

  if (!event) {
    if (shouldShowEntitySkeleton(event, hydrated, events.length === 0)) {
      return <ScorekeeperSkeleton />;
    }

    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Game not found</Text>
      </View>
    );
  }

  if (!canManage) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "Scorekeeper" }} />
        <View style={[styles.blocked, { paddingBottom: insets.bottom }]}>
          <Ionicons
            name="lock-closed-outline"
            size={40}
            color={colors.textMuted}
          />
          <Text style={styles.blockedTitle}>Scorekeeper locked</Text>
          <Text style={styles.blockedText}>
            Stats can only be recorded before the game closes or within 12 hours
            after tip-off.
          </Text>
        </View>
      </>
    );
  }

  if (event.participantIds.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "Scorekeeper" }} />
        <View style={[styles.blocked, { paddingBottom: insets.bottom }]}>
          <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          <Text style={styles.blockedTitle}>No players yet</Text>
          <Text style={styles.blockedText}>
            At least one player must join before you can record stats.
          </Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: "Scorekeeper" }} />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {tabs.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gameTabsScroll}
            contentContainerStyle={styles.gameTabsBar}
          >
            {tabs.map((tab) => {
              const selected = tab.index === activeTabIndex;
              const saved = savedTabIndex === tab.index;
              const isUnassigned = tab.index === UNASSIGNED_ROSTER_INDEX;

              return (
                <Pressable
                  key={tab.label}
                  style={[
                    styles.gameTab,
                    selected && styles.gameTabActive,
                    isUnassigned && selected && styles.gameTabUnassignedActive,
                  ]}
                  onPress={() => handleSelectTab(tab.index)}
                >
                  {isUnassigned ? (
                    <Ionicons
                      name="person-outline"
                      size={13}
                      color={selected ? colors.warning : colors.textMuted}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.gameTabText,
                      selected && styles.gameTabTextActive,
                      isUnassigned && selected && styles.gameTabTextUnassigned,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                  {isUnassigned && waitlist.length > 0 ? (
                    <View style={styles.gameTabCount}>
                      <Text style={styles.gameTabCountText}>
                        {waitlist.length}
                      </Text>
                    </View>
                  ) : null}
                  {saved ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.success}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.recorderWrap}>
          <GameStatsRecorder
            key={`${id}-${activeTabIndex}`}
            participants={activeRoster}
            teamA={isUnassignedTab ? undefined : selectedGame?.teamA}
            teamB={isUnassignedTab ? undefined : selectedGame?.teamB}
            courtLabel={selectedTab?.label}
            initialStats={eventStats}
            saving={savingStats}
            saved={savedTabIndex === activeTabIndex}
            saveError={saveError}
            refreshControl={refreshControl}
            onSave={handleSave}
          />
          {!isUnassignedTab ? (
            <ScoreboardDrawer
              visible={scoreboardOpen}
              onOpen={() => setScoreboardOpen(true)}
              onClose={() => setScoreboardOpen(false)}
              teamALabel="Team A"
              teamBLabel="Team B"
              controls={{
                state: scoreboard.state,
                adjustTeamAScore: scoreboard.adjustTeamAScore,
                adjustTeamBScore: scoreboard.adjustTeamBScore,
                toggleGameClock: scoreboard.toggleGameClock,
                toggleShotClock: scoreboard.toggleShotClock,
                resetGameClock: scoreboard.resetGameClock,
                setGameClockSeconds: scoreboard.setGameClockSeconds,
                setShotClockSeconds: scoreboard.setShotClockSeconds,
                resetShotClock: scoreboard.resetShotClock,
                setQuarterMinutes: scoreboard.setQuarterMinutes,
                nextPeriod: scoreboard.nextPeriod,
                setPeriod: scoreboard.setPeriod,
                startBuzzerHold: scoreboard.startBuzzerHold,
                stopBuzzerHold: scoreboard.stopBuzzerHold,
                triggerBuzzer: scoreboard.triggerBuzzer,
                resetAll: scoreboard.resetAll,
              }}
            />
          ) : null}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  recorderWrap: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  notFoundText: {
    color: colors.textMuted,
  },
  blocked: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  blockedTitle: {
    ...typography.heading,
    color: colors.text,
  },
  blockedText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 14,
  },
  gameTabsScroll: {
    flexGrow: 0,
    maxHeight: 44,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  gameTabsBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  gameTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gameTabActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}18`,
  },
  gameTabUnassignedActive: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}18`,
  },
  gameTabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 13,
  },
  gameTabTextActive: {
    color: colors.primary,
  },
  gameTabTextUnassigned: {
    color: colors.warning,
  },
  gameTabCount: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: `${colors.warning}33`,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  gameTabCountText: {
    ...typography.label,
    color: colors.warning,
    fontSize: 10,
    fontWeight: "700",
  },
});
