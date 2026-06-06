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
import { ClubVisibility } from "../lib/types";

type ClubVisibilityPickerProps = {
  value: ClubVisibility;
  onChange: (visibility: ClubVisibility) => void;
  isPro: boolean;
  onRequirePro: (message: string) => void;
  disabled?: boolean;
};

export function ClubVisibilityPicker({
  value,
  onChange,
  isPro,
  onRequirePro,
  disabled = false,
}: ClubVisibilityPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.typeRow}>
      <Pressable
        disabled={disabled}
        onPress={() => onChange("open")}
        style={[
          styles.typeCard,
          value === "open" && styles.typeCardActive,
          disabled && styles.typeCardDisabled,
        ]}
      >
        <Ionicons
          name="globe-outline"
          size={22}
          color={value === "open" ? colors.primary : colors.textMuted}
        />
        <Text
          style={[styles.typeTitle, value === "open" && styles.typeTitleActive]}
        >
          Public
        </Text>
        <Text style={styles.typeDesc}>Anyone can join instantly</Text>
      </Pressable>
      <Pressable
        disabled={disabled}
        onPress={() => {
          if (!isPro) {
            onRequirePro("Private clubs are All-Star only.");
            return;
          }
          onChange("private");
        }}
        style={[
          styles.typeCard,
          value === "private" && styles.typeCardActive,
          !isPro && styles.typeCardLocked,
          disabled && styles.typeCardDisabled,
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={value === "private" ? colors.primary : colors.textMuted}
        />
        <Text
          style={[
            styles.typeTitle,
            value === "private" && styles.typeTitleActive,
          ]}
        >
          Private
        </Text>
        <Text style={styles.typeDesc}>
          {isPro ? "Players request to join" : "All-Star only"}
        </Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    typeRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    typeCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xs,
    },
    typeCardActive: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, 0.07),
    },
    typeCardLocked: {
      opacity: 0.72,
    },
    typeCardDisabled: {
      opacity: 0.6,
    },
    typeTitle: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: 15,
    },
    typeTitleActive: {
      color: colors.primary,
    },
    typeDesc: {
      ...typography.caption,
      color: colors.textDim,
    },
  });
}
