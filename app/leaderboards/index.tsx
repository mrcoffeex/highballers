import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "@/lib/expoRouter";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { LeaderboardRow } from "../../components/LeaderboardRow";
import { Screen } from "../../components/Screen";
import { EmptyState } from "../../components/ui";
import {
  buildClubLeaderboard,
  buildOvrLeaderboard,
  buildPlayerStatLeaderboard,
  LEADERBOARD_TABS,
  LeaderboardCategory,
} from "../../lib/leaderboards";
import { colors, radius, spacing, typography } from "../../lib/theme";
import { useCurrentUser } from "../../store/hooks";
import { useAppStore } from "../../store/useAppStore";

export default function LeaderboardsScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const users = useAppStore((state) => state.users);
  const clubs = useAppStore((state) => state.clubs);
  const events = useAppStore((state) => state.events);
  const gameStatRecords = useAppStore((state) => state.gameStatRecords);
  const [category, setCategory] = useState<LeaderboardCategory>("clubs");

  const clubEntries = useMemo(
    () => buildClubLeaderboard(clubs, events, gameStatRecords),
    [clubs, events, gameStatRecords],
  );

  const ovrEntries = useMemo(() => buildOvrLeaderboard(users), [users]);

  const statEntries = useMemo(() => {
    if (category === "clubs" || category === "ovr") return [];
    return buildPlayerStatLeaderboard(users, gameStatRecords, category);
  }, [category, users, gameStatRecords]);

  const activeTab =
    LEADERBOARD_TABS.find((tab) => tab.id === category) ?? LEADERBOARD_TABS[0];

  const myRank = useMemo(() => {
    if (!user) return null;
    if (category === "clubs") {
      const club = clubs.find((item) => item.memberIds.includes(user.id));
      if (!club) return null;
      const entry = clubEntries.find((item) => item.club.id === club.id);
      return entry?.rank ?? null;
    }
    if (category === "ovr") {
      return ovrEntries.find((item) => item.user.id === user.id)?.rank ?? null;
    }
    return statEntries.find((item) => item.user.id === user.id)?.rank ?? null;
  }, [category, user, clubs, clubEntries, ovrEntries, statEntries]);

  const listContent = useMemo(() => {
    if (category === "clubs") {
      return clubEntries.map((entry) => (
        <LeaderboardRow
          key={entry.club.id}
          rank={entry.rank}
          category="clubs"
          value={entry.totalPoints}
          club={entry.club}
          highlighted={user ? entry.club.memberIds.includes(user.id) : false}
          subtitle={`${entry.memberCount} members · ${entry.gamesPlayed} recorded game${entry.gamesPlayed !== 1 ? "s" : ""}`}
          onPress={() => router.push(`/clubs/${entry.club.id}`)}
        />
      ));
    }

    if (category === "ovr") {
      return ovrEntries.map((entry) => (
        <LeaderboardRow
          key={entry.user.id}
          rank={entry.rank}
          category="ovr"
          value={entry.value}
          user={entry.user}
          highlighted={entry.user.id === user?.id}
          onPress={() => router.push(`/player/${entry.user.id}`)}
        />
      ));
    }

    return statEntries.map((entry) => (
      <LeaderboardRow
        key={entry.user.id}
        rank={entry.rank}
        category={category}
        value={entry.value}
        user={entry.user}
        highlighted={entry.user.id === user?.id}
        onPress={() => router.push(`/player/${entry.user.id}`)}
      />
    ));
  }, [category, clubEntries, ovrEntries, statEntries, router, user]);

  const isEmpty = listContent.length === 0;

  return (
    <Screen>
      <LinearGradient
        colors={[colors.background, "#0F1520"]}
        style={styles.background}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="podium-outline"
              size={24}
              color={colors.secondary}
            />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Rankings</Text>
            <Text style={styles.heroSub}>
              Top clubs and ballers across the app
            </Text>
          </View>
          {myRank ? (
            <View style={styles.myRankPill}>
              <Text style={styles.myRankLabel}>You</Text>
              <Text style={styles.myRankValue}>#{myRank}</Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {LEADERBOARD_TABS.map((tab) => {
            const selected = tab.id === category;
            return (
              <Pressable
                key={tab.id}
                style={[styles.tab, selected && styles.tabActive]}
                onPress={() => setCategory(tab.id)}
              >
                <Ionicons
                  name={tab.icon as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={selected ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[styles.tabText, selected && styles.tabTextActive]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.listHeading}>
          {category === "clubs"
            ? "Top clubs by activity & scoring"
            : category === "ovr"
              ? "Highest overall ratings"
              : `Career ${activeTab.label} leaders`}
        </Text>

        {isEmpty ? (
          <EmptyState
            icon={
              <Ionicons
                name="stats-chart-outline"
                size={28}
                color={colors.textDim}
              />
            }
            title="No rankings yet"
            description={
              category === "clubs"
                ? "Clubs appear here once games are played and stats are recorded."
                : category === "ovr"
                  ? "Player ratings come from profile skill stats."
                  : "Record box scores in the scorekeeper to populate stat leaders."
            }
          />
        ) : (
          listContent
        )}
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  background: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: `${colors.secondary}20`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${colors.secondary}44`,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    ...typography.heading,
    color: colors.text,
    fontSize: 20,
  },
  heroSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  myRankPill: {
    alignItems: "center",
    backgroundColor: `${colors.primary}18`,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  myRankLabel: {
    ...typography.label,
    color: colors.primary,
    fontSize: 9,
  },
  myRankValue: {
    ...typography.heading,
    color: colors.text,
    fontSize: 16,
  },
  tabs: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}18`,
  },
  tabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.primary,
  },
  listHeading: {
    ...typography.label,
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
});
