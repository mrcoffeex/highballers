import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlayerCard } from '../../components/PlayerCard';
import { TeamShuffleView, triggerShuffleHaptic } from '../../components/TeamShuffleView';
import { Badge, Button, Card, SectionHeader } from '../../components/ui';
import { calculatePlayerRating } from '../../lib/teamBalancer';
import { colors, spacing, typography } from '../../lib/theme';
import { UserProfile } from '../../lib/types';
import { useAppStore } from '../../store/useAppStore';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useAppStore((state) => state.getEventById(id));
  const club = useAppStore((state) => state.getClubById(event?.clubId ?? ''));
  const getUserById = useAppStore((state) => state.getUserById);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const joinEvent = useAppStore((state) => state.joinEvent);
  const leaveEvent = useAppStore((state) => state.leaveEvent);
  const shuffleTeams = useAppStore((state) => state.shuffleTeams);

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
  const canShuffle = event.participantIds.length >= 2;

  const participants = event.participantIds
    .map((playerId) => getUserById(playerId))
    .filter((player): player is UserProfile => Boolean(player));

  const teams =
    event.shuffled && event.teamA && event.teamB
      ? (() => {
          const teamA = event.teamA
            .map((playerId) => getUserById(playerId))
            .filter((player): player is UserProfile => Boolean(player));
          const teamB = event.teamB
            .map((playerId) => getUserById(playerId))
            .filter((player): player is UserProfile => Boolean(player));

          return {
            teamA,
            teamB,
            ratingA: teamA.reduce((sum, player) => sum + calculatePlayerRating(player.stats), 0),
            ratingB: teamB.reduce((sum, player) => sum + calculatePlayerRating(player.stats), 0),
          };
        })()
      : null;

  const handleShuffle = async () => {
    shuffleTeams(event.id);
    await triggerShuffleHaptic();
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
            {event.shuffled ? <Badge label="Teams balanced" color={colors.accent} /> : null}
          </View>
        </Card>

        {isClubMember ? (
          isJoined ? (
            <Button title="Leave Game" variant="outline" onPress={() => leaveEvent(event.id)} style={styles.action} />
          ) : (
            <Button
              title={isFull ? 'Game Full' : 'Join Game'}
              onPress={() => joinEvent(event.id)}
              disabled={isFull}
              style={styles.action}
            />
          )
        ) : (
          <Text style={styles.hint}>Join the club to participate in this game.</Text>
        )}

        {isJoined && canShuffle ? (
          <Button
            title={event.shuffled ? 'Re-shuffle Teams' : 'Shuffle Teams'}
            variant="secondary"
            onPress={handleShuffle}
            icon={<Ionicons name="shuffle" size={18} color={colors.text} />}
            style={styles.action}
          />
        ) : null}

        {teams ? (
          <>
            <SectionHeader
              title="Balanced Teams"
              subtitle="Split based on height, weight, and skill stats"
            />
            <TeamShuffleView
              teamA={teams.teamA}
              teamB={teams.teamB}
              ratingA={teams.ratingA}
              ratingB={teams.ratingB}
            />
          </>
        ) : null}

        <SectionHeader
          title="Participants"
          subtitle={`${participants.length} joined`}
        />
        {participants.map((player) => (
          <View key={player.id} style={styles.participantRow}>
            <PlayerCard player={player} compact />
            <Text style={styles.participantRating}>OVR {calculatePlayerRating(player.stats)}</Text>
          </View>
        ))}
      </ScrollView>
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
    gap: spacing.sm,
  },
  action: {
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
  participantRating: {
    ...typography.caption,
    color: colors.secondary,
    textAlign: 'right',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
});
