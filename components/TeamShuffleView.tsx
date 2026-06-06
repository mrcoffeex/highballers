import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { calculatePlayerRating, getBalanceLabel } from "../lib/teamBalancer";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";
import { UserProfile } from "../lib/types";
import { Avatar } from "./ui";

interface TeamShuffleViewProps {
  teamA: UserProfile[];
  teamB: UserProfile[];
  ratingA: number;
  ratingB: number;
}

export function TeamShuffleView({
  teamA,
  teamB,
  ratingA,
  ratingB,
}: TeamShuffleViewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const balanceLabel = getBalanceLabel({ teamA, teamB, ratingA, ratingB });

  return (
    <View style={styles.container}>
      <View style={styles.balanceBanner}>
        <Ionicons name="scale-outline" size={18} color={colors.primary} />
        <Text style={styles.balanceText}>{balanceLabel}</Text>
      </View>

      <View style={styles.teamsRow}>
        <TeamColumn
          label="Team A"
          color={colors.teamA}
          players={teamA}
          rating={ratingA}
        />
        <View style={styles.vsContainer}>
          <Text style={styles.vs}>VS</Text>
        </View>
        <TeamColumn
          label="Team B"
          color={colors.teamB}
          players={teamB}
          rating={ratingB}
        />
      </View>
    </View>
  );
}

interface TeamColumnProps {
  label: string;
  color: string;
  players: UserProfile[];
  rating: number;
}

function TeamColumn({ label, color, players, rating }: TeamColumnProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.teamColumn}>
      <LinearGradient
        colors={[withAlpha(color, 0.2), withAlpha(color, 0.07)]}
        style={[styles.teamHeader, { borderColor: withAlpha(color, 0.33) }]}
      >
        <Text style={[styles.teamLabel, { color }]}>{label}</Text>
        <Text style={styles.teamRating}>Rating {Math.round(rating)}</Text>
      </LinearGradient>
      {players.map((player) => (
        <View key={player.id} style={styles.playerRow}>
          <Avatar name={player.name} color={player.avatarColor} size={32} />
          <View style={styles.playerInfo}>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.nickname ?? player.name}
            </Text>
            <Text style={styles.playerMeta}>
              {player.position} · OVR {calculatePlayerRating(player.stats)}
            </Text>
          </View>
        </View>
      ))}
      {players.length === 0 ? (
        <Text style={styles.emptyTeam}>No players</Text>
      ) : null}
    </View>
  );
}

export async function triggerShuffleHaptic() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    balanceBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      backgroundColor: withAlpha(colors.primary, 0.08),
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, 0.2),
    },
    balanceText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: "700",
    },
    teamsRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    teamColumn: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    teamHeader: {
      padding: spacing.sm + 2,
      borderBottomWidth: 1,
      alignItems: "center",
    },
    teamLabel: {
      ...typography.label,
      fontSize: 11,
    },
    teamRating: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    vsContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 2,
    },
    vs: {
      ...typography.label,
      color: colors.textDim,
      fontSize: 10,
    },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    playerInfo: {
      flex: 1,
    },
    playerName: {
      ...typography.caption,
      color: colors.text,
      fontWeight: "600",
    },
    playerMeta: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    emptyTeam: {
      ...typography.caption,
      color: colors.textDim,
      textAlign: "center",
      padding: spacing.lg,
    },
  });
}
