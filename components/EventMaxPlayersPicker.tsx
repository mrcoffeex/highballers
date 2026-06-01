import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  clampEventMaxPlayers,
  EVENT_MAX_PLAYER_PRESETS,
  EVENT_MIN_PLAYERS,
  getAllowedMaxPlayerPresets,
  getMaxEventPlayersForTier,
  isEventMaxPlayerPreset,
  parseEventMaxPlayersInput,
} from "../lib/eventCapacity";
import { colors, radius, spacing, typography } from "../lib/theme";
import { SubscriptionTier } from "../lib/types";
import { Input } from "./ui";

type EventMaxPlayersPickerProps = {
  tier: SubscriptionTier;
  maxPlayers: number;
  customMaxPlayers: string;
  useCustomMax: boolean;
  onMaxPlayersChange: (value: number) => void;
  onCustomMaxPlayersChange: (value: string) => void;
  onUseCustomMaxChange: (value: boolean) => void;
  onRequireUpgrade: (message: string) => void;
  minPlayers?: number;
};

export function EventMaxPlayersPicker({
  tier,
  maxPlayers,
  customMaxPlayers,
  useCustomMax,
  onMaxPlayersChange,
  onCustomMaxPlayersChange,
  onUseCustomMaxChange,
  onRequireUpgrade,
  minPlayers = EVENT_MIN_PLAYERS,
}: EventMaxPlayersPickerProps) {
  const maxCap = getMaxEventPlayersForTier(tier);
  const allowedPresets = useMemo(
    () => getAllowedMaxPlayerPresets(tier),
    [tier],
  );

  const resolvedMaxPlayers = useMemo(() => {
    if (!useCustomMax) return clampEventMaxPlayers(maxPlayers, tier);
    return parseEventMaxPlayersInput(customMaxPlayers, tier, minPlayers);
  }, [customMaxPlayers, maxCap, maxPlayers, minPlayers, tier, useCustomMax]);

  useEffect(() => {
    if (useCustomMax) return;
    if (maxPlayers <= maxCap) return;
    onMaxPlayersChange(allowedPresets[allowedPresets.length - 1] ?? 10);
  }, [allowedPresets, maxCap, maxPlayers, onMaxPlayersChange, useCustomMax]);

  const handlePresetPress = (count: number) => {
    if (count > maxCap) {
      onRequireUpgrade(
        `Games above ${maxCap} players are All-Star only. Upgrade to schedule larger runs.`,
      );
      return;
    }
    onUseCustomMaxChange(false);
    onMaxPlayersChange(count);
  };

  return (
    <View>
      <Text style={styles.hint}>
        {tier === "all_star"
          ? `Up to ${maxCap} players`
          : `Basic: up to ${maxCap} players · All-Star unlocks 30–40`}
      </Text>
      <View style={styles.playerPicker}>
        {EVENT_MAX_PLAYER_PRESETS.map((count) => {
          const locked = count > maxCap;
          const selected = !useCustomMax && maxPlayers === count;

          return (
            <Pressable
              key={count}
              onPress={() => handlePresetPress(count)}
              style={[
                styles.playerOption,
                selected && styles.playerOptionActive,
                locked && styles.playerOptionLocked,
              ]}
            >
              {locked ? (
                <Ionicons
                  name="lock-closed"
                  size={12}
                  color={colors.textDim}
                  style={styles.lockIcon}
                />
              ) : null}
              <Text
                style={[
                  styles.playerOptionValue,
                  selected && styles.playerOptionValueActive,
                  locked && styles.playerOptionValueLocked,
                ]}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => onUseCustomMaxChange(true)}
          style={[
            styles.playerOption,
            useCustomMax && styles.playerOptionActive,
          ]}
        >
          <Text
            style={[
              styles.playerOptionValue,
              useCustomMax && styles.playerOptionValueActive,
            ]}
          >
            Custom
          </Text>
        </Pressable>
      </View>

      {useCustomMax ? (
        <View style={styles.customWrap}>
          <Input
            placeholder={`${Math.max(EVENT_MIN_PLAYERS, minPlayers)}-${maxCap}`}
            value={customMaxPlayers}
            onChangeText={onCustomMaxPlayersChange}
            keyboardType="number-pad"
            style={styles.field}
          />
          <Text style={styles.customHint}>
            {resolvedMaxPlayers == null
              ? `Enter ${minPlayers}–${maxCap} players.`
              : `${resolvedMaxPlayers} players`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function useResolvedEventMaxPlayers(
  tier: SubscriptionTier,
  maxPlayers: number,
  customMaxPlayers: string,
  useCustomMax: boolean,
  minPlayers = EVENT_MIN_PLAYERS,
) {
  return useMemo(() => {
    if (!useCustomMax) return clampEventMaxPlayers(maxPlayers, tier);
    return parseEventMaxPlayersInput(customMaxPlayers, tier, minPlayers);
  }, [customMaxPlayers, maxPlayers, minPlayers, tier, useCustomMax]);
}

export { isEventMaxPlayerPreset };

const styles = StyleSheet.create({
  hint: {
    ...typography.caption,
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
  playerPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  playerOption: {
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
  playerOptionActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  playerOptionLocked: {
    opacity: 0.55,
  },
  lockIcon: {
    marginBottom: 2,
  },
  playerOptionValue: {
    ...typography.heading,
    color: colors.textMuted,
    fontSize: 18,
  },
  playerOptionValueActive: {
    color: colors.primary,
  },
  playerOptionValueLocked: {
    color: colors.textDim,
  },
  customWrap: {
    marginBottom: spacing.sm,
  },
  field: {
    marginBottom: spacing.xs,
  },
  customHint: {
    ...typography.caption,
    color: colors.textDim,
  },
});
