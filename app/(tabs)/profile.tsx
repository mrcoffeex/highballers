import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "@/lib/expoRouter";
import { Fragment, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AllStarMemberCard } from "../../components/AllStarMemberCard";
import { LegalSettingsCard } from "../../components/LegalSettingsCard";
import { SignOutButton } from "../../components/SignOutButton";
import { AllStarPromoCard } from "../../components/AllStarPromoCard";
import { SubscriptionBadge } from "../../components/SubscriptionBadge";
import { UpgradeModal } from "../../components/UpgradeModal";
import { Screen } from "../../components/Screen";
import { TabSkeletonOverlay } from "../../components/TabSkeletonOverlay";
import { ActivityStoriesViewer } from "../../components/ActivityStoriesViewer";
import { PlayerStatsDashboard } from "../../components/PlayerStatsDashboard";
import { findStoryIndices } from "../../lib/activityStories";
import { useActivityStories } from "../../lib/useActivityStories";
import { StatSlider } from "../../components/StatSlider";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ProfileScreenSkeleton,
} from "../../components/ui";
import { shouldShowEntitySkeleton } from "../../lib/entityLoading";
import { isSupabaseEnabled } from "../../lib/config";
import { calculatePlayerRating } from "../../lib/teamBalancer";
import { colors, radius, spacing, typography } from "../../lib/theme";
import { useUpgradePrompt } from "../../lib/useUpgradePrompt";
import { POSITION_LABELS } from "../../lib/types";
import {
  useCurrentUser,
  useIsAllStar,
  useMyClubs,
  usePlayerGameHistory,
  useSubscriptionTier,
} from "../../store/hooks";
import { useAppStore } from "../../store/useAppStore";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const tier = useSubscriptionTier();
  const isPro = useIsAllStar();
  const myClubs = useMyClubs();
  const gameHistory = usePlayerGameHistory(user?.id ?? "");
  const updateStats = useAppStore((state) => state.updateStats);
  const upgradeToAllStar = useAppStore((state) => state.upgradeToAllStar);
  const signOut = useAppStore((state) => state.signOut);
  const session = useAppStore((state) => state.session);
  const users = useAppStore((state) => state.users);
  const hydrated = useAppStore((state) => state.hydrated);
  const { upgradeVisible, upgradeReason, promptUpgrade, closeUpgrade } =
    useUpgradePrompt();
  const [storiesOpen, setStoriesOpen] = useState(false);
  const [storiesGroupIndex, setStoriesGroupIndex] = useState(0);
  const [storiesSlideIndex, setStoriesSlideIndex] = useState(0);
  const {
    groups: storyGroups,
    viewedSlideIds,
    onViewedChange,
  } = useActivityStories();
  const showDataLoading =
    !user && shouldShowEntitySkeleton(user, hydrated, users.length === 0);

  const goToAuth = async () => {
    if (session) {
      await signOut();
    }
    router.replace("/auth");
  };

  if (!user) {
    if (showDataLoading) {
      return (
        <TabSkeletonOverlay showDataLoading skeleton={<ProfileScreenSkeleton />}>
          <View style={styles.placeholder} />
        </TabSkeletonOverlay>
      );
    }

    if (isSupabaseEnabled) {
      return (
        <Screen
          title="Profile"
          subtitle={session ? "Account" : "Sign in"}
          scroll={false}
        >
          <View style={styles.accountFallback}>
            <Ionicons
              name={session ? "person-circle-outline" : "log-in-outline"}
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.accountFallbackTitle}>
              {session ? "Profile not loaded" : "Not signed in"}
            </Text>
            <Text style={styles.accountFallbackBody}>
              {session
                ? "Sign out and sign in again to restore your profile."
                : "Sign in to sync clubs, games, and stats across devices."}
            </Text>
            {session ? (
              <SignOutButton onSignOut={goToAuth} />
            ) : (
              <Button title="Sign in" size="lg" onPress={() => void goToAuth()} />
            )}
          </View>
        </Screen>
      );
    }

    return null;
  }

  const rating = calculatePlayerRating(user.stats);
  const statItems = [
    { label: "Speed", value: user.stats.speed },
    { label: "Strength", value: user.stats.strength },
    { label: "Shooting", value: user.stats.shooting },
    { label: "Defense", value: user.stats.defense },
    { label: "Stamina", value: user.stats.stamina },
  ];

  return (
    <Fragment>
      <Screen>
        <LinearGradient
          colors={[colors.background, "#0F1520"]}
          style={styles.background}
        >
          <Card
            style={StyleSheet.flatten([
              styles.heroCard,
              isPro && styles.heroCardPro,
            ])}
          >
            <View style={styles.heroGlowPrimary} />
            <View style={styles.heroGlowSecondary} />

            <View style={styles.heroContent}>
              <View style={styles.heroTop}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarHalo}>
                    <Avatar
                      name={user.name}
                      color={user.avatarColor}
                      size={88}
                      imageUrl={user.avatarUrl}
                    />
                  </View>
                  <View style={styles.ovrRing}>
                    <Text style={styles.ovrLabel}>OVR</Text>
                    <Text style={styles.ovrValue}>{rating}</Text>
                  </View>
                </View>

                <View style={styles.heroInfo}>
                  <View style={styles.profileEyebrow}>
                    <Ionicons
                      name="trophy-outline"
                      size={13}
                      color={colors.secondary}
                    />
                    <Text style={styles.profileEyebrowText}>Baller profile</Text>
                  </View>
                  <Text style={styles.name}>{user.name}</Text>
                  {user.nickname ? (
                    <Text style={styles.nickname}>
                      &quot;{user.nickname}&quot;
                    </Text>
                  ) : null}
                  <View style={styles.positionPill}>
                    <Ionicons
                      name="basketball-outline"
                      size={13}
                      color={colors.primary}
                    />
                    <Text style={styles.position}>
                      {POSITION_LABELS[user.position]}
                    </Text>
                  </View>
                  <SubscriptionBadge
                    tier={tier}
                    prominent
                    onPress={!isPro ? () => promptUpgrade() : undefined}
                  />
                </View>
              </View>

              <View style={styles.heroMeta}>
                <MetaChip
                  icon="resize-outline"
                  label={`${user.stats.height} cm`}
                />
                <MetaChip
                  icon="barbell-outline"
                  label={`${user.stats.weight} kg`}
                />
                <MetaChip
                  icon="people-outline"
                  label={`${myClubs.length} club${myClubs.length !== 1 ? "s" : ""}`}
                />
                <MetaChip
                  icon="stats-chart-outline"
                  label={`${gameHistory.length} games`}
                />
              </View>

              <View style={styles.heroActions}>
                <Badge label={user.position} color={colors.secondary} />
                <View style={styles.heroBtnRow}>
                  <Button
                    title="Edit Profile"
                    size="sm"
                    style={styles.heroPrimaryAction}
                    onPress={() => router.push("/profile/edit")}
                  />
                  <Button
                    title="Public"
                    variant="outline"
                    size="sm"
                    onPress={() => router.push(`/player/${user.id}`)}
                  />
                </View>
              </View>
            </View>
          </Card>

          {isPro ? (
            <AllStarMemberCard />
          ) : (
            <AllStarPromoCard
              variant="hero"
              onPress={() => promptUpgrade()}
              onCompare={() => promptUpgrade()}
            />
          )}

          <SectionLabel title="Skill Radar" />
          <Card style={styles.statsCard}>
            {statItems.map((stat) => (
              <View key={stat.label} style={styles.statRow}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <View style={styles.statBarTrack}>
                  <View
                    style={[
                      styles.statBarFill,
                      { width: `${stat.value * 10}%` },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </Card>

          <SectionLabel title="Quick Adjust" />
          <Card style={styles.sectionCard}>
            <StatSlider
              label="Shooting"
              value={user.stats.shooting}
              onChange={(shooting) => updateStats({ ...user.stats, shooting })}
            />
            <StatSlider
              label="Defense"
              value={user.stats.defense}
              onChange={(defense) => updateStats({ ...user.stats, defense })}
            />
          </Card>

          <SectionLabel
            title="Performance"
            subtitle="Stats, trends & story shares"
          />
          <PlayerStatsDashboard
            userId={user.id}
            isOwnProfile
            isPro={isPro}
            onUpgrade={() =>
              promptUpgrade("Full game history is All-Star only.")
            }
            onActivityPress={(eventId) => router.push(`/event/${eventId}`)}
            onShareStory={(recordId) => {
              const { groupIndex, slideIndex } = findStoryIndices(
                storyGroups,
                user.id,
                recordId,
              );
              setStoriesGroupIndex(groupIndex);
              setStoriesSlideIndex(slideIndex);
              setStoriesOpen(true);
            }}
          />

          <View style={styles.accountActions}>
            <SectionLabel title="Account" subtitle="Legal, support & session" />
            <LegalSettingsCard />

            {isSupabaseEnabled ? (
              <SignOutButton onSignOut={goToAuth} />
            ) : null}
          </View>

        </LinearGradient>
      </Screen>

      <ActivityStoriesViewer
        visible={storiesOpen}
        groups={storyGroups}
        initialGroupIndex={storiesGroupIndex}
        initialSlideIndex={storiesSlideIndex}
        viewedSlideIds={viewedSlideIds}
        onViewedChange={onViewedChange}
        onClose={() => setStoriesOpen(false)}
      />

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

function SectionLabel({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function MetaChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={colors.textDim} />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
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
  heroCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#111827",
    borderColor: `${colors.primary}33`,
  },
  heroCardPro: {
    borderColor: `${colors.secondary}44`,
  },
  heroGlowPrimary: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: `${colors.primary}24`,
    right: -70,
    top: -80,
  },
  heroGlowSecondary: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${colors.secondary}18`,
    left: -52,
    bottom: -72,
  },
  heroContent: {
    position: "relative",
    zIndex: 1,
  },
  heroTop: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingRight: spacing.xs,
  },
  avatarHalo: {
    padding: 4,
    borderRadius: radius.full,
    backgroundColor: `${colors.text}0A`,
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  ovrRing: {
    position: "absolute",
    bottom: -6,
    right: -2,
    alignItems: "center",
    backgroundColor: "#0C111B",
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.secondary,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    minWidth: 58,
  },
  ovrLabel: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 8,
  },
  ovrValue: {
    ...typography.heading,
    color: colors.secondary,
    fontSize: 18,
    lineHeight: 20,
  },
  heroInfo: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },
  profileEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: `${colors.secondary}14`,
    borderWidth: 1,
    borderColor: `${colors.secondary}33`,
    marginBottom: spacing.sm,
  },
  profileEyebrowText: {
    ...typography.label,
    color: colors.secondary,
    fontSize: 10,
  },
  name: {
    ...typography.title,
    color: colors.text,
    fontSize: 28,
    lineHeight: 32,
  },
  nickname: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: 2,
  },
  positionPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: `${colors.primary}14`,
    borderWidth: 1,
    borderColor: `${colors.primary}2E`,
  },
  position: {
    ...typography.label,
    color: colors.text,
    fontSize: 10,
  },
  heroMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${colors.surface}CC`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  metaChipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  heroBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
  },
  heroPrimaryAction: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: 2,
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  sectionCard: {
    marginBottom: spacing.lg,
  },
  accountActions: {
    marginTop: spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statLabel: {
    width: 72,
    ...typography.caption,
    color: colors.textMuted,
  },
  statBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  statValue: {
    width: 24,
    ...typography.caption,
    color: colors.secondary,
    fontWeight: "700",
    textAlign: "right",
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.background,
  },
  accountFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  accountFallbackTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: "center",
  },
  accountFallbackBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
