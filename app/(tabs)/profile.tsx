import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
  const users = useAppStore((state) => state.users);
  const hydrated = useAppStore((state) => state.hydrated);
  const {
    upgradeVisible,
    upgradeReason,
    promptUpgrade,
    closeUpgrade,
  } = useUpgradePrompt();
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

  if (!user) {
    if (!showDataLoading) {
      return null;
    }

    return (
      <TabSkeletonOverlay showDataLoading skeleton={<ProfileScreenSkeleton />}>
        <View style={styles.placeholder} />
      </TabSkeletonOverlay>
    );
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
            <View style={styles.heroTop}>
              <View style={styles.avatarWrap}>
                <Avatar
                  name={user.name}
                  color={user.avatarColor}
                  size={80}
                  imageUrl={user.avatarUrl}
                />
                <View style={styles.ovrRing}>
                  <Text style={styles.ovrLabel}>OVR</Text>
                  <Text style={styles.ovrValue}>{rating}</Text>
                </View>
              </View>

              <View style={styles.heroInfo}>
                <Text style={styles.name}>{user.name}</Text>
                {user.nickname ? (
                  <Text style={styles.nickname}>
                    &quot;{user.nickname}&quot;
                  </Text>
                ) : null}
                <Text style={styles.position}>
                  {POSITION_LABELS[user.position]}
                </Text>
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
              <Badge label={user.position} color={colors.primary} />
              <View style={styles.heroBtnRow}>
                <Button
                  title="Edit Profile"
                  variant="outline"
                  size="sm"
                  onPress={() => router.push("/profile/edit")}
                />
                <Button
                  title="Public"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push(`/player/${user.id}`)}
                />
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

          <LegalSettingsCard />

          {isSupabaseEnabled ? (
            <SignOutButton
              onSignOut={async () => {
                await signOut();
                router.replace("/auth");
              }}
            />
          ) : null}
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
  },
  heroCardPro: {
    borderColor: `${colors.secondary}44`,
  },
  heroTop: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarWrap: {
    alignItems: "center",
    gap: spacing.sm,
  },
  ovrRing: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 52,
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
  name: {
    ...typography.title,
    color: colors.text,
    fontSize: 24,
  },
  nickname: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: 2,
  },
  position: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
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
    backgroundColor: colors.surface,
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
  },
  heroBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
});
