import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CHAT_EMOJI_GROUPS, type ChatEmojiGroup } from "../lib/chatEmojis";
import { useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";

type ChatEmojiPickerProps = {
  recentEmojis: string[];
  onPick: (emoji: string) => void;
};

export function ChatEmojiPicker({
  recentEmojis,
  onPick,
}: ChatEmojiPickerProps) {
  const styles = useThemedStyles(createStyles);
  const groups: ChatEmojiGroup[] =
    recentEmojis.length > 0
      ? [
          { id: "recent", label: "🕐", emojis: recentEmojis },
          ...CHAT_EMOJI_GROUPS,
        ]
      : CHAT_EMOJI_GROUPS;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group) => (
          <View key={group.id} style={styles.section}>
            <Text style={styles.sectionLabel}>
              {group.id === "recent" ? "Recent" : group.label}
            </Text>
            <View style={styles.emojiRow}>
              {group.emojis.map((emoji) => (
                <Pressable
                  key={`${group.id}-${emoji}`}
                  onPress={() => onPick(emoji)}
                  style={({ pressed }) => [
                    styles.emojiBtn,
                    pressed && styles.emojiBtnPressed,
                  ]}
                  accessibilityLabel={`Insert ${emoji}`}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      height: 220,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
    gridScroll: {
      flex: 1,
    },
    grid: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
    },
    section: {
      marginBottom: spacing.sm,
    },
    sectionLabel: {
      ...typography.caption,
      color: colors.textDim,
      marginBottom: spacing.xs,
      marginLeft: spacing.xs,
    },
    emojiRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    emojiBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.md,
    },
    emojiBtnPressed: {
      backgroundColor: withAlpha(colors.primary, 0.14),
    },
    emoji: {
      fontSize: 26,
      lineHeight: 30,
    },
  });
}
