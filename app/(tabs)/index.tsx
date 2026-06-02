import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "@/lib/expoRouter";
import { Fragment, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ClubCard } from "../../components/ClubCard";
import { EventCard } from "../../components/EventCard";
import { AllStarPromoCard } from "../../components/AllStarPromoCard";
import { UpgradeModal } from "../../components/UpgradeModal";
import { Screen } from "../../components/Screen";
import { Button, SectionHeader } from "../../components/ui";
import { useUpgradePrompt } from "../../lib/useUpgradePrompt";
import { calculatePlayerRating } from "../../lib/teamBalancer";
import { colors, radius, spacing, typography } from "../../lib/theme";
import {
  useCurrentUser,
  useIsAllStar,
  useMyClubs,
  useUpcomingEvents,
} from "../../store/hooks";
import { useAppStore } from "../../store/useAppStore";

export default function HomeScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const myClubs = useMyClubs();
  const upcomingEvents = useUpcomingEvents();
  const clubs = useAppStore((state) => state.clubs);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const isPro = useIsAllStar();
  const { upgradeVisible, upgradeReason, promptUpgrade, closeUpgrade } =
    useUpgradePrompt();
  const myEvents = upcomingEvents.filter((event) =>
    event.participantIds.includes(currentUserId ?? ""),
  );
  const rating = user ? calculatePlayerRating(user.stats) : 0;

  if (!user) {
    return null;
  }

  return (
    <Fragment>
      <Screen>
        <LinearGradient
          colors={[`${colors.primary}25`, "transparent"]}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <View>
              <Text style={styles.greeting}>What&apos;s good,</Text>
              <Text style={styles.userName}>
                {user?.nickname ?? user?.name ?? "Baller"}
              </Text>
            </View>
            <Pressable
              style={styles.ratingBadge}
              onPress={() => router.push(`/player/${user.id}`)}
              accessibilityRole="button"
              accessibilityLabel="View your stats profile"
            >
              <Text style={styles.ratingLabel}>OVR</Text>
              <Text style={styles.ratingValue}>{rating}</Text>
            </Pressable>
          </View>
          <Text style={styles.heroSub}>
            {myEvents.length > 0
              ? `${myEvents.length} upcoming game${myEvents.length > 1 ? "s" : ""} on your schedule`
              : "Join a club and hop into your next run"}
          </Text>
          <Button
            title="Leaderboards"
            variant="outline"
            size="sm"
            onPress={() => router.push("/leaderboards")}
            icon={
              <Ionicons
                name="podium-outline"
                size={16}
                color={colors.primary}
              />
            }
            style={styles.leaderboardsBtn}
          />
        </LinearGradient>

        {!isPro ? (
          <AllStarPromoCard variant="banner" onPress={() => promptUpgrade()} />
        ) : null}

        <SectionHeader
          title="Upcoming Games"
          subtitle="Games you've joined or can join"
          action={
            <Button
              title="Browse"
              variant="ghost"
              size="sm"
              onPress={() => router.navigate("/clubs")}
            />
          }
        />

        {upcomingEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-outline"
              size={32}
              color={colors.textDim}
            />
            <Text style={styles.emptyText}>No upcoming games yet</Text>
          </View>
        ) : (
          upcomingEvents
            .slice(0, 3)
            .map((event) => (
              <EventCard
                key={event.id}
                event={event}
                clubName={clubs.find((club) => club.id === event.clubId)?.name}
                isJoined={event.participantIds.includes(currentUserId ?? "")}
                onPress={() => router.push(`/event/${event.id}`)}
              />
            ))
        )}

        <SectionHeader
          title="Your Clubs"
          subtitle={`${myClubs.length} club${myClubs.length !== 1 ? "s" : ""}`}
          action={
            <Button
              title="See all"
              variant="ghost"
              size="sm"
              onPress={() => router.navigate("/clubs")}
            />
          }
        />

        {myClubs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={32} color={colors.textDim} />
            <Text style={styles.emptyText}>Join a club to get started</Text>
            <Button
              title="Explore Clubs"
              onPress={() => router.navigate("/clubs")}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          myClubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              isMember
              onPress={() => router.push(`/clubs/${club.id}`)}
            />
          ))
        )}

        <View style={styles.quickActions}>
          <QuickAction
            icon="add-circle"
            label="Create Club"
            onPress={() => router.push("/(tabs)/clubs/create")}
          />
          <QuickAction
            icon="basketball"
            label="New Game"
            onPress={() => router.push("/event/create")}
          />
        </View>
      </Screen>

      <UpgradeModal
        visible={upgradeVisible}
        reason={upgradeReason}
        onClose={closeUpgrade}
        onPurchased={() => {
          void upgradeToAllStar();
        }}
      />
    </Fragment>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Button
      title={label}
      variant="outline"
      onPress={onPress}
      icon={<Ionicons name={icon} size={18} color={colors.primary} />}
      style={styles.quickAction}
    />
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  greeting: {
    ...typography.body,
    color: colors.textMuted,
  },
  userName: {
    ...typography.title,
    color: colors.text,
    fontSize: 28,
  },
  ratingBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  ratingLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 10,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.secondary,
  },
  heroSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  leaderboardsBtn: {
    alignSelf: "flex-start",
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyBtn: {
    marginTop: spacing.sm,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickAction: {
    flex: 1,
  },
});
