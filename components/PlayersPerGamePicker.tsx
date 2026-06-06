import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  clampPlayersPerGame,
  formatGameSizeLabel,
  getAvailablePlayersPerGamePresets,
} from "../lib/gameFormats";
import { useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";

interface PlayersPerGamePickerProps {
  value: number;
  maxPlayers: number;
  onChange: (playersPerGame: number) => void;
  disabled?: boolean;
}

export function PlayersPerGamePicker({
  value,
  maxPlayers,
  onChange,
  disabled,
}: PlayersPerGamePickerProps) {
  const styles = useThemedStyles(createStyles);
  const presets = getAvailablePlayersPerGamePresets(maxPlayers);
  const safeValue = clampPlayersPerGame(value, maxPlayers);

  return (
    <View style={styles.wrap}>
      <View style={styles.picker}>
        {presets.map((preset) => {
          const selected = safeValue === preset;
          return (
            <Pressable
              key={preset}
              disabled={disabled}
              onPress={() => onChange(preset)}
              style={[
                styles.option,
                selected && styles.optionActive,
                disabled && styles.optionDisabled,
              ]}
            >
              <Text
                style={[
                  styles.optionValue,
                  selected && styles.optionValueActive,
                ]}
              >
                {formatGameSizeLabel(preset)}
              </Text>
              <Text
                style={[styles.optionMeta, selected && styles.optionMetaActive]}
              >
                {preset} players
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>
        Each court gets {safeValue} players ({formatGameSizeLabel(safeValue)}).
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.sm,
    },
    picker: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    option: {
      minWidth: 72,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: "center",
      gap: 2,
    },
    optionActive: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, 0.08),
    },
    optionDisabled: {
      opacity: 0.5,
    },
    optionValue: {
      ...typography.heading,
      color: colors.textMuted,
      fontSize: 16,
    },
    optionValueActive: {
      color: colors.primary,
    },
    optionMeta: {
      ...typography.caption,
      color: colors.textDim,
      fontSize: 10,
    },
    optionMetaActive: {
      color: colors.textMuted,
    },
    hint: {
      ...typography.caption,
      color: colors.textDim,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
  });
}
