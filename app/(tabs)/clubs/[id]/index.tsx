import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "@/lib/expoRouter";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useCallback, useMemo, useState } from "react";

import { ConfirmModal } from "../../../../components/ConfirmModal";
import { ClubVisibilityPicker } from "../../../../components/ClubVisibilityPicker";
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
import { formatSyncError } from "../../../../lib/syncErrors";
import { shouldShowEntitySkeleton } from "../../../../lib/entityLoading";
import { getClubMemberCap } from "../../../../lib/subscription";
import { useUpgradePrompt } from "../../../../lib/useUpgradePrompt";
import { colors, spacing, typography } from "../../../../lib/theme";
import { useTabBarPadding } from "../../../../lib/tabBar";
import { useRefreshControl } from "../../../../lib/useRefreshControl";
import { isUserBannedFromClub } from "../../../../lib/clubBans";
import {
  canLeaveClub,
  canTransferClubCaptain,
  isClubCaptain,
  isClubSubCaptain,
} from "../../../../lib/clubRoles";
import {
  useClub,
  useClubBans,
  useClubJoinRequests,
  useIsAllStar,
  useMyJoinRequest,
} from "../../../../store/hooks";
import { ClubVisibility } from "../../../../lib/types";
import { useAppStore } from "../../../../store/useAppStore";

const MEMBER_PREVIEW_COUNT = 5;

const EMPTY_HEADER_OPTIONS = { headerTitle: "" };

function resolveClubId(id: string | string[] | undefined) {
  if (typeof id === "string") return id;
  if (Array.isArray(id)) return id[0];
  return "";
}

export default function ClubDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const clubId = resolveClubId(rawId);
  const router = useRouter();
  const club = useClub(clubId);
  const events = useAppStore((state) => state.events);
  const clubs = useAppStore((state) => state.clubs);
  const hydrated = useAppStore((state) => state.hydrated);
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const joinClub = useAppStore((state) => state.joinClub);
  const requestToJoinClub = useAppStore((state) => state.requestToJoinClub);
  const cancelJoinRequest = useAppStore((state) => state.cancelJoinRequest);
  const leaveClub = useAppStore((state) => state.leaveClub);
  const pendingRequests = useClubJoinRequests(clubId);
  const myPendingRequest = useMyJoinRequest(clubId);
  const clubBans = useClubBans(clubId);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const updateClubVisibility = useAppStore(
    (state) => state.updateClubVisibility,
  );
  const isPro = useIsAllStar();
  const {
    upgradeVisible,
    upgradeReason,
    promptUpgrade,
    closeUpgrade,
    handleSubscriptionError,
  } = useUpgradePrompt();
  const [showInvite, setShowInvite] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [captainLeaveModalVisible, setCaptainLeaveModalVisible] =
    useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [savingVisibility, setSavingVisibility] = useState(false);
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

  const isMember = Boolean(
    club && currentUserId && club.memberIds.includes(currentUserId),
  );

  const openInvite = useCallback(() => {
    setShowInvite(true);
  }, []);

  const screenOptions = useMemo(
    () => ({
      headerTitle: club?.name ?? "",
      headerRight: isMember
        ? () => (
            <Pressable
              onPress={openInvite}
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
    }),
    [club?.name, isMember, openInvite],
  );

  if (!club) {
    if (shouldShowEntitySkeleton(club, hydrated, clubs.length === 0)) {
      return <ClubDetailSkeleton />;
    }

    return (
      <>
        <Stack.Screen options={EMPTY_HEADER_OPTIONS} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Club not found</Text>
        </View>
      </>
    );
  }

  const isCaptain = isClubCaptain(club, currentUserId);
  const isSubCaptain = isClubSubCaptain(club, currentUserId);
  const captainCanTransfer = canTransferClubCaptain(club, currentUserId);
  const clubEvents = events
    .filter((event) => event.clubId === club.id)
    .sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
    );

  const isBanned =
    Boolean(currentUserId) &&
    isUserBannedFromClub(club.id, currentUserId!, clubBans);

  const handleLeaveClub = async () => {
    setLeaving(true);
    setLeaveError(null);
    try {
      await leaveClub(club.id);
      setLeaveModalVisible(false);
      router.replace("/(tabs)/clubs");
    } catch (error) {
      setLeaveError(
        formatSyncError(error, "Could not leave this club. Try again."),
      );
    } finally {
      setLeaving(false);
    }
  };

  const joinAction = async () => {
    if (isMember) {
      if (isCaptain && !canLeaveClub(club, currentUserId)) {
        setCaptainLeaveModalVisible(true);
        return;
      }
      setLeaveModalVisible(true);
      return;
    }

    if (isBanned) return;

    setJoinError(null);

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
      if (handleSubscriptionError(error)) return;
      setJoinError(
        error instanceof Error ? error.message : "Could not join this club.",
      );
    }
  };

  const joinButtonTitle = isMember
    ? "Leave Club"
    : isBanned
      ? "Banned from club"
      : club.visibility === "open"
        ? "Join Club"
        : myPendingRequest
          ? "Cancel Request"
          : "Request to Join";

  const clubCaptain = users.find((user) => user.id === club.adminId) ?? null;
  const clubMemberCap = getClubMemberCap(clubCaptain);
  const memberCapLabel =
    clubMemberCap < 9999
      ? `${members.length}/${clubMemberCap}`
      : String(members.length);

  const handleVisibilityChange = async (next: ClubVisibility) => {
    if (next === club.visibility) return;

    setVisibilityError(null);
    setSavingVisibility(true);

    try {
      await updateClubVisibility(club.id, next);
    } catch (error) {
      if (handleSubscriptionError(error)) return;
      setVisibilityError(
        formatSyncError(error, "Could not update club visibility."),
      );
    } finally {
      setSavingVisibility(false);
    }
  };

  return (
    <>
      <Stack.Screen options={screenOptions} />
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
          <View style={styles.badgeRow}>
            <Badge
              label={club.visibility === "open" ? "Public" : "Private"}
              color={
                club.visibility === "open" ? colors.success : colors.warning
              }
            />
            {myPendingRequest ? (
              <Badge label="Requested" color={colors.accent} />
            ) : null}
          </View>
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
            {isCaptain ? (
              <StatPill icon="shield" value="Captain" label="Role" />
            ) : isSubCaptain ? (
              <StatPill icon="shield" value="Sub-Captain" label="Role" />
            ) : null}
          </View>
        </View>

        <Button
          title={joinButtonTitle}
          variant={
            isMember || myPendingRequest || isBanned ? "outline" : "primary"
          }
          onPress={joinAction}
          disabled={isBanned}
          style={styles.actionBtn}
        />
        {joinError ? <Text style={styles.bannedHint}>{joinError}</Text> : null}
        {leaveError ? <Text style={styles.bannedHint}>{leaveError}</Text> : null}
        {isBanned ? (
          <Text style={styles.bannedHint}>
            You were banned from this club. Contact the captain if you think
            this was a mistake.
          </Text>
        ) : null}

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

        {isCaptain && club.visibility === "private" ? (
          <Button
            title={
              pendingRequests.length > 0
                ? `Join Requests (${pendingRequests.length})`
                : "Join Requests"
            }
            variant="outline"
            onPress={() => router.push(`/clubs/${club.id}/requests`)}
            icon={
              <Ionicons
                name="person-add-outline"
                size={18}
                color={colors.primary}
              />
            }
            style={styles.actionBtn}
          />
        ) : null}

        {isCaptain ? (
          <Card style={styles.visibilityCard}>
            <Text style={styles.visibilityTitle}>Club visibility</Text>
            <Text style={styles.visibilityHint}>
              Public clubs let anyone join. Private clubs require your approval.
            </Text>
            <ClubVisibilityPicker
              value={club.visibility}
              onChange={(next) => {
                void handleVisibilityChange(next);
              }}
              isPro={isPro}
              onRequirePro={promptUpgrade}
              disabled={savingVisibility}
            />
            {visibilityError ? (
              <Text style={styles.visibilityError}>{visibilityError}</Text>
            ) : null}
          </Card>
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
      <ConfirmModal
        visible={leaveModalVisible}
        title="Leave this club?"
        message="You'll lose access to club games and chat. You can rejoin later if the club is public or request access again for private clubs."
        confirmLabel="Leave Club"
        cancelLabel="Stay"
        loading={leaving}
        onConfirm={() => {
          void handleLeaveClub();
        }}
        onClose={() => {
          if (!leaving) {
            setLeaveModalVisible(false);
            setLeaveError(null);
          }
        }}
      />

      <ConfirmModal
        visible={captainLeaveModalVisible}
        title="Transfer captain role first"
        message={
          captainCanTransfer
            ? "As club captain, you must transfer leadership to another member before you can leave."
            : "Invite at least one other member to this club, then transfer captain role to them before leaving."
        }
        confirmLabel={captainCanTransfer ? "Go to Members" : "Invite Players"}
        cancelLabel="Stay"
        onConfirm={() => {
          setCaptainLeaveModalVisible(false);
          if (captainCanTransfer) {
            router.push(`/clubs/${club.id}/members`);
            return;
          }
          setShowInvite(true);
        }}
        onClose={() => setCaptainLeaveModalVisible(false)}
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
  bannedHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  headerBtn: {
    marginRight: spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
  },
  empty: {
    ...typography.body,
    color: colors.textDim,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  visibilityCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  visibilityTitle: {
    ...typography.label,
    color: colors.text,
  },
  visibilityHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  visibilityError: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
  },
});
