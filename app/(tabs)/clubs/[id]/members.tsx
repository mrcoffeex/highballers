import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";

import { ClubIcon } from "../../../../components/ClubIcon";
import { PlayerCard } from "../../../../components/PlayerCard";
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
import { colors, radius, spacing, typography } from "../../../../lib/theme";
import { useTabBarPadding } from "../../../../lib/tabBar";
import { useRefreshControl } from "../../../../lib/useRefreshControl";
import { Club, UserProfile } from "../../../../lib/types";
import { useClub } from "../../../../store/hooks";
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
  const endReachedGuard = useRef(false);
  const bottomPadding = useTabBarPadding(spacing.lg);

  const adminMember = useMemo(
    () =>
      club ? (users.find((user) => user.id === club.adminId) ?? null) : null,
    [club, users],
  );

  const loadFromStore = useCallback(
    (offset: number, append: boolean) => {
      if (!club) return null;

      const result = getClubMembersPageFromStore(
        club,
        users,
        offset,
        CLUB_MEMBERS_PAGE_SIZE,
      );
      setTotal(result.total);
      setMembers((prev) => {
        const nextMembers = append
          ? mergeMemberPages(prev, result.members)
          : result.members;
        if (cacheKey) {
          setRemoteCache(cacheKey, {
            members: nextMembers,
            total: result.total,
          });
        }
        return nextMembers;
      });
      return result;
    },
    [cacheKey, club, users],
  );

  const loadPage = useCallback(
    async (offset: number, append: boolean, silent = false) => {
      if (!clubId || !club) return;

      try {
        setError(null);
        if (append) {
          setLoadingMore(true);
        } else if (
          !silent &&
          !getRemoteCache<{ members: UserProfile[]; total: number }>(cacheKey)
        ) {
          setLoading(true);
        }

        if (!isSupabaseEnabled) {
          loadFromStore(offset, append);
          return;
        }

        const result = await fetchClubMembersPage(
          clubId,
          offset,
          CLUB_MEMBERS_PAGE_SIZE,
          users,
        );
        const shouldFallback =
          !append && result.members.length === 0 && club.memberIds.length > 0;

        if (shouldFallback) {
          loadFromStore(offset, false);
          return;
        }

        setTotal(result.total);
        setMembers((prev) => {
          const nextMembers = append
            ? mergeMemberPages(prev, result.members)
            : result.members;
          if (cacheKey) {
            setRemoteCache(cacheKey, {
              members: nextMembers,
              total: result.total,
            });
          }
          return nextMembers;
        });
      } catch {
        if (club.memberIds.length > 0) {
          loadFromStore(offset, append);
        } else {
          setError("Could not load members right now.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        endReachedGuard.current = false;
      }
    },
    [cacheKey, club, clubId, loadFromStore, users],
  );

  useEffect(() => {
    if (!clubId || !club) return;
    const hasCache = Boolean(
      getRemoteCache<{ members: UserProfile[]; total: number }>(cacheKey),
    );
    loadPage(0, false, hasCache);
  }, [cacheKey, club, clubId, loadPage]);

  const reloadMembers = useCallback(() => loadPage(0, false, true), [loadPage]);
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

  const getMemberBadge = (memberId: string) => {
    if (memberId === club?.adminId) {
      return { label: "Admin", color: colors.warning };
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
            <PlayerCard
              player={item}
              compact
              badge={getMemberBadge(item.id)}
              onPress={() => router.push(`/player/${item.id}`)}
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
                    onPress={() => loadPage(0, false)}
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

              {showAdmin ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Club Admin</Text>
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
    </LinearGradient>
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
