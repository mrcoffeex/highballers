import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "@/lib/expoRouter";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";

import { ConfirmModal } from "../../../../components/ConfirmModal";
import { ClubIcon } from "../../../../components/ClubIcon";
import { PlayerCard } from "../../../../components/PlayerCard";
import {
  SwipeableMemberRow,
  type SwipeableMethods,
} from "../../../../components/SwipeableMemberRow";
import {
  Badge,
  Button,
  Card,
  ClubDetailSkeleton,
  EmptyState,
  Input,
  LoadMoreSkeleton,
  MemberListSkeleton,
} from "../../../../components/ui";
import { isSupabaseEnabled } from "../../../../lib/config";
import { shouldShowEntitySkeleton } from "../../../../lib/entityLoading";
import {
  CLUB_MEMBERS_PAGE_SIZE,
  fetchClubMembersPage,
  getClubMembersPageFromStore,
} from "../../../../lib/supabaseSync";
import { getRemoteCache, setRemoteCache } from "../../../../lib/remoteCache";
import { formatSyncError } from "../../../../lib/syncErrors";
import { colors, radius, spacing, typography } from "../../../../lib/theme";
import { useTabBarPadding } from "../../../../lib/tabBar";
import { useRefreshControl } from "../../../../lib/useRefreshControl";
import { isClubCaptain, MAX_SUB_CAPTAINS } from "../../../../lib/clubRoles";
import { Club, UserProfile } from "../../../../lib/types";
import { useClub, useClubBans } from "../../../../store/hooks";
import { useAppStore } from "../../../../store/useAppStore";

function matchesSearch(player: UserProfile, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    player.name.toLowerCase().includes(normalized) ||
    player.nickname?.toLowerCase().includes(normalized)
  );
}

function mergeMemberPages(existing: UserProfile[], incoming: UserProfile[]) {
  const seen = new Set(existing.map((member) => member.id));
  const merged = [...existing];

  for (const member of incoming) {
    if (seen.has(member.id)) continue;
    seen.add(member.id);
    merged.push(member);
  }

  return merged;
}

function resolveClubId(id: string | string[] | undefined) {
  if (typeof id === "string") return id;
  if (Array.isArray(id)) return id[0];
  return undefined;
}

export default function ClubMembersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const clubId = resolveClubId(id);
  const club = useClub(clubId ?? "");
  const clubs = useAppStore((state) => state.clubs);
  const hydrated = useAppStore((state) => state.hydrated);
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const cacheKey = clubId ? `club-members:${clubId}` : "";
  const cachedMembers = cacheKey
    ? getRemoteCache<{ members: UserProfile[]; total: number }>(cacheKey)
    : undefined;
  const [members, setMembers] = useState<UserProfile[]>(
    cachedMembers?.members ?? [],
  );
  const [total, setTotal] = useState(cachedMembers?.total ?? 0);
  const [loading, setLoading] = useState(!cachedMembers);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [moderation, setModeration] = useState<{
    userId: string;
    name: string;
    action: "kick" | "ban" | "unban";
  } | null>(null);
  const [moderating, setModerating] = useState(false);
  const [togglingSubCaptainId, setTogglingSubCaptainId] = useState<
    string | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const kickMember = useAppStore((state) => state.kickMember);
  const banMember = useAppStore((state) => state.banMember);
  const unbanMember = useAppStore((state) => state.unbanMember);
  const setClubSubCaptains = useAppStore((state) => state.setClubSubCaptains);
  const clubBans = useClubBans(clubId ?? "");
  const endReachedGuard = useRef(false);
  const initialLoadKeyRef = useRef<string | null>(null);
  const openSwipeRef = useRef<SwipeableMethods | null>(null);
  const bottomPadding = useTabBarPadding(spacing.lg);
  const memberIdsKey = club?.memberIds.join(",") ?? "";

  const adminMember = useMemo(
    () =>
      club ? (users.find((user) => user.id === club.adminId) ?? null) : null,
    [club, users],
  );

  const isCaptain = Boolean(club && isClubCaptain(club, currentUserId));
  const subCaptainIds = club?.subCaptainIds ?? [];
  const subCaptainAtCapacity = subCaptainIds.length >= MAX_SUB_CAPTAINS;

  const applyMemberPage = useCallback(
    (pageMembers: UserProfile[], pageTotal: number, append: boolean) => {
      setTotal(pageTotal);
      setMembers((prev) => {
        const nextMembers = append
          ? mergeMemberPages(prev, pageMembers)
          : pageMembers;
        if (cacheKey) {
          setRemoteCache(cacheKey, {
            members: nextMembers,
            total: pageTotal,
          });
        }
        return nextMembers;
      });
    },
    [cacheKey],
  );

  const loadPage = useCallback(
    async (
      offset: number,
      append: boolean,
      options?: { silent?: boolean; forceSpinner?: boolean },
    ) => {
      const silent = options?.silent ?? false;
      const forceSpinner = options?.forceSpinner ?? false;
      const currentClub = clubId
        ? useAppStore.getState().clubs.find((item) => item.id === clubId)
        : undefined;

      if (!clubId || !currentClub) {
        if (!append) setLoading(false);
        return;
      }

      const currentUsers = useAppStore.getState().users;

      try {
        setError(null);
        if (append) {
          setLoadingMore(true);
        } else if (
          (forceSpinner || !silent) &&
          !getRemoteCache<{ members: UserProfile[]; total: number }>(cacheKey)
        ) {
          setLoading(true);
        }

        if (!isSupabaseEnabled) {
          const storeResult = getClubMembersPageFromStore(
            currentClub,
            currentUsers,
            offset,
            CLUB_MEMBERS_PAGE_SIZE,
          );
          applyMemberPage(storeResult.members, storeResult.total, append);
          return;
        }

        const result = await fetchClubMembersPage(
          clubId,
          offset,
          CLUB_MEMBERS_PAGE_SIZE,
          currentUsers,
        );
        const shouldFallback =
          !append &&
          result.members.length === 0 &&
          currentClub.memberIds.length > 0;

        if (shouldFallback) {
          const storeResult = getClubMembersPageFromStore(
            currentClub,
            currentUsers,
            offset,
            CLUB_MEMBERS_PAGE_SIZE,
          );
          applyMemberPage(storeResult.members, storeResult.total, false);
          return;
        }

        applyMemberPage(result.members, result.total, append);
      } catch {
        if (currentClub.memberIds.length > 0) {
          const storeResult = getClubMembersPageFromStore(
            currentClub,
            currentUsers,
            offset,
            CLUB_MEMBERS_PAGE_SIZE,
          );
          applyMemberPage(storeResult.members, storeResult.total, append);
        } else {
          setError("Could not load members right now.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        endReachedGuard.current = false;
      }
    },
    [applyMemberPage, cacheKey, clubId],
  );

  useEffect(() => {
    initialLoadKeyRef.current = null;
    const cached = cacheKey
      ? getRemoteCache<{ members: UserProfile[]; total: number }>(cacheKey)
      : undefined;
    setMembers(cached?.members ?? []);
    setTotal(cached?.total ?? 0);
    setLoading(!cached);
    setError(null);
  }, [cacheKey, clubId]);

  useEffect(() => {
    if (!clubId) {
      setLoading(false);
      return;
    }

    const currentClub = useAppStore
      .getState()
      .clubs.find((item) => item.id === clubId);
    if (!currentClub) {
      setLoading(false);
      return;
    }

    const currentUsers = useAppStore.getState().users;
    const cached = getRemoteCache<{ members: UserProfile[]; total: number }>(
      cacheKey,
    );
    let primedFromStore = false;

    if (cached) {
      setMembers(cached.members);
      setTotal(cached.total);
      setLoading(false);
    } else {
      const fromStore = getClubMembersPageFromStore(
        currentClub,
        currentUsers,
        0,
        CLUB_MEMBERS_PAGE_SIZE,
      );
      if (fromStore.members.length > 0) {
        setMembers(fromStore.members);
        setTotal(fromStore.total);
        setRemoteCache(cacheKey, {
          members: fromStore.members,
          total: fromStore.total,
        });
        setLoading(false);
        primedFromStore = true;
      } else if (currentClub.memberIds.length === 0) {
        setLoading(false);
      }
    }

    const loadKey = `${clubId}:${memberIdsKey}`;
    if (initialLoadKeyRef.current === loadKey) return;
    initialLoadKeyRef.current = loadKey;

    void loadPage(0, false, {
      silent: Boolean(cached) || primedFromStore,
    });
  }, [cacheKey, clubId, loadPage, memberIdsKey]);

  useEffect(() => {
    if (!clubId || !club || loading) return;
    if (members.length >= club.memberIds.length) return;

    const fromStore = getClubMembersPageFromStore(
      club,
      users,
      0,
      CLUB_MEMBERS_PAGE_SIZE,
    );
    if (fromStore.members.length <= members.length) return;

    setMembers(fromStore.members);
    setTotal(fromStore.total);
    setLoading(false);
    setRemoteCache(cacheKey, {
      members: fromStore.members,
      total: fromStore.total,
    });
  }, [cacheKey, club, clubId, loading, memberIdsKey, members.length, users]);

  const reloadMembers = useCallback(
    () => loadPage(0, false, { silent: true, forceSpinner: true }),
    [loadPage],
  );
  const { refreshControl } = useRefreshControl(reloadMembers);

  const memberTotal = total > 0 ? total : (club?.memberIds.length ?? 0);
  const hasMore = members.length < memberTotal;

  const handleLoadMore = () => {
    if (
      loading ||
      loadingMore ||
      !hasMore ||
      endReachedGuard.current ||
      searchQuery.trim()
    )
      return;
    endReachedGuard.current = true;
    loadPage(members.length, true);
  };

  const filteredMembers = useMemo(() => {
    const roster = members.filter((member) => member.id !== club?.adminId);
    if (!searchQuery.trim()) return roster;
    return roster.filter((member) => matchesSearch(member, searchQuery));
  }, [club?.adminId, members, searchQuery]);

  const showAdmin = adminMember && matchesSearch(adminMember, searchQuery);
  const visibleCount = (showAdmin ? 1 : 0) + filteredMembers.length;
  const isSearching = searchQuery.trim().length > 0;
  const isAdmin = club?.adminId === currentUserId;

  const bannedPlayers = useMemo(
    () =>
      clubBans
        .map((ban) => users.find((user) => user.id === ban.userId))
        .filter((player): player is UserProfile => Boolean(player)),
    [clubBans, users],
  );

  const handleToggleSubCaptain = async (userId: string) => {
    if (!club) return;

    const isSub = subCaptainIds.includes(userId);
    if (!isSub && subCaptainAtCapacity) {
      setActionError(
        `You can only assign ${MAX_SUB_CAPTAINS} sub-captains. Remove one first.`,
      );
      return;
    }

    const next = isSub
      ? subCaptainIds.filter((id) => id !== userId)
      : [...subCaptainIds, userId];

    setTogglingSubCaptainId(userId);
    setActionError(null);

    try {
      await setClubSubCaptains(club.id, next);
    } catch (error) {
      setActionError(
        formatSyncError(error, "Could not update sub-captains. Try again."),
      );
    } finally {
      setTogglingSubCaptainId(null);
    }
  };

  const handleConfirmModeration = async () => {
    if (!moderation || !clubId) return;

    setModerating(true);
    setActionError(null);

    try {
      if (moderation.action === "kick") {
        await kickMember(clubId, moderation.userId);
        setMembers((current) =>
          current.filter((member) => member.id !== moderation.userId),
        );
      } else if (moderation.action === "ban") {
        await banMember(clubId, moderation.userId);
        setMembers((current) =>
          current.filter((member) => member.id !== moderation.userId),
        );
      } else {
        await unbanMember(clubId, moderation.userId);
      }
      setModeration(null);
    } catch (error) {
      setActionError(
        formatSyncError(error, "Could not update this member. Try again."),
      );
    } finally {
      setModerating(false);
    }
  };

  const getMemberBadge = (memberId: string) => {
    if (memberId === club?.adminId) {
      return { label: "Captain", color: colors.warning };
    }
    if ((club?.subCaptainIds ?? []).includes(memberId)) {
      return { label: "Sub-Captain", color: colors.accent };
    }
    if (memberId === currentUserId) {
      return { label: "You", color: colors.accent };
    }
    return undefined;
  };

  if (!club) {
    if (shouldShowEntitySkeleton(club, hydrated, clubs.length === 0)) {
      return <ClubDetailSkeleton />;
    }

    return (
      <LinearGradient
        colors={[colors.background, "#0F1520"]}
        style={styles.centered}
      >
        <EmptyState
          icon={
            <Ionicons
              name="alert-circle-outline"
              size={28}
              color={colors.textDim}
            />
          }
          title="Club not found"
          description="This club may have been removed or the link is invalid."
        />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.background, "#0F1520"]} style={styles.flex}>
      {loading && members.length === 0 ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomPadding },
          ]}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <MembersSummary
            club={club}
            total={club.memberIds.length}
            loaded={0}
          />
          <MemberListSkeleton count={6} />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          renderItem={({ item }) => (
            <MemberRow
              player={item}
              badge={getMemberBadge(item.id)}
              showAdminActions={isAdmin}
              showSubCaptainAction={isCaptain}
              isSubCaptain={subCaptainIds.includes(item.id)}
              subCaptainAtCapacity={subCaptainAtCapacity}
              subCaptainLoading={togglingSubCaptainId === item.id}
              onPress={() => router.push(`/player/${item.id}`)}
              onKick={() =>
                setModeration({
                  userId: item.id,
                  name: item.nickname ?? item.name,
                  action: "kick",
                })
              }
              onBan={() =>
                setModeration({
                  userId: item.id,
                  name: item.nickname ?? item.name,
                  action: "ban",
                })
              }
              onSubCaptain={() => {
                void handleToggleSubCaptain(item.id);
              }}
              onSwipeOpen={(methods) => {
                if (openSwipeRef.current && openSwipeRef.current !== methods) {
                  openSwipeRef.current.close();
                }
                openSwipeRef.current = methods;
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <>
              <MembersSummary
                club={club}
                total={memberTotal}
                loaded={members.length}
                searching={isSearching}
                visibleCount={visibleCount}
              />

              {error ? (
                <Card style={styles.errorCard}>
                  <View style={styles.errorRow}>
                    <Ionicons
                      name="cloud-offline-outline"
                      size={20}
                      color={colors.warning}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                  <Button
                    title="Try again"
                    size="sm"
                    variant="outline"
                    onPress={() => loadPage(0, false, { forceSpinner: true })}
                  />
                </Card>
              ) : null}

              <View style={styles.searchWrap}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.textDim}
                  style={styles.searchIcon}
                />
                <Input
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name or nickname"
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {isAdmin && bannedPlayers.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Banned players</Text>
                  {bannedPlayers.map((player) => (
                    <View key={player.id} style={styles.memberBlock}>
                      <PlayerCard
                        player={player}
                        compact
                        badge={{ label: "Banned", color: colors.error }}
                        onPress={() => router.push(`/player/${player.id}`)}
                      />
                      <View style={styles.adminActions}>
                        <Button
                          title="Unban"
                          size="sm"
                          variant="outline"
                          onPress={() =>
                            setModeration({
                              userId: player.id,
                              name: player.nickname ?? player.name,
                              action: "unban",
                            })
                          }
                        />
                      </View>
                    </View>
                  ))}
                  <View style={styles.sectionDivider} />
                </View>
              ) : null}

              {showAdmin ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Club Captain</Text>
                  <PlayerCard
                    player={adminMember}
                    compact
                    badge={getMemberBadge(adminMember.id)}
                    onPress={() => router.push(`/player/${adminMember.id}`)}
                  />
                  {filteredMembers.length > 0 ? (
                    <View style={styles.sectionDivider} />
                  ) : null}
                </View>
              ) : null}

              {filteredMembers.length > 0 ? (
                <Text style={styles.sectionLabel}>
                  {showAdmin
                    ? "Members"
                    : `${memberTotal} baller${memberTotal !== 1 ? "s" : ""}`}
                </Text>
              ) : null}
            </>
          }
          ListEmptyComponent={
            visibleCount > 0 ? null : isSearching ? (
              <EmptyState
                icon={
                  <Ionicons
                    name="search-outline"
                    size={28}
                    color={colors.textDim}
                  />
                }
                title="No matches"
                description={`No members match "${searchQuery.trim()}".`}
              />
            ) : (
              <EmptyState
                icon={
                  <Ionicons
                    name="people-outline"
                    size={28}
                    color={colors.textDim}
                  />
                }
                title="No members yet"
                description="Invite players to grow this club."
              />
            )
          }
          ListFooterComponent={
            isSearching ? null : (
              <MembersFooter
                loaded={members.length}
                total={memberTotal}
                loadingMore={loadingMore}
                hasMore={hasMore}
              />
            )
          }
        />
      )}

      <ConfirmModal
        visible={moderation != null}
        title={
          moderation?.action === "kick"
            ? "Kick member?"
            : moderation?.action === "ban"
              ? "Ban member?"
              : "Unban player?"
        }
        message={
          moderation?.action === "kick"
            ? `${moderation.name} will be removed from the club but can join again later.`
            : moderation?.action === "ban"
              ? `${moderation?.name} will be removed and cannot rejoin or request access.`
              : `${moderation?.name} can join this club again.`
        }
        confirmLabel={
          moderation?.action === "kick"
            ? "Kick"
            : moderation?.action === "ban"
              ? "Ban"
              : "Unban"
        }
        loading={moderating}
        onConfirm={() => {
          void handleConfirmModeration();
        }}
        onClose={() => {
          if (!moderating) {
            setModeration(null);
            setActionError(null);
          }
        }}
      />
      {actionError ? (
        <View style={styles.actionErrorWrap}>
          <Text style={styles.actionErrorText}>{actionError}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

function MemberRow({
  player,
  badge,
  showAdminActions,
  showSubCaptainAction,
  isSubCaptain,
  subCaptainAtCapacity,
  subCaptainLoading,
  onPress,
  onKick,
  onBan,
  onSubCaptain,
  onSwipeOpen,
}: {
  player: UserProfile;
  badge?: { label: string; color?: string };
  showAdminActions: boolean;
  showSubCaptainAction?: boolean;
  isSubCaptain?: boolean;
  subCaptainAtCapacity?: boolean;
  subCaptainLoading?: boolean;
  onPress?: () => void;
  onKick: () => void;
  onBan: () => void;
  onSubCaptain?: () => void;
  onSwipeOpen?: (methods: SwipeableMethods) => void;
}) {
  return (
    <SwipeableMemberRow
      enabled={showAdminActions}
      onKick={onKick}
      onBan={onBan}
      onSwipeOpen={onSwipeOpen}
      onSubCaptain={
        showSubCaptainAction && !subCaptainLoading ? onSubCaptain : undefined
      }
      isSubCaptain={isSubCaptain}
      subCaptainAtCapacity={subCaptainAtCapacity}
    >
      <PlayerCard player={player} compact badge={badge} onPress={onPress} />
    </SwipeableMemberRow>
  );
}

function MembersSummary({
  club,
  total,
  loaded,
  searching,
  visibleCount,
}: {
  club: Club;
  total: number;
  loaded: number;
  searching?: boolean;
  visibleCount?: number;
}) {
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <ClubIcon
          name={club.name}
          iconColor={club.iconColor}
          iconUrl={club.iconUrl}
          size={52}
        />
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryTitle} numberOfLines={1}>
            {club.name}
          </Text>
          <Text style={styles.summarySubtitle}>
            {searching
              ? `${visibleCount ?? 0} match${(visibleCount ?? 0) !== 1 ? "es" : ""}`
              : `${total} baller${total !== 1 ? "s" : ""} total`}
          </Text>
        </View>
        <Badge
          label={searching ? "Filtered" : `${loaded}/${total || "—"}`}
          color={colors.primary}
        />
      </View>
    </Card>
  );
}

function MembersFooter({
  loaded,
  total,
  loadingMore,
  hasMore,
}: {
  loaded: number;
  total: number;
  loadingMore: boolean;
  hasMore: boolean;
}) {
  if (loadingMore) {
    return <LoadMoreSkeleton rows={2} />;
  }

  if (total === 0) return null;

  if (!hasMore) {
    return (
      <View style={styles.footer}>
        <Ionicons
          name="checkmark-circle-outline"
          size={18}
          color={colors.success}
        />
        <Text style={styles.footerText}>All {total} members loaded</Text>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Showing {loaded} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  summaryInfo: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    ...typography.heading,
    color: colors.text,
  },
  summarySubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  searchWrap: {
    position: "relative",
    marginBottom: spacing.lg,
  },
  searchIcon: {
    position: "absolute",
    left: spacing.md,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    paddingLeft: spacing.xl + spacing.sm,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  memberBlock: {
    marginBottom: spacing.sm,
  },
  adminActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionErrorWrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: `${colors.error}22`,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.error}55`,
    padding: spacing.md,
  },
  actionErrorText: {
    ...typography.caption,
    color: colors.error,
    textAlign: "center",
  },
  errorCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.warning,
    flex: 1,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  footerText: {
    ...typography.caption,
    color: colors.textDim,
  },
});
