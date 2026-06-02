import { useLocalSearchParams, useRouter } from "@/lib/expoRouter";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PlayerCard } from "../../../../components/PlayerCard";
import { UpgradeModal } from "../../../../components/UpgradeModal";
import {
  Button,
  Card,
  ClubDetailSkeleton,
  EmptyState,
} from "../../../../components/ui";
import { shouldShowEntitySkeleton } from "../../../../lib/entityLoading";
import { colors, spacing, typography } from "../../../../lib/theme";
import { useTabBarPadding } from "../../../../lib/tabBar";
import { useRefreshControl } from "../../../../lib/useRefreshControl";
import { useUpgradePrompt } from "../../../../lib/useUpgradePrompt";
import { useClub, useClubJoinRequests } from "../../../../store/hooks";
import { useAppStore } from "../../../../store/useAppStore";

function resolveClubId(id: string | string[] | undefined) {
  if (typeof id === "string") return id;
  if (Array.isArray(id)) return id[0];
  return undefined;
}

export default function ClubJoinRequestsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const clubId = resolveClubId(id) ?? "";
  const club = useClub(clubId);
  const clubs = useAppStore((state) => state.clubs);
  const hydrated = useAppStore((state) => state.hydrated);
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const pendingRequests = useClubJoinRequests(clubId);
  const approveJoinRequest = useAppStore((state) => state.approveJoinRequest);
  const denyJoinRequest = useAppStore((state) => state.denyJoinRequest);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const {
    upgradeVisible,
    upgradeReason,
    closeUpgrade,
    handleSubscriptionError,
  } = useUpgradePrompt();
  const bottomPadding = useTabBarPadding(spacing.lg);
  const { refreshControl } = useRefreshControl();

  const sortedRequests = useMemo(
    () =>
      [...pendingRequests].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [pendingRequests],
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

  const isAdmin = club.adminId === currentUserId;
  const canManage = isAdmin && club.visibility === "private";

  if (!canManage) {
    return (
      <View style={styles.notFound}>
        <EmptyState
          icon={
            <Ionicons
              name="shield-checkmark-outline"
              size={32}
              color={colors.textMuted}
            />
          }
          title="Captains only"
          description="Only the captain of a private club can review join requests."
        />
        <Button
          title="Back to Club"
          variant="outline"
          onPress={() => router.back()}
          style={styles.backBtn}
        />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
        ]}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          {sortedRequests.length === 0
            ? "No pending requests right now."
            : `${sortedRequests.length} player${sortedRequests.length === 1 ? "" : "s"} waiting to join ${club.name}.`}
        </Text>

        {sortedRequests.length === 0 ? (
          <EmptyState
            icon={
              <Ionicons
                name="checkmark-done-outline"
                size={32}
                color={colors.textMuted}
              />
            }
            title="All caught up"
            description="When someone requests to join this private club, they will show up here."
          />
        ) : (
          sortedRequests.map((request) => {
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
                    onPress={async () => {
                      try {
                        await approveJoinRequest(request.id);
                      } catch (error) {
                        handleSubscriptionError(error);
                      }
                    }}
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
          })
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
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.lg,
  },
  notFoundText: {
    color: colors.textMuted,
    textAlign: "center",
  },
  backBtn: {
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.lg,
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
});
