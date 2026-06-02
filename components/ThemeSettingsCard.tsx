import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, useThemedStyles } from "@/lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: "system", label: "System", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

export function ThemeSettingsCard() {
  const { themePreference, setThemePreference, colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Appearance</Text>
      <Text style={styles.description}>
        Choose how HighBallers looks on this device.
      </Text>
      <View style={styles.segmentRow}>
        {OPTIONS.map((option) => {
          const active = themePreference === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => setThemePreference(option.value)}
              style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={active ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.segmentLabel,
                  active && styles.segmentLabelActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: "hidden",
      marginBottom: spacing.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    heading: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    description: {
      ...typography.bodySmall,
      color: colors.textDim,
    },
    segmentRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    segmentBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.surfaceContainerLow,
    },
    segmentBtnActive: {
      borderColor: colors.borderAccent,
      backgroundColor: colors.primaryContainer,
    },
    segmentLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "600",
    },
    segmentLabelActive: {
      color: colors.primary,
    },
  });
}
