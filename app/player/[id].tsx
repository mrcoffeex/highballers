import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "@/lib/expoRouter";
import { StyleSheet, Text, View } from "react-native";

import { PlayerStatsDashboard } from "../../components/PlayerStatsDashboard";
import { Screen } from "../../components/Screen";
import { SubscriptionBadge } from "../../components/SubscriptionBadge";
import { Avatar, Badge, Button, Card } from "../../components/ui";
import { shouldShowEntitySkeleton } from "../../lib/entityLoading";
import { calculatePlayerRating } from "../../lib/teamBalancer";
import { buildPeriodSummary, filterGamesByPeriod } from "../../lib/playerStats";
import { useTheme, useThemedStyles } from "../../lib/ThemeProvider";
import {
  getScreenGradient,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../lib/theme";
import { POSITION_LABELS } from "../../lib/types";
import {
  useCurrentUser,
  useIsAllStar,
  usePlayerGameHistory,
  useUser,
} from "../../store/hooks";
import { useAppStore } from "../../store/useAppStore";

function resolvePlayerId(id: string | string[] | undefined) {
  if (typeof id === "string") return id;
  if (Array.isArray(id)) return id[0];
  return undefined;
}

export default function PlayerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const playerId = resolvePlayerId(id);
  const router = useRouter();
  const currentUser = useCurrentUser();
  const player = useUser(playerId ?? "");
  const users = useAppStore((state) => state.users);
  const clubs = useAppStore((state) => state.clubs);
  const hydrated = useAppStore((state) => state.hydrated);
  const isOwnProfile = Boolean(playerId && currentUser?.id === playerId);
  const isPro = useIsAllStar();
  const gameHistory = usePlayerGameHistory(playerId ?? "");
  const allTimeSummary = buildPeriodSummary(
    filterGamesByPeriod(gameHistory, "all"),
  );

  const playerClubs = clubs.filter(
    (club) => player && club.memberIds.includes(player.id),
  );

  if (!player) {
    if (shouldShowEntitySkeleton(player, hydrated, users.length === 0)) {
      return (
        <>
          <Stack.Screen options={{ headerTitle: "Player" }} />
          <Screen>
            <View style={styles.loading} />
          </Screen>
        </>
      );
    }

    return (
      <>
        <Stack.Screen options={{ headerTitle: "Player" }} />
        <Screen>
          <View style={styles.notFound}>
            <Text style={styles.notFoundText}>Player not found</Text>
          </View>
        </Screen>
      </>
    );
  }

  const rating = calculatePlayerRating(player.stats);
  const displayName = player.nickname ?? player.name;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: displayName,
          headerTitleStyle: { color: colors.text },
        }}
      />
      <Screen contentContainerStyle={styles.content} refreshable={false}>
        <LinearGradient
          colors={getScreenGradient(colors)}
          style={styles.background}
        >
          <Card style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.avatarCol}>
                <Avatar
                  name={player.name}
                  color={player.avatarColor}
                  size={72}
                  imageUrl={player.avatarUrl}
                />
                <View style={styles.ovrPill}>
                  <Text style={styles.ovrLabel}>OVR</Text>
                  <Text style={styles.ovrValue}>{rating}</Text>
                </View>
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.name}>{player.name}</Text>
                {player.nickname ? (
                  <Text style={styles.nickname}>
                    &quot;{player.nickname}&quot;
                  </Text>
                ) : null}
                <Text style={styles.position}>
                  {POSITION_LABELS[player.position]}
                </Text>
                {isOwnProfile ? (
                  <SubscriptionBadge
                    tier={player.subscriptionTier ?? "basic"}
                  />
                ) : (
                  <Badge label={player.position} color={colors.primary} />
                )}
              </View>
            </View>

            {player.bio ? <Text style={styles.bio}>{player.bio}</Text> : null}

            <View style={styles.metaRow}>
              <MetaStat
                icon="basketball-outline"
                label={`${allTimeSummary.games} games`}
              />
              <MetaStat
                icon="flame-outline"
                label={`${allTimeSummary.totals.points} pts`}
              />
              <MetaStat
                icon="people-outline"
                label={`${playerClubs.length} clubs`}
              />
            </View>

            {isOwnProfile ? (
              <Button
                title="Edit Profile"
                variant="outline"
                size="sm"
                onPress={() => router.push("/profile/edit")}
                style={styles.editBtn}
              />
            ) : null}
          </Card>

          <View style={styles.statsHeader}>
            <Ionicons name="analytics" size={18} color={colors.secondary} />
            <Text style={styles.statsTitle}>Stats & activities</Text>
          </View>

          <PlayerStatsDashboard
            userId={player.id}
            isOwnProfile={isOwnProfile}
            isPro={isOwnProfile ? isPro : true}
            onUpgrade={
              isOwnProfile ? () => router.push("/(tabs)/profile") : undefined
            }
            onActivityPress={(eventId) => router.push(`/event/${eventId}`)}
          />
        </LinearGradient>
      </Screen>
    </>
  );
}

function MetaStat({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={colors.textDim} />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      flexGrow: 1,
    },
    background: {
      flexGrow: 1,
      marginHorizontal: -spacing.lg,
      marginTop: -spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
    },
    heroCard: {
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    heroTop: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    avatarCol: {
      alignItems: "center",
      gap: spacing.sm,
    },
    ovrPill: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radius.full,
      borderWidth: 2,
      borderColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      minWidth: 48,
    },
    ovrLabel: {
      ...typography.label,
      color: colors.textDim,
      fontSize: 8,
    },
    ovrValue: {
      ...typography.heading,
      color: colors.secondary,
      fontSize: 16,
    },
    heroInfo: {
      flex: 1,
      justifyContent: "center",
      minWidth: 0,
    },
    name: {
      ...typography.title,
      color: colors.text,
      fontSize: 22,
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
      marginBottom: 2,
    },
    bio: {
      ...typography.body,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      width: "31%",
      flexGrow: 1,
      flexBasis: "30%",
    },
    metaChipText: {
      ...typography.caption,
      color: colors.textMuted,
      fontSize: 11,
      flexShrink: 1,
    },
    editBtn: {
      marginTop: spacing.sm,
    },
    statsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statsTitle: {
      ...typography.heading,
      color: colors.text,
    },
    loading: {
      flex: 1,
      backgroundColor: colors.background,
    },
    notFound: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    notFoundText: {
      ...typography.body,
      color: colors.textMuted,
    },
  });
}
