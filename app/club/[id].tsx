import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EventCard } from '../../components/EventCard';
import { PlayerCard } from '../../components/PlayerCard';
import { Button, SectionHeader } from '../../components/ui';
import { colors, spacing, typography } from '../../lib/theme';
import { useAppStore } from '../../store/useAppStore';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const club = useAppStore((state) => state.getClubById(id));
  const events = useAppStore((state) => state.events);
  const getUserById = useAppStore((state) => state.getUserById);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const joinClub = useAppStore((state) => state.joinClub);
  const leaveClub = useAppStore((state) => state.leaveClub);

  if (!club) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Club not found</Text>
      </View>
    );
  }

  const isMember = club.memberIds.includes(currentUserId ?? '');
  const isAdmin = club.adminId === currentUserId;
  const members = club.memberIds
    .map((memberId) => getUserById(memberId))
    .filter(Boolean);
  const clubEvents = events
    .filter((event) => event.clubId === club.id)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  return (
    <>
      <Stack.Screen options={{ headerTitle: club.name }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.icon, { backgroundColor: `${club.iconColor}22` }]}>
            <Ionicons name="basketball" size={36} color={club.iconColor} />
          </View>
          <Text style={styles.location}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} /> {club.location}
          </Text>
          <Text style={styles.description}>{club.description}</Text>
          <View style={styles.statsRow}>
            <StatPill icon="people" value={String(members.length)} label="Members" />
            <StatPill icon="calendar" value={String(clubEvents.length)} label="Games" />
            {isAdmin ? <StatPill icon="shield" value="Admin" label="Role" /> : null}
          </View>
        </View>

        <Button
          title={isMember ? 'Leave Club' : 'Join Club'}
          variant={isMember ? 'outline' : 'primary'}
          onPress={() => (isMember ? leaveClub(club.id) : joinClub(club.id))}
          style={styles.actionBtn}
        />

        {isMember ? (
          <Button
            title="Create Game"
            variant="secondary"
            onPress={() => router.push({ pathname: '/event/create', params: { clubId: club.id } })}
            icon={<Ionicons name="add" size={18} color={colors.text} />}
            style={styles.actionBtn}
          />
        ) : null}

        <SectionHeader title="Members" subtitle={`${members.length} ballers`} />
        {members.map((member) => (
          member ? <PlayerCard key={member.id} player={member} compact /> : null
        ))}

        <SectionHeader title="Games & Events" subtitle="Upcoming and past runs" />
        {clubEvents.length === 0 ? (
          <Text style={styles.empty}>No games scheduled yet.</Text>
        ) : (
          clubEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isJoined={event.participantIds.includes(currentUserId ?? '')}
              onPress={() => router.push(`/event/${event.id}`)}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  location: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    minWidth: 80,
  },
  statValue: {
    ...typography.heading,
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 11,
  },
  actionBtn: {
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.textDim,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
