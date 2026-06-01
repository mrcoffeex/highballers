import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  formatClockSeconds,
  parseClockMaskParts,
  splitClockSeconds,
} from "../lib/scoreboardClock";
import { colors, radius, spacing, typography } from "../lib/theme";

const DIGIT_SIZE = 44;
const SLOT_MIN_HEIGHT = 76;

type ClockMaskInputProps = {
  seconds: number;
  maxSeconds: number;
  running?: boolean;
  warning?: boolean;
  /** Shot clock: minutes locked to 0, same layout as game clock. */
  shotClockMode?: boolean;
  onCommit: (seconds: number) => void;
  onEditingChange?: (editing: boolean) => void;
};

function sanitizeDigits(text: string, maxLen: number): string {
  return text.replace(/\D/g, "").slice(0, maxLen);
}

export function ClockMaskInput({
  seconds,
  maxSeconds,
  running,
  warning,
  shotClockMode = false,
  onCommit,
  onEditingChange,
}: ClockMaskInputProps) {
  const parts = splitClockSeconds(seconds);
  const [editing, setEditing] = useState(false);
  const [minText, setMinText] = useState(
    shotClockMode ? "0" : parts.minutes,
  );
  const [secText, setSecText] = useState(parts.seconds);
  const secInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!editing) {
      const next = splitClockSeconds(seconds);
      setMinText(shotClockMode ? "0" : next.minutes);
      setSecText(next.seconds);
    }
  }, [editing, seconds, shotClockMode]);

  useEffect(() => {
    onEditingChange?.(editing);
  }, [editing, onEditingChange]);

  const startEditing = () => {
    setEditing(true);
    setTimeout(() => secInputRef.current?.focus(), 50);
  };

  const commit = () => {
    const parsed = shotClockMode
      ? parseClockMaskParts("0", secText, maxSeconds)
      : parseClockMaskParts(minText, secText, maxSeconds);
    if (parsed != null) {
      onCommit(parsed);
      const next = splitClockSeconds(parsed);
      setMinText(shotClockMode ? "0" : next.minutes);
      setSecText(next.seconds);
    } else {
      const fallback = splitClockSeconds(seconds);
      setMinText(shotClockMode ? "0" : fallback.minutes);
      setSecText(fallback.seconds);
    }
    setEditing(false);
  };

  const cancel = () => {
    const fallback = splitClockSeconds(seconds);
    setMinText(shotClockMode ? "0" : fallback.minutes);
    setSecText(fallback.seconds);
    setEditing(false);
  };

  const displayTime = shotClockMode
    ? `0:${splitClockSeconds(seconds).seconds}`
    : formatClockSeconds(seconds);

  return (
    <View style={styles.slot} pointerEvents="box-none">
      {!editing ? (
        <Pressable
          onPress={startEditing}
          style={styles.displayTap}
          accessibilityRole="button"
          accessibilityLabel="Edit time"
          accessibilityHint="Opens minute and second fields"
        >
          <Text
            style={[
              styles.displayTime,
              warning && styles.displayWarning,
              running && styles.displayRunning,
            ]}
          >
            {displayTime}
          </Text>
          <Text style={styles.displayHint}>Tap to edit</Text>
        </Pressable>
      ) : (
        <View style={styles.editBlock} pointerEvents="auto">
          <View style={styles.editRow}>
            {shotClockMode ? (
              <View style={[styles.digitBox, styles.digitLocked]}>
                <Text style={styles.digitLockedText}>0</Text>
              </View>
            ) : (
              <TextInput
                style={[styles.digitBox, warning && styles.digitWarning]}
                value={minText}
                onChangeText={(text) => setMinText(sanitizeDigits(text, 2))}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
                placeholder="00"
                placeholderTextColor={colors.textDim}
                accessibilityLabel="Minutes"
                returnKeyType="next"
                onSubmitEditing={() => secInputRef.current?.focus()}
              />
            )}
            <Text style={styles.colon}>:</Text>
            <TextInput
              ref={secInputRef}
              style={[styles.digitBox, warning && styles.digitWarning]}
              value={secText}
              onChangeText={(text) => setSecText(sanitizeDigits(text, 2))}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
              placeholder="00"
              placeholderTextColor={colors.textDim}
              accessibilityLabel="Seconds"
              returnKeyType="done"
              onSubmitEditing={commit}
            />
            <Pressable
              style={({ pressed }) => [
                styles.doneBtn,
                pressed && styles.doneBtnPressed,
              ]}
              onPress={commit}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Save time"
            >
              <Text style={styles.doneText}>OK</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={cancel}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancel edit"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: "100%",
    minHeight: SLOT_MIN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  displayTap: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: `${colors.card}88`,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  displayTime: {
    ...typography.hero,
    fontSize: 56,
    lineHeight: 60,
    color: colors.text,
    fontVariant: ["tabular-nums"],
    minWidth: 120,
    textAlign: "center",
  },
  displayWarning: {
    color: colors.warning,
  },
  displayRunning: {
    color: colors.success,
  },
  displayHint: {
    ...typography.body,
    fontSize: 16,
    color: colors.textDim,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  editBlock: {
    width: "100%",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  digitBox: {
    width: DIGIT_SIZE,
    height: DIGIT_SIZE,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  digitLocked: {
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.cardBorder,
    backgroundColor: colors.background,
  },
  digitLockedText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textMuted,
    fontVariant: ["tabular-nums"],
  },
  digitWarning: {
    borderColor: colors.warning,
    color: colors.warning,
  },
  colon: {
    width: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: colors.textMuted,
  },
  doneBtn: {
    minWidth: 56,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.xs,
  },
  doneBtnPressed: {
    opacity: 0.85,
  },
  doneText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  cancelText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 14,
    paddingVertical: spacing.xs,
  },
});
