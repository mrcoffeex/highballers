import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

interface EventMemberPickerProps {
  members: UserProfile[];
  selectedIds: string[];
  onToggle: (memberId: string) => void;
}

export function EventMemberPicker({
  members,
  selectedIds,
  onToggle,
}: EventMemberPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (members.length === 0) {
    return (
      <Text style={styles.empty}>
        No other members in this club yet. Invite players to the club first.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {members.map((member) => {
        const selected = selectedIds.includes(member.id);
        return (
          <Pressable
            key={member.id}
            onPress={() => onToggle(member.id)}
            style={[styles.row, selected && styles.rowSelected]}
          >
            <Avatar
              name={member.name}
              color={member.avatarColor}
              size={40}
              imageUrl={member.avatarUrl}
            />
            <View style={styles.info}>
              <Text style={styles.name}>{member.nickname ?? member.name}</Text>
              <Text style={styles.position}>{member.position}</Text>
            </View>
            <Ionicons
              name={selected ? "checkbox" : "square-outline"}
              size={24}
              color={selected ? colors.primary : colors.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
    },
    rowSelected: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, 0.07),
    },
    info: {
      flex: 1,
    },
    name: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
    },
    position: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    empty: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
  });
}
