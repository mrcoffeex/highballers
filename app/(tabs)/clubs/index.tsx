import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ClubCard } from "../../../components/ClubCard";
import { Screen } from "../../../components/Screen";
import { Button, EmptyState } from "../../../components/ui";
import { colors, radius, spacing, typography } from "../../../lib/theme";
import { useUpgradePrompt } from "../../../lib/useUpgradePrompt";
import { useClubMembershipLimits, useIsAllStar } from "../../../store/hooks";
import { useAppStore } from "../../../store/useAppStore";

type Filter = "all" | "joined" | "discover";

export default function ClubsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const isPro = useIsAllStar();
  const limits = useClubMembershipLimits();
  const { promptUpgrade } = useUpgradePrompt();
  const clubs = useAppStore((state) => state.clubs);
  const joinRequests = useAppStore((state) => state.joinRequests);
  const currentUserId = useAppStore((state) => state.currentUserId);

  const myPendingClubIds = useMemo(() => {
    const ids = new Set<string>();
    for (const request of joinRequests) {
      if (request.userId === currentUserId) {
        ids.add(request.clubId);
      }
    }
    return ids;
  }, [currentUserId, joinRequests]);

  const filteredClubs = useMemo(() => {
    if (filter === "joined") {
      return clubs.filter((club) =>
        club.memberIds.includes(currentUserId ?? ""),
      );
    }
    if (filter === "discover") {
      return clubs.filter(
        (club) => !club.memberIds.includes(currentUserId ?? ""),
      );
    }
    return clubs;
  }, [clubs, currentUserId, filter]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Clubs</Text>
          <Text style={styles.subtitle}>Find your crew or create one</Text>
        </View>
        <Button
          title="Create"
          size="sm"
          variant={limits.canCreateClub || isPro ? "primary" : "outline"}
          onPress={() => {
            if (!limits.canCreateClub && !isPro) {
              promptUpgrade(
                limits.createBlockedReason ??
                  "Basic Ballers can create only one club.",
              );
              return;
            }
            router.push("/clubs/create");
          }}
          icon={<Ionicons name="add" size={18} color={colors.text} />}
        />
      </View>

      <View style={styles.filters}>
        {(["all", "joined", "discover"] as Filter[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[
              styles.filterChip,
              filter === item && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.filterTextActive,
              ]}
            >
              {item === "all"
                ? "All"
                : item === "joined"
                  ? "My Clubs"
                  : "Discover"}
            </Text>
          </Pressable>
        ))}
      </View>

      {filteredClubs.length === 0 ? (
        <EmptyState
          icon={
            <Ionicons name="people-outline" size={28} color={colors.textDim} />
          }
          title="No clubs here yet"
          description={
            filter === "joined"
              ? "Join a club from Discover or create your own."
              : "Be the first to start a basketball club!"
          }
        />
      ) : (
        filteredClubs.map((club) => (
          <ClubCard
            key={club.id}
            club={club}
            isMember={club.memberIds.includes(currentUserId ?? "")}
            hasPendingRequest={myPendingClubIds.has(club.id)}
            onPress={() => router.push(`/clubs/${club.id}`)}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.primary,
  },
});
