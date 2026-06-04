import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "@/lib/expoRouter";
import { format } from "date-fns";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import { BoxScoreTable } from "../../components/BoxScoreTable";
import { ConfirmModal } from "../../components/ConfirmModal";
import { EventInviteSection } from "../../components/EventInviteSection";
import { EventLocationCard } from "../../components/EventLocationCard";
import { EventGameStories } from "../../components/EventGameStories";
import { PlayerCard } from "../../components/PlayerCard";
import { PlayersPerGamePicker } from "../../components/PlayersPerGamePicker";
import {
  TeamShuffleView,
  triggerShuffleHaptic,
} from "../../components/TeamShuffleView";
import { UpgradeModal } from "../../components/UpgradeModal";
import {
  Badge,
  Button,
  Card,
  EventDetailSkeleton,
  SectionHeader,
} from "../../components/ui";
import { shouldShowEntitySkeleton } from "../../lib/entityLoading";
import { canUserJoinEvent, isPrivateEvent } from "../../lib/eventAccess";
import {
  canCancelEvent,
  canEditEvent,
  canMarkEventFinished,
  canRecordEventStats,
  hasEventStarted,
  isEventOptionsLocked,
} from "../../lib/gameEvents";
import { formatSyncError } from "../../lib/syncErrors";
import {
  canShowShuffleButton,
  canShuffleEvent,
  getCourtGameCount,
  formatRosterRating,
} from "../../lib/eventRoster";
import {
  clampPlayersPerGame,
  DEFAULT_PLAYERS_PER_GAME,
  describeCourtCapacity,
  formatGameSizeLabel,
  getPlayersPerGame,
} from "../../lib/gameFormats";
import { colors, spacing, typography } from "../../lib/theme";
import { useRefreshControl } from "../../lib/useRefreshControl";
import { useUpgradePrompt } from "../../lib/useUpgradePrompt";
import { BoxScoreStats, EMPTY_BOX_SCORE, UserProfile } from "../../lib/types";
import {
  useClub,
  useCourtGames,
  useEvent,
  useEventWaitlist,
} from "../../store/hooks";
import { useAppStore } from "../../store/useAppStore";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const event = useEvent(id);
  const club = useClub(event?.clubId ?? "");
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const gameStatRecords = useAppStore((state) => state.gameStatRecords);
  const events = useAppStore((state) => state.events);
  const hydrated = useAppStore((state) => state.hydrated);
  const joinEvent = useAppStore((state) => state.joinEvent);
  const leaveEvent = useAppStore((state) => state.leaveEvent);
  const invitePlayersToEvent = useAppStore(
    (state) => state.invitePlayersToEvent,
  );
  const clubBans = useAppStore((state) => state.clubBans);
  const shuffleTeams = useAppStore((state) => state.shuffleTeams);
  const finishEvent = useAppStore((state) => state.finishEvent);
  const cancelEvent = useAppStore((state) => state.cancelEvent);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const {
    upgradeVisible,
    upgradeReason,
    closeUpgrade,
    handleSubscriptionError,
  } = useUpgradePrompt();
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [reshuffleModalVisible, setReshuffleModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [shuffleError, setShuffleError] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [playersPerGame, setPlayersPerGame] = useState(
    DEFAULT_PLAYERS_PER_GAME,
  );
  const { refreshControl } = useRefreshControl();

  useEffect(() => {
    if (!event) return;
    setPlayersPerGame(
      clampPlayersPerGame(getPlayersPerGame(event), event.maxPlayers),
    );
  }, [event?.id, event?.maxPlayers, event?.playersPerGame]);

  const participants = useMemo(
    () =>
      (event?.participantIds ?? [])
        .map((playerId) => users.find((user) => user.id === playerId))
        .filter((player): player is UserProfile => Boolean(player)),
    [event?.participantIds, users],
  );

  const creator = useMemo(
    () => users.find((user) => user.id === event?.createdBy),
    [event?.createdBy, users],
  );

  const creatorLabel = creator
    ? creator.nickname?.trim() || creator.name
    : "Unknown player";

  const eventStats = useMemo(() => {
    const map: Record<string, BoxScoreStats> = {};
    for (const record of gameStatRecords) {
      if (record.eventId === id) {
        map[record.userId] = record.stats;
      }
    }
    return map;
  }, [gameStatRecords, id]);

  const courtGames = useCourtGames(event, users);
  const waitlist = useEventWaitlist(event, users);
  const courtGameCount = event ? getCourtGameCount(event) : 0;
  const assignedOnCourt = event
    ? event.participantIds.length - waitlist.length
    : 0;

  if (!event) {
    if (shouldShowEntitySkeleton(event, hydrated, events.length === 0)) {
      return <EventDetailSkeleton />;
    }

    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Game not found</Text>
      </View>
    );
  }

  const isJoined = event.participantIds.includes(currentUserId ?? "");
  const isFull = event.participantIds.length >= event.maxPlayers;
  const isClubMember = club?.memberIds.includes(currentUserId ?? "") ?? false;
  const joinAccess = currentUserId
    ? canUserJoinEvent(currentUserId, event)
    : { ok: false as const, reason: "Sign in to join this game." };
  const canJoinThisGame = joinAccess.ok;
  const shuffleReady = event ? canShuffleEvent(event, playersPerGame) : false;
  const courtCapacity = describeCourtCapacity(
    event.participantIds.length,
    playersPerGame,
  );
  const gameSizeLabel = formatGameSizeLabel(playersPerGame);
  const optionsLocked = isEventOptionsLocked(event);
  const eventStarted = hasEventStarted(event);
  const canEdit = canEditEvent(event, currentUserId, club);
  const canRecordStats = canRecordEventStats(event, currentUserId, club);
  const canFinish = canMarkEventFinished(event, currentUserId, club);
  const canCancel = canCancelEvent(event, currentUserId, club);
  const hasEventStats = Object.keys(eventStats).length > 0;
  const showShuffleUi = canShowShuffleButton(event);
  const canRunShuffle = canEdit && showShuffleUi && !hasEventStats;

  const handleShuffle = async () => {
    setShuffling(true);
    setShuffleError(null);
    try {
      await shuffleTeams(event.id, playersPerGame);
      await triggerShuffleHaptic();
      setReshuffleModalVisible(false);
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        setShuffleError(
          error instanceof Error
            ? error.message
            : "Could not shuffle teams.",
        );
      }
    } finally {
      setShuffling(false);
    }
  };

  const handleShufflePress = () => {
    if (event.shuffled) {
      setReshuffleModalVisible(true);
      return;
    }
    void handleShuffle();
  };

  const handleInvitePlayers = async (memberIds: string[]) => {
    setInviting(true);
    setInviteError(null);
    try {
      const result = await invitePlayersToEvent(event.id, memberIds);
      if (result.skipped.length > 0 && result.addedIds.length > 0) {
        setInviteError(
          `Added ${result.addedIds.length}. ${result.skipped.length} could not be added.`,
        );
      }
    } catch (error) {
      if (!handleSubscriptionError(error)) {
        setInviteError(
          error instanceof Error
            ? error.message
            : "Could not add players to this game.",
        );
      }
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveGame = async () => {
    setLeaving(true);
    try {
      await leaveEvent(event.id);
      setLeaveModalVisible(false);
    } finally {
      setLeaving(false);
    }
  };

  const handleCancelGame = async () => {
    setCancelling(true);
    setCancelError(null);

    try {
      await cancelEvent(event.id);
      setCancelModalVisible(false);
      router.replace("/(tabs)");
    } catch (error) {
      setCancelError(
        formatSyncError(error, "Could not cancel this game. Try again."),
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleFinishGame = async () => {
    setFinishing(true);
    try {
      await finishEvent(event.id);
      setFinishModalVisible(false);
    } catch (error) {
      handleSubscriptionError(error);
    } finally {
      setFinishing(false);
    }
  };

  const date = new Date(event.dateTime);

  return (
    <>
      <Stack.Screen options={{ headerTitle: event.title }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.heroCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateMonth}>{format(date, "MMM")}</Text>
              <Text style={styles.dateDay}>{format(date, "d")}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.title}>{event.title}</Text>
              {club ? <Text style={styles.club}>{club.name}</Text> : null}
              <View style={styles.meta}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={styles.metaText}>
                  {format(date, "EEEE, h:mm a")}
                </Text>
              </View>
              <View style={styles.meta}>
                <Ionicons
                  name="location-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={styles.metaText}>{event.location}</Text>
              </View>
              <Pressable
                style={styles.meta}
                onPress={() => router.push(`/player/${event.createdBy}`)}
                accessibilityRole="button"
                accessibilityLabel={`Created by ${creatorLabel}`}
              >
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={styles.metaText}>
                  Created by{" "}
                  <Text style={styles.creatorName}>{creatorLabel}</Text>
                </Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.description}>{event.description}</Text>
          <View style={styles.badges}>
            {isPrivateEvent(event) ? (
              <Badge label="Private" color={colors.warning} />
            ) : (
              <Badge label="Open" color={colors.success} />
            )}
            <Badge
              label={`${event.participantIds.length}/${event.maxPlayers} players`}
              color={isFull ? colors.warning : colors.success}
            />
            {event.shuffled && courtGameCount > 0 ? (
              <Badge
                label={`${courtGameCount}× ${formatGameSizeLabel(getPlayersPerGame(event))}`}
                color={colors.accent}
              />
            ) : null}
            {eventStarted && !optionsLocked ? (
              <Badge label="Live" color={colors.success} />
            ) : null}
            {event.finishedAt ? (
              <Badge label="Finished" color={colors.textMuted} />
            ) : null}
            {optionsLocked && !event.finishedAt ? (
              <Badge label="Options closed" color={colors.textMuted} />
            ) : null}
          </View>
        </Card>

        {event.latitude != null && event.longitude != null ? (
          <EventLocationCard
            location={{
              label: event.location,
              latitude: event.latitude,
              longitude: event.longitude,
            }}
          />
        ) : null}

        {optionsLocked ? (
          <Text style={styles.hint}>
            {event.finishedAt
              ? "This game is finished. Join, shuffle, and stat entry are closed."
              : "This game closed 12 hours after the scheduled tip-off."}
          </Text>
        ) : null}

        {isClubMember && !optionsLocked ? (
          isJoined ? (
            <Button
              title="Leave Game"
              variant="outline"
              onPress={() => setLeaveModalVisible(true)}
              style={styles.action}
            />
          ) : (
            <>
              <Button
                title={
                  isFull
                    ? "Game Full"
                    : canJoinThisGame
                      ? "Join Game"
                      : "Invite Only"
                }
                onPress={async () => {
                  setJoinError(null);
                  try {
                    await joinEvent(event.id);
                  } catch (error) {
                    if (handleSubscriptionError(error)) return;
                    setJoinError(
                      error instanceof Error
                        ? error.message
                        : "Could not join this game.",
                    );
                  }
                }}
                disabled={isFull || !canJoinThisGame}
                style={styles.action}
              />
              {joinError ? (
                <Text style={styles.hint}>{joinError}</Text>
              ) : !canJoinThisGame && !isFull ? (
                <Text style={styles.hint}>{joinAccess.reason}</Text>
              ) : null}
            </>
          )
        ) : isClubMember ? null : (
          <Text style={styles.hint}>
            Join the club to participate in this game.
          </Text>
        )}

        {canEdit && !optionsLocked ? (
          <>
            <Text style={styles.sectionLabel}>Players per court</Text>
            <PlayersPerGamePicker
              value={playersPerGame}
              maxPlayers={event.maxPlayers}
              onChange={setPlayersPerGame}
            />
            {courtCapacity.courtCount > 0 ? (
              <Text style={styles.shuffleHint}>
                {courtCapacity.courtCount} court
                {courtCapacity.courtCount === 1 ? "" : "s"} (
                {courtCapacity.assignedCount} players)
                {courtCapacity.unassignedCount > 0
                  ? ` · ${courtCapacity.unassignedCount} substitute${courtCapacity.unassignedCount !== 1 ? "s" : ""}`
                  : ""}
              </Text>
            ) : null}
          </>
        ) : null}

        {canRunShuffle && !optionsLocked ? (
          <>
            <Button
              title={
                event.shuffled
                  ? `Re-shuffle into ${gameSizeLabel} courts`
                  : `Shuffle into ${gameSizeLabel} courts`
              }
              variant="secondary"
              onPress={handleShufflePress}
              disabled={!shuffleReady || shuffling}
              icon={<Ionicons name="shuffle" size={18} color={colors.text} />}
              style={styles.action}
            />
            {!shuffleReady ? (
              <Text style={styles.shuffleHint}>
                Need at least {playersPerGame} players for {gameSizeLabel} (
                {event.participantIds.length}/{playersPerGame}).
              </Text>
            ) : null}
          </>
        ) : null}

        {shuffleError ? (
          <Text style={styles.shuffleHint}>{shuffleError}</Text>
        ) : null}

        {hasEventStats && canEdit && !optionsLocked ? (
          <Text style={styles.shuffleHint}>
            Re-shuffle is locked after scores are saved. You can still edit court
            assignments below.
          </Text>
        ) : null}

        {canEdit && event.participantIds.length > 0 && !optionsLocked ? (
          <Button
            title={
              event.shuffled ? "Edit Court Assignments" : "Organize Courts"
            }
            variant="outline"
            onPress={() => router.push(`/event/courts/${event.id}`)}
            icon={
              <Ionicons
                name="people-circle-outline"
                size={18}
                color={colors.primary}
              />
            }
            style={styles.action}
          />
        ) : null}

        {canEdit ? (
          <Button
            title="Edit Game"
            variant="outline"
            onPress={() => router.push(`/event/edit/${event.id}`)}
            icon={
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.primary}
              />
            }
            style={styles.action}
          />
        ) : null}

        {canCancel ? (
          <>
            <Button
              title="Cancel Game"
              variant="outline"
              onPress={() => setCancelModalVisible(true)}
              icon={
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={colors.error}
                />
              }
              style={styles.action}
            />
            {cancelError ? (
              <Text style={styles.cancelError}>{cancelError}</Text>
            ) : null}
          </>
        ) : null}

        {canRecordStats ? (
          <Button
            title="Open Scorekeeper"
            onPress={() => router.push(`/event/stats/${event.id}`)}
            icon={
              <Ionicons
                name="clipboard-outline"
                size={18}
                color={colors.text}
              />
            }
            style={styles.action}
          />
        ) : null}

        {hasEventStats ? <EventGameStories event={event} club={club} /> : null}

        {canFinish ? (
          <Button
            title="Mark Game Finished"
            variant="outline"
            onPress={() => setFinishModalVisible(true)}
            icon={
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.primary}
              />
            }
            style={styles.action}
          />
        ) : null}

        {courtGames.length > 0 ? (
          <>
            <SectionHeader
              title="Court Assignments"
              subtitle={`${courtGames.length} court${courtGames.length === 1 ? "" : "s"} · ${assignedOnCourt} assigned${waitlist.length > 0 ? ` · ${waitlist.length} substitute${waitlist.length !== 1 ? "s" : ""}` : ""}`}
            />
            {courtGames.map((game) => (
              <View key={game.label} style={styles.courtBlock}>
                <Text style={styles.courtTitle}>{game.label}</Text>
                <TeamShuffleView
                  teamA={game.teamA}
                  teamB={game.teamB}
                  ratingA={formatRosterRating(game.teamA)}
                  ratingB={formatRosterRating(game.teamB)}
                />
              </View>
            ))}
          </>
        ) : null}

        {courtGames.map((game) => {
          const roster = [...game.teamA, ...game.teamB];
          const gameHasStats = roster.some(
            (player) => eventStats[player.id] != null,
          );
          if (!gameHasStats && !canRecordStats) return null;

          return (
            <View key={`box-${game.label}`}>
              <SectionHeader
                title={`${game.label} Box Score`}
                subtitle={`${formatGameSizeLabel(getPlayersPerGame(event))} on-court stats`}
              />
              <BoxScoreTable participants={roster} statsByPlayer={eventStats} />
            </View>
          );
        })}

        {waitlist.length > 0 ? (
          <>
            <SectionHeader
              title="Substitutes"
              subtitle={`${waitlist.length} joined but not on a full court`}
            />
            {waitlist.some((player) => eventStats[player.id] != null) ||
            canRecordStats ? (
              <BoxScoreTable
                participants={waitlist}
                statsByPlayer={eventStats}
              />
            ) : (
              waitlist.map((player) => (
                <View key={player.id} style={styles.participantRow}>
                  <PlayerCard
                    player={player}
                    compact
                    onPress={() => router.push(`/player/${player.id}`)}
                  />
                </View>
              ))
            )}
          </>
        ) : null}

        {!optionsLocked ? (
          <EventInviteSection
            event={event}
            club={club}
            users={users}
            clubBans={clubBans}
            currentUserId={currentUserId}
            inviting={inviting}
            inviteError={inviteError}
            onInvite={handleInvitePlayers}
          />
        ) : null}

        {courtGames.length === 0 ? (
          <>
            <SectionHeader
              title="Participants"
              subtitle={`${participants.length} joined`}
            />
            {participants.map((player) => {
              const stats = eventStats[player.id] ?? EMPTY_BOX_SCORE;
              const hasStats = eventStats[player.id] != null;

              return (
                <View key={player.id} style={styles.participantRow}>
                  <PlayerCard
                    player={player}
                    compact
                    onPress={() => router.push(`/player/${player.id}`)}
                  />
                  {hasStats ? (
                    <Text style={styles.playerLine}>
                      {stats.points} PTS · {stats.rebounds} REB ·{" "}
                      {stats.assists} AST · {stats.blocks} BLK · {stats.steals}{" "}
                      STL
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>

      <ConfirmModal
        visible={reshuffleModalVisible}
        title="Re-shuffle players?"
        message={`This replaces current ${gameSizeLabel} court assignments with new random teams. Manual edits will be lost.`}
        confirmLabel="Re-shuffle"
        cancelLabel="Keep courts"
        loading={shuffling}
        onConfirm={() => {
          void handleShuffle();
        }}
        onClose={() => {
          if (!shuffling) setReshuffleModalVisible(false);
        }}
      />

      <ConfirmModal
        visible={leaveModalVisible}
        title="Leave this game?"
        message="You'll be removed from the participant list and lose your spot. Team assignments will reset if you rejoin."
        confirmLabel="Leave Game"
        cancelLabel="Stay"
        loading={leaving}
        onConfirm={handleLeaveGame}
        onClose={() => {
          if (!leaving) setLeaveModalVisible(false);
        }}
      />

      <ConfirmModal
        visible={cancelModalVisible}
        title="Cancel this game?"
        message="This removes the game for everyone. Participants will no longer see it on the schedule."
        confirmLabel="Cancel Game"
        cancelLabel="Keep Game"
        loading={cancelling}
        onConfirm={() => {
          void handleCancelGame();
        }}
        onClose={() => {
          if (!cancelling) setCancelModalVisible(false);
        }}
      />

      <ConfirmModal
        visible={finishModalVisible}
        title="Mark game finished?"
        message="Join, shuffle, and stat entry will be closed for everyone. Results and box scores stay visible."
        confirmLabel="Mark Finished"
        cancelLabel="Keep Playing"
        loading={finishing}
        onConfirm={() => {
          void handleFinishGame();
        }}
        onClose={() => {
          if (!finishing) setFinishModalVisible(false);
        }}
      />

      <UpgradeModal
        visible={upgradeVisible}
        reason={upgradeReason}
        onClose={closeUpgrade}
        onPurchased={() => {
          void upgradeToAllStar();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
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
  heroCard: {
    marginBottom: spacing.lg,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dateMonth: {
    ...typography.label,
    color: colors.text,
    fontSize: 10,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },
  heroInfo: {
    flex: 1,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    fontSize: 20,
  },
  club: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  creatorName: {
    color: colors.primary,
    fontWeight: "600",
  },
  description: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  action: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  shuffleHint: {
    ...typography.caption,
    color: colors.textDim,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  courtBlock: {
    marginBottom: spacing.lg,
  },
  courtTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.textDim,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  cancelError: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  participantRow: {
    marginBottom: spacing.sm,
  },
  playerLine: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
    marginLeft: spacing.xs,
  },
});
