import { format } from "date-fns";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../lib/theme";
import { UserProfile } from "../lib/types";
import { Avatar } from "./ui";

interface ChatMessageBubbleProps {
  message: {
    id: string;
    userId: string;
    body: string;
    createdAt: string;
  };
  sender?: UserProfile;
  isMine: boolean;
  showAvatar: boolean;
}

export function ChatMessageBubble({
  message,
  sender,
  isMine,
  showAvatar,
}: ChatMessageBubbleProps) {
  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      {!isMine && showAvatar ? (
        <Avatar
          name={sender?.name ?? "?"}
          color={sender?.avatarColor ?? colors.primary}
          size={32}
          imageUrl={sender?.avatarUrl}
        />
      ) : !isMine ? (
        <View style={styles.avatarSpacer} />
      ) : null}

      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        {!isMine && showAvatar ? (
          <Text style={styles.senderName}>
            {sender?.nickname ?? sender?.name ?? "Baller"}
          </Text>
        ) : null}
        <Text style={[styles.body, isMine && styles.bodyMine]}>
          {message.body}
        </Text>
        <Text style={[styles.time, isMine && styles.timeMine]}>
          {format(new Date(message.createdAt), "h:mm a")}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  rowTheirs: {
    justifyContent: "flex-start",
  },
  avatarSpacer: {
    width: 32,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderColor: `${colors.primary}80`,
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderBottomLeftRadius: radius.sm,
  },
  senderName: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: "700",
    marginBottom: 2,
  },
  body: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  bodyMine: {
    color: colors.text,
  },
  time: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 10,
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  timeMine: {
    color: `${colors.text}CC`,
  },
});
