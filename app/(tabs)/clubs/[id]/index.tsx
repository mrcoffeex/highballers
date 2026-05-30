import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useMemo, useState } from "react";

import { EventCard } from "../../../../components/EventCard";
import { ClubIcon } from "../../../../components/ClubIcon";
import { ClubInviteModal } from "../../../../components/ClubInviteModal";
import { UpgradeModal } from "../../../../components/UpgradeModal";
import { PlayerCard } from "../../../../components/PlayerCard";
import {
  Badge,
  Button,
  Card,
  ClubDetailSkeleton,
  SectionHeader,
} from "../../../../components/ui";
import { shouldShowEntitySkeleton } from "../../../../lib/entityLoading";
import { getClubMemberCap } from "../../../../lib/subscription";
import { useUpgradePrompt } from "../../../../lib/useUpgradePrompt";
import { colors, spacing, typography } from "../../../../lib/theme";
import { useTabBarPadding } from "../../../../lib/tabBar";
import { useRefreshControl } from "../../../../lib/useRefreshControl";
import { useClub, useIsAllStar } from "../../../../store/hooks";
import { useAppStore } from "../../../../store/useAppStore";

const MEMBER_PREVIEW_COUNT = 5;

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const club = useClub(id);
  const events = useAppStore((state) => state.events);
  const clubs = useAppStore((state) => state.clubs);
  const hydrated = useAppStore((state) => state.hydrated);
  const users = useAppStore((state) => state.users);
  const joinRequests = useAppStore((state) => state.joinRequests);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const joinClub = useAppStore((state) => state.joinClub);
  const requestToJoinClub = useAppStore((state) => state.requestToJoinClub);
  const cancelJoinRequest = useAppStore((state) => state.cancelJoinRequest);
  const approveJoinRequest = useAppStore((state) => state.approveJoinRequest);
  const denyJoinRequest = useAppStore((state) => state.denyJoinRequest);
  const leaveClub = useAppStore((state) => state.leaveClub);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const isPro = useIsAllStar();
  const {
    upgradeVisible,
    upgradeReason,
    promptUpgrade,
    closeUpgrade,
    handleSubscriptionError,
  } = useUpgradePrompt();
  const [showInvite, setShowInvite] = useState(false);
  const bottomPadding = useTabBarPadding(spacing.lg);
  const { refreshControl } = useRefreshControl();

  const members = useMemo(
    () =>
      (club?.memberIds ?? [])
        .map((memberId) => users.find((user) => user.id === memberId))
        .filter(Boolean),
    [club?.memberIds, users],
  );

  const previewMembers = members.slice(0, MEMBER_PREVIEW_COUNT);

  const pendingRequests = useMemo(
    () =>
      club ? joinRequests.filter((request) => request.clubId === club.id) : [],
    [club, joinRequests],
  );

  const myPendingRequest = useMemo(
    () =>
      pendingRequests.find((request) => request.userId === currentUserId) ??
      null,
    [pendingRequests, currentUserId],
  );

  if (!club) {
    if (shouldShowEntitySkeleton(club, hydrated, clubs.length === 0)) {
      return <ClubDetailSkeleton />;
    }

    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Club not found</Text>
      </View>
    );
  }

  const isMember = club.memberIds.includes(currentUserId ?? "");
  const isAdmin = club.adminId === currentUserId;
  const clubEvents = events
    .filter((event) => event.clubId === club.id)
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );

  const joinAction = async () => {
    if (isMember) {
      leaveClub(club.id);
      return;
    }

    try {
      if (club.visibility === "open") {
        await joinClub(club.id);
        return;
      }

      if (myPendingRequest) {
        cancelJoinRequest(club.id);
        return;
      }

      await requestToJoinClub(club.id);
    } catch (error) {
      handleSubscriptionError(error);
    }
  };

  const requirePro = (featureMessage: string, action: () => void) => {
    if (isPro) {
      action();
      return;
    }
    promptUpgrade(featureMessage);
  };

  const joinButtonTitle = isMember
    ? "Leave Club"
    : club.visibility === "open"
      ? "Join Club"
      : myPendingRequest
        ? "Cancel Request"
        : "Request to Join";

  const clubAdmin = users.find((user) => user.id === club.adminId) ?? null;
  const clubMemberCap = getClubMemberCap(clubAdmin);
  const memberCapLabel =
    clubMemberCap < 9999
      ? `${members.length}/${clubMemberCap}`
      : String(members.length);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: club.name,
          headerRight: isMember
            ? () => (
                <Pressable
                  onPress={() => setShowInvite(true)}
                  hitSlop={12}
                  style={styles.headerBtn}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={22}
                    color={colors.primary}
                  />
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
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <ClubIcon
            name={club.name}
            iconColor={club.iconColor}
            iconUrl={club.iconUrl}
            size={72}
          />
          <Badge
            label={club.visibility === "open" ? "Open Club" : "Private Club"}
            color={club.visibility === "open" ? colors.success : colors.warning}
          />
          <Text style={styles.location}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.textMuted}
            />{" "}
            {club.location}
          </Text>
          <Text style={styles.description}>{club.description}</Text>
          <View style={styles.statsRow}>
            <StatPill icon="people" value={memberCapLabel} label="Members" />
            <StatPill
              icon="calendar"
              value={String(clubEvents.length)}
              label="Games"
            />
            {isAdmin ? (
              <StatPill icon="shield" value="Admin" label="Role" />
            ) : null}
          </View>
        </View>

        <Button
          title={joinButtonTitle}
          variant={isMember || myPendingRequest ? "outline" : "primary"}
          onPress={joinAction}
          style={styles.actionBtn}
        />

        {isMember ? (
          <>
            <Button
              title="Invite Players"
              variant="outline"
              onPress={() => setShowInvite(true)}
              icon={
                <Ionicons
                  name="qr-code-outline"
                  size={18}
                  color={colors.primary}
                />
              }
              style={styles.actionBtn}
            />
            <Button
              title="Create Game"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: "/event/create",
                  params: { clubId: club.id },
                })
              }
              icon={<Ionicons name="add" size={18} color={colors.text} />}
              style={styles.actionBtn}
            />
            <Button
              title="Group Chat"
              variant="outline"
              onPress={() => router.push(`/chats/${club.id}`)}
              icon={
                <Ionicons
                  name="chatbubbles-outline"
                  size={18}
                  color={colors.primary}
                />
              }
              style={styles.actionBtn}
            />
          </>
        ) : null}

        {isAdmin &&
        club.visibility === "private" &&
        pendingRequests.length > 0 ? (
          <>
            <SectionHeader
              title="Join Requests"
              subtitle={`${pendingRequests.length} pending`}
            />
            {pendingRequests.map((request) => {
              const player = users.find((user) => user.id === request.userId);
              if (!player) return null;

              return (
                <Card key={request.id} style={styles.requestCard}>
                  <PlayerCard
                    player={player}
                    compact
                    onPress={() => router.push(`/player/${player.id}`)}
                  />
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

        <SectionHeader
          title="Members"
          subtitle={`${members.length} baller${members.length !== 1 ? "s" : ""}`}
          action={
            members.length > 0 ? (
              <Button
                title="See all"
                variant="ghost"
                size="sm"
                onPress={() => router.push(`/clubs/${club.id}/members`)}
              />
            ) : undefined
          }
        />
        {members.length === 0 ? (
          <Text style={styles.empty}>No members yet.</Text>
        ) : (
          previewMembers.map((member) =>
            member ? (
              <PlayerCard
                key={member.id}
                player={member}
                compact
                onPress={() => router.push(`/player/${member.id}`)}
              />
            ) : null,
          )
        )}

        <SectionHeader
          title="Games & Events"
          subtitle="Upcoming and past runs"
        />
        {clubEvents.length === 0 ? (
          <Text style={styles.empty}>No games scheduled yet.</Text>
        ) : (
          clubEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isJoined={event.participantIds.includes(currentUserId ?? "")}
              onPress={() => router.push(`/event/${event.id}`)}
            />
          ))
        )}
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  notFoundText: {
    color: colors.textMuted,
  },
  hero: {
    alignItems: "center",
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
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statPill: {
    alignItems: "center",
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
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  requestBtn: {
    flex: 1,
  },
  empty: {
    ...typography.body,
    color: colors.textDim,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});
