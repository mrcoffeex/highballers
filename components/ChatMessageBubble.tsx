import { format } from "date-fns";
import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getGifMessageUrl, isGifMessage } from "../lib/chatMessageContent";
import { isPendingChatMessageId } from "../lib/chatThread";
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

function ChatMessageBubbleInner({
  message,
  sender,
  isMine,
  showAvatar,
}: ChatMessageBubbleProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const gifUrl = getGifMessageUrl(message.body);
  const isGif = isGifMessage(message.body) && gifUrl != null;
  const timeLabel = useMemo(
    () => format(new Date(message.createdAt), "h:mm a"),
    [message.createdAt],
  );
  const isPending = isPendingChatMessageId(message.id);

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
          isGif && styles.bubbleGif,
          isPending && styles.bubblePending,
        ]}
      >
        {!isMine && showAvatar ? (
          <Text style={styles.senderName}>
            {sender?.nickname ?? sender?.name ?? "Baller"}
          </Text>
        ) : null}
        {isGif ? (
          <Image
            source={{ uri: gifUrl }}
            style={styles.gif}
            contentFit="cover"
            autoplay
            allowDownscaling
            cachePolicy="memory-disk"
            recyclingKey={`${message.id}:${gifUrl}`}
            accessibilityLabel="GIF"
          />
        ) : (
          <Text style={[styles.body, isMine && styles.bodyMine]}>
            {message.body}
          </Text>
        )}
        <Text style={[styles.time, isMine && styles.timeMine]}>
          {timeLabel}
        </Text>
      </View>
    </View>
  );
}

export const ChatMessageBubble = memo(ChatMessageBubbleInner);

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    bubbleGif: {
      paddingHorizontal: spacing.xs,
      paddingTop: spacing.xs,
      maxWidth: "72%",
    },
    bubblePending: {
      opacity: 0.72,
    },
    bubbleMine: {
      backgroundColor: colors.primary,
      borderColor: withAlpha(colors.primary, 0.5),
      borderBottomRightRadius: radius.sm,
    },
    bubbleTheirs: {
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
      borderBottomLeftRadius: radius.sm,
    },
    senderName: {
      ...typography.caption,
      color: colors.primary,
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
      color: colors.onPrimary,
    },
    gif: {
      width: 200,
      height: 200,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceVariant,
    },
    time: {
      ...typography.caption,
      color: colors.textDim,
      fontSize: 10,
      marginTop: spacing.xs,
      alignSelf: "flex-end",
    },
    timeMine: {
      color: withAlpha(colors.onPrimary, 0.8),
    },
  });
}
