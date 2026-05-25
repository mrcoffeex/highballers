import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { BoxScoreTable } from '../../components/BoxScoreTable';
import { ConfirmModal } from '../../components/ConfirmModal';
import { EventLocationCard } from '../../components/EventLocationCard';
import { PlayerCard } from '../../components/PlayerCard';
import { PlayersPerGamePicker } from '../../components/PlayersPerGamePicker';
import { TeamShuffleView, triggerShuffleHaptic } from '../../components/TeamShuffleView';
import { Badge, Button, Card, SectionHeader } from '../../components/ui';
import {
  canEditEvent,
  canManageEventStats,
  canMarkEventFinished,
  canRecordEventStats,
  hasEventStarted,
  isEventOptionsLocked,
} from '../../lib/gameEvents';
import { canShuffleEvent, getCourtGameCount, formatRosterRating } from '../../lib/eventRoster';
import {
  clampPlayersPerGame,
  DEFAULT_PLAYERS_PER_GAME,
  describeCourtCapacity,
  formatGameSizeLabel,
  getPlayersPerGame,
} from '../../lib/gameFormats';
import { colors, spacing, typography } from '../../lib/theme';
import { BoxScoreStats, EMPTY_BOX_SCORE, UserProfile } from '../../lib/types';
import { useClub, useCourtGames, useEvent, useEventWaitlist } from '../../store/hooks';
import { useAppStore } from '../../store/useAppStore';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const event = useEvent(id);
  const club = useClub(event?.clubId ?? '');
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const gameStatRecords = useAppStore((state) => state.gameStatRecords);
  const joinEvent = useAppStore((state) => state.joinEvent);
  const leaveEvent = useAppStore((state) => state.leaveEvent);
  const shuffleTeams = useAppStore((state) => state.shuffleTeams);
  const finishEvent = useAppStore((state) => state.finishEvent);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [playersPerGame, setPlayersPerGame] = useState(DEFAULT_PLAYERS_PER_GAME);

  useEffect(() => {
    if (!event) return;
    setPlayersPerGame(clampPlayersPerGame(getPlayersPerGame(event), event.maxPlayers));
  }, [event?.id, event?.maxPlayers, event?.playersPerGame]);

  const participants = useMemo(
    () =>
      (event?.participantIds ?? [])
        .map((playerId) => users.find((user) => user.id === playerId))
        .filter((player): player is UserProfile => Boolean(player)),
    [event?.participantIds, users],
  );

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

  if (!event) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Game not found</Text>
      </View>
    );
  }

  const isJoined = event.participantIds.includes(currentUserId ?? '');
  const isFull = event.participantIds.length >= event.maxPlayers;
  const isClubMember = club?.memberIds.includes(currentUserId ?? '') ?? false;
  const shuffleReady = event ? canShuffleEvent(event, playersPerGame) : false;
  const courtCapacity = describeCourtCapacity(event.participantIds.length, playersPerGame);
  const gameSizeLabel = formatGameSizeLabel(playersPerGame);
  const optionsLocked = isEventOptionsLocked(event);
  const eventStarted = hasEventStarted(event);
  const canEdit = canEditEvent(event, currentUserId, club?.adminId);
  const canRecordStats = canRecordEventStats(event, currentUserId, club?.adminId);
  const canManageStats = canManageEventStats(event, currentUserId, club?.adminId);
  const canFinish = canMarkEventFinished(event, currentUserId, club?.adminId);

  const handleShuffle = async () => {
    shuffleTeams(event.id, playersPerGame);
    await triggerShuffleHaptic();
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

  const date = new Date(event.dateTime);

  return (
    <>
      <Stack.Screen options={{ headerTitle: event.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateMonth}>{format(date, 'MMM')}</Text>
              <Text style={styles.dateDay}>{format(date, 'd')}</Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.title}>{event.title}</Text>
              {club ? <Text style={styles.club}>{club.name}</Text> : null}
              <View style={styles.meta}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{format(date, 'EEEE, h:mm a')}</Text>
              </View>
              <View style={styles.meta}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{event.location}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.description}>{event.description}</Text>
          <View style={styles.badges}>
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
            {eventStarted && !optionsLocked ? <Badge label="Live" color={colors.success} /> : null}
            {event.finishedAt ? <Badge label="Finished" color={colors.textMuted} /> : null}
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
              ? 'This game is finished. Join, shuffle, and stat entry are closed.'
              : 'This game closed 12 hours after the scheduled tip-off.'}
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
            <Button
              title={isFull ? 'Game Full' : 'Join Game'}
              onPress={() => joinEvent(event.id)}
              disabled={isFull}
              style={styles.action}
            />
          )
        ) : isClubMember ? null : (
          <Text style={styles.hint}>Join the club to participate in this game.</Text>
        )}

        {isJoined && !optionsLocked ? (
          <>
            <Text style={styles.sectionLabel}>Players per court</Text>
            <PlayersPerGamePicker
              value={playersPerGame}
              maxPlayers={event.maxPlayers}
              onChange={setPlayersPerGame}
            />
            {courtCapacity.courtCount > 0 ? (
              <Text style={styles.shuffleHint}>
                {courtCapacity.courtCount} court{courtCapacity.courtCount === 1 ? '' : 's'} (
                {courtCapacity.assignedCount} players)
                {courtCapacity.unassignedCount > 0
                  ? ` · ${courtCapacity.unassignedCount} unassigned`
                  : ''}
              </Text>
            ) : null}
          </>
        ) : null}

        {isJoined && shuffleReady && !optionsLocked ? (
          <Button
            title={
              event.shuffled
                ? `Re-shuffle into ${gameSizeLabel} courts`
                : `Shuffle into ${gameSizeLabel} courts`
            }
            variant="secondary"
            onPress={handleShuffle}
            icon={<Ionicons name="shuffle" size={18} color={colors.text} />}
            style={styles.action}
          />
        ) : isJoined && !shuffleReady && !optionsLocked ? (
          <Text style={styles.shuffleHint}>
            Need at least {playersPerGame} players for {gameSizeLabel} (
            {event.participantIds.length}/{playersPerGame}).
          </Text>
        ) : null}

        {canEdit ? (
          <Button
            title="Edit Game"
            variant="outline"
            onPress={() => router.push(`/event/edit/${event.id}`)}
            icon={<Ionicons name="create-outline" size={18} color={colors.primary} />}
            style={styles.action}
          />
        ) : null}

        {canRecordStats ? (
          <Button
            title="Open Scorekeeper"
            onPress={() => router.push(`/event/stats/${event.id}`)}
            icon={<Ionicons name="clipboard-outline" size={18} color={colors.text} />}
            style={styles.action}
          />
        ) : canManageStats && !event.shuffled ? (
          <Text style={styles.shuffleHint}>Shuffle courts before opening the scorekeeper.</Text>
        ) : null}

        {canFinish ? (
          <Button
            title="Mark Game Finished"
            variant="outline"
            onPress={() => finishEvent(event.id)}
            icon={<Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />}
            style={styles.action}
          />
        ) : null}

        {courtGames.length > 0 ? (
          <>
            <SectionHeader
              title="Court Assignments"
              subtitle={`${courtGames.length} ${formatGameSizeLabel(getPlayersPerGame(event))} game${courtGames.length === 1 ? '' : 's'} · ${courtGames.length * getPlayersPerGame(event)} on court`}
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
          const gameHasStats = roster.some((player) => eventStats[player.id] != null);
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
              title="Unassigned"
              subtitle={`${waitlist.length} joined but not on a full court`}
            />
            {waitlist.some((player) => eventStats[player.id] != null) || canRecordStats ? (
              <BoxScoreTable participants={waitlist} statsByPlayer={eventStats} />
            ) : (
              waitlist.map((player) => (
                <View key={player.id} style={styles.participantRow}>
                  <PlayerCard player={player} compact />
                </View>
              ))
            )}
          </>
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
              <PlayerCard player={player} compact />
              {hasStats ? (
                <Text style={styles.playerLine}>
                  {stats.points} PTS · {stats.rebounds} REB · {stats.assists} AST · {stats.blocks} BLK ·{' '}
                  {stats.steals} STL
                </Text>
              ) : null}
            </View>
          );
        })}
          </>
        ) : null}
      </ScrollView>

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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notFoundText: {
    color: colors.textMuted,
  },
  heroCard: {
    marginBottom: spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  dateBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    ...typography.label,
    color: colors.text,
    fontSize: 10,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '800',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  description: {
    ...typography.body,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    textAlign: 'center',
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
    textAlign: 'center',
    marginBottom: spacing.lg,
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
