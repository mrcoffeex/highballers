import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useMemo, useState } from 'react';

import { EventCard } from '../../../components/EventCard';
import { ClubIcon } from '../../../components/ClubIcon';
import { ClubInviteModal } from '../../../components/ClubInviteModal';
import { PlayerCard } from '../../../components/PlayerCard';
import { Badge, Button, Card, SectionHeader } from '../../../components/ui';
import { colors, spacing, typography } from '../../../lib/theme';
import { useTabBarPadding } from '../../../lib/tabBar';
import { useClub } from '../../../store/hooks';
import { useAppStore } from '../../../store/useAppStore';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const club = useClub(id);
  const events = useAppStore((state) => state.events);
  const users = useAppStore((state) => state.users);
  const joinRequests = useAppStore((state) => state.joinRequests);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const joinClub = useAppStore((state) => state.joinClub);
  const requestToJoinClub = useAppStore((state) => state.requestToJoinClub);
  const cancelJoinRequest = useAppStore((state) => state.cancelJoinRequest);
  const approveJoinRequest = useAppStore((state) => state.approveJoinRequest);
  const denyJoinRequest = useAppStore((state) => state.denyJoinRequest);
  const leaveClub = useAppStore((state) => state.leaveClub);
  const [showInvite, setShowInvite] = useState(false);
  const bottomPadding = useTabBarPadding(spacing.lg);

  const members = useMemo(
    () =>
      (club?.memberIds ?? [])
        .map((memberId) => users.find((user) => user.id === memberId))
        .filter(Boolean),
    [club?.memberIds, users],
  );

  const pendingRequests = useMemo(
    () => (club ? joinRequests.filter((request) => request.clubId === club.id) : []),
    [club, joinRequests],
  );

  const myPendingRequest = useMemo(
    () =>
      pendingRequests.find((request) => request.userId === currentUserId) ?? null,
    [pendingRequests, currentUserId],
  );

  if (!club) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Club not found</Text>
      </View>
    );
  }

  const isMember = club.memberIds.includes(currentUserId ?? '');
  const isAdmin = club.adminId === currentUserId;
  const clubEvents = events
    .filter((event) => event.clubId === club.id)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const joinAction = () => {
    if (isMember) {
      leaveClub(club.id);
      return;
    }

    if (club.visibility === 'open') {
      joinClub(club.id);
      return;
    }

    if (myPendingRequest) {
      cancelJoinRequest(club.id);
      return;
    }

    requestToJoinClub(club.id);
  };

  const joinButtonTitle = isMember
    ? 'Leave Club'
    : club.visibility === 'open'
      ? 'Join Club'
      : myPendingRequest
        ? 'Cancel Request'
        : 'Request to Join';

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: club.name,
          headerRight: isMember
            ? () => (
                <Pressable onPress={() => setShowInvite(true)} hitSlop={12} style={styles.headerBtn}>
                  <Ionicons name="person-add-outline" size={22} color={colors.primary} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <ClubInviteModal
        visible={showInvite}
        clubId={club.id}
        clubName={club.name}
        visibility={club.visibility}
        onClose={() => setShowInvite(false)}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      >
        <View style={styles.hero}>
          <ClubIcon name={club.name} iconColor={club.iconColor} iconUrl={club.iconUrl} size={72} />
          <Badge
            label={club.visibility === 'open' ? 'Open Club' : 'Private Club'}
            color={club.visibility === 'open' ? colors.success : colors.warning}
          />
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
          title={joinButtonTitle}
          variant={isMember || myPendingRequest ? 'outline' : 'primary'}
          onPress={joinAction}
          style={styles.actionBtn}
        />

        {isMember ? (
          <>
            <Button
              title="Invite Players"
              variant="outline"
              onPress={() => setShowInvite(true)}
              icon={<Ionicons name="qr-code-outline" size={18} color={colors.primary} />}
              style={styles.actionBtn}
            />
            <Button
              title="Create Game"
              variant="secondary"
              onPress={() => router.push({ pathname: '/event/create', params: { clubId: club.id } })}
              icon={<Ionicons name="add" size={18} color={colors.text} />}
              style={styles.actionBtn}
            />
          </>
        ) : null}

        {isAdmin && club.visibility === 'private' && pendingRequests.length > 0 ? (
          <>
            <SectionHeader title="Join Requests" subtitle={`${pendingRequests.length} pending`} />
            {pendingRequests.map((request) => {
              const player = users.find((user) => user.id === request.userId);
              if (!player) return null;

              return (
                <Card key={request.id} style={styles.requestCard}>
                  <PlayerCard player={player} compact />
                  <View style={styles.requestActions}>
                    <Button
                      title="Approve"
                      size="sm"
                      onPress={() => approveJoinRequest(request.id)}
                      style={styles.requestBtn}
                    />
                    <Button
                      title="Deny"
                      size="sm"
                      variant="outline"
                      onPress={() => denyJoinRequest(request.id)}
                      style={styles.requestBtn}
                    />
                  </View>
                </Card>
              );
            })}
          </>
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
    gap: spacing.sm,
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
  headerBtn: {
    marginRight: spacing.sm,
  },
  requestCard: {
    marginBottom: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  requestBtn: {
    flex: 1,
  },
  empty: {
    ...typography.body,
    color: colors.textDim,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
