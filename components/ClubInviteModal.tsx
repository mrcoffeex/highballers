import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { getClubInviteMessage, getClubInviteUrl } from "../lib/clubInvite";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../lib/theme";
import { Button } from "./ui";

interface ClubInviteModalProps {
  visible: boolean;
  clubId: string;
  clubName: string;
  visibility: "open" | "private";
  onClose: () => void;
}

export function ClubInviteModal({
  visible,
  clubId,
  clubName,
  visibility,
  onClose,
}: ClubInviteModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [copied, setCopied] = useState(false);
  const inviteUrl = useMemo(() => getClubInviteUrl(clubId), [clubId]);
  const inviteMessage = useMemo(
    () => getClubInviteMessage(clubName, clubId),
    [clubId, clubName],
  );

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: `Join ${clubName}`,
            text: inviteMessage,
            url: inviteUrl,
          });
          return;
        }

        await handleCopy();
        return;
      }

      await Share.share({
        message: inviteMessage,
        url: inviteUrl,
        title: `Join ${clubName}`,
      });
    } catch {
      // User dismissed the share sheet.
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Invite Players</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            {visibility === "open"
              ? "Share this link or QR code. Anyone can join instantly."
              : "Share this link or QR code. New players can request to join."}
          </Text>

          <View style={styles.qrWrap}>
            <QRCode
              value={inviteUrl}
              size={180}
              color={colors.background}
              backgroundColor={colors.text}
            />
          </View>

          <Text style={styles.clubName}>{clubName}</Text>

          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={2} selectable>
              {inviteUrl}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title={copied ? "Copied!" : "Copy Link"}
              variant="outline"
              onPress={handleCopy}
              icon={
                <Ionicons
                  name="copy-outline"
                  size={18}
                  color={colors.primary}
                />
              }
              style={styles.actionBtn}
            />
            <Button
              title="Share"
              onPress={handleShare}
              icon={
                <Ionicons name="share-outline" size={18} color={colors.text} />
              }
              style={styles.actionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      padding: spacing.lg,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.lg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.heading,
      color: colors.text,
    },
    subtitle: {
      ...typography.body,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    qrWrap: {
      alignSelf: "center",
      backgroundColor: colors.text,
      padding: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
    },
    clubName: {
      ...typography.heading,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.md,
    },
    linkBox: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    linkText: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: "center",
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    actionBtn: {
      flex: 1,
    },
  });
}
