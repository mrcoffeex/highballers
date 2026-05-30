import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { formatChatPreview, formatChatTimestamp } from "../lib/clubChat";
import { colors, radius, spacing, typography } from "../lib/theme";
import { Club, ClubChatPreview, UserProfile } from "../lib/types";
import { ClubIcon } from "./ClubIcon";
import { Card } from "./ui";

interface ChatListItemProps {
  club: Club;
  preview: ClubChatPreview;
  sender?: UserProfile;
  onPress: () => void;
}

export function ChatListItem({
  club,
  preview,
  sender,
  onPress,
}: ChatListItemProps) {
  const lastMessage = preview.lastMessage;
  const subtitle = lastMessage
    ? sender
      ? `${sender.nickname ?? sender.name}: ${formatChatPreview(lastMessage.body)}`
      : formatChatPreview(lastMessage.body)
    : "No messages yet — say what's good";

  return (
    <Card onPress={onPress} style={styles.card}>
      <ClubIcon
        name={club.name}
        iconColor={club.iconColor}
        iconUrl={club.iconUrl}
        size={48}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {club.name}
          </Text>
          {lastMessage ? (
            <Text style={styles.time}>
              {formatChatTimestamp(lastMessage.createdAt)}
            </Text>
          ) : null}
        </View>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    flex: 1,
    fontSize: 16,
  },
  time: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 11,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
