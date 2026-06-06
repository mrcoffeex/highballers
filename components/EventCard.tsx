import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { StyleSheet, Text, View } from "react-native";

import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { spacing, typography, type ThemeColors } from "../lib/theme";
import { isPrivateEvent } from "../lib/eventAccess";
import { getEventStatus } from "../lib/gameEvents";
import { GameEvent } from "../lib/types";
import { Badge, Card } from "./ui";

interface EventCardProps {
  event: GameEvent;
  clubName?: string;
  isJoined?: boolean;
  onPress?: () => void;
}

export function EventCard({
  event,
  clubName,
  isJoined,
  onPress,
}: EventCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const date = new Date(event.dateTime);
  const spotsLeft = event.maxPlayers - event.participantIds.length;
  const isFull = spotsLeft <= 0;
  const status = getEventStatus(event);

  const statusBadge =
    status === "ongoing" ? (
      <Badge label="Ongoing" color={colors.success} />
    ) : status === "done" ? (
      <Badge label="Done" color={colors.textMuted} />
    ) : null;

  const visibilityBadge = isPrivateEvent(event) ? (
    <Badge label="Private" color={colors.warning} />
  ) : null;

  const rosterBadge = event.shuffled ? (
    <Badge label="Teams set" color={colors.accent} />
  ) : isJoined ? (
    <Badge label="Joined" color={colors.success} />
  ) : isFull ? (
    <Badge label="Full" color={colors.warning} />
  ) : (
    <Badge label={`${spotsLeft} spots`} color={colors.primary} />
  );

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.dateBox,
            status === "ongoing" && styles.dateBoxOngoing,
            status === "done" && styles.dateBoxDone,
          ]}
        >
          {status === "ongoing" ? <View style={styles.liveDot} /> : null}
          <Text
            style={[styles.dateMonth, status === "done" && styles.dateTextDone]}
          >
            {format(date, "MMM")}
          </Text>
          <Text
            style={[styles.dateDay, status === "done" && styles.dateTextDone]}
          >
            {format(date, "d")}
          </Text>
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, status === "done" && styles.titleDone]}
              numberOfLines={1}
            >
              {event.title}
            </Text>
            {statusBadge}
          </View>
          {clubName ? <Text style={styles.club}>{clubName}</Text> : null}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta}>{format(date, "h:mm a")}</Text>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.textMuted}
            />
            <Text style={styles.meta} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.spots}>
          <Ionicons
            name="people"
            size={16}
            color={isFull ? colors.warning : colors.success}
          />
          <Text style={[styles.spotsText, isFull && styles.spotsFull]}>
            {event.participantIds.length}/{event.maxPlayers} players
          </Text>
        </View>
        <View style={styles.badgeRow}>
          {visibilityBadge}
          {rosterBadge}
        </View>
      </View>
    </Card>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.md,
    },
    topRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    dateBox: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    dateBoxOngoing: {
      borderWidth: 2,
      borderColor: colors.success,
    },
    dateBoxDone: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    liveDot: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
      borderWidth: 1,
      borderColor: colors.background,
    },
    dateMonth: {
      ...typography.label,
      color: colors.text,
      fontSize: 10,
    },
    dateDay: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      lineHeight: 24,
    },
    dateTextDone: {
      color: colors.textMuted,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: 2,
    },
    title: {
      ...typography.heading,
      color: colors.text,
      flex: 1,
    },
    titleDone: {
      color: colors.textMuted,
    },
    club: {
      ...typography.caption,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexWrap: "wrap",
    },
    meta: {
      ...typography.caption,
      color: colors.textMuted,
      marginRight: spacing.sm,
      flexShrink: 1,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    spots: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    spotsText: {
      ...typography.caption,
      color: colors.success,
    },
    spotsFull: {
      color: colors.warning,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
  });
}
