import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemedStyles } from "../lib/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "../lib/theme";

interface StatSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  step?: number;
}

export function StatSlider({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  unit,
  step = 1,
}: StatSliderProps) {
  const styles = useThemedStyles(createStyles);
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value}
          {unit ? ` ${unit}` : ""}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.controls}>
        <Pressable
          onPress={decrease}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>−</Text>
        </Pressable>
        <Pressable
          onPress={increase}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    label: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    value: {
      ...typography.heading,
      color: colors.secondary,
      fontSize: 16,
    },
    track: {
      height: 8,
      backgroundColor: colors.cardBorder,
      borderRadius: radius.full,
      overflow: "hidden",
      marginBottom: spacing.sm,
    },
    fill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: radius.full,
    },
    controls: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
    },
    button: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonPressed: {
      backgroundColor: colors.card,
    },
    buttonText: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 22,
    },
  });
}
