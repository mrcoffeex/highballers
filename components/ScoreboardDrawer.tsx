import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClockMaskInput } from "./ClockMaskInput";
import {
  formatPeriodLabel,
  MAX_QUARTER_MINUTES,
  MIN_QUARTER_MINUTES,
  quarterLengthSeconds,
  SHOT_CLOCK_PRESETS,
  MAX_SHOT_CLOCK_SECONDS,
  type ScoreboardClockState,
} from "../lib/scoreboardClock";
import {
  preloadScoreboardBuzzer,
  stopGameBuzzerHold,
} from "../lib/scoreboardBuzzer";
import { useTheme, useThemedStyles } from "../lib/ThemeProvider";
import {
  radius,
  spacing,
  typography,
  withAlpha,
  type ThemeColors,
} from "../lib/theme";

const QUARTER_MINUTE_OPTIONS = Array.from(
  { length: MAX_QUARTER_MINUTES - MIN_QUARTER_MINUTES + 1 },
  (_, index) => MIN_QUARTER_MINUTES + index,
);

type SelectOption<T extends number> = {
  value: T;
  label: string;
};

function ScoreboardSelect<T extends number>({
  label,
  value,
  options,
  onChange,
  testID,
  compact = false,
}: {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  testID?: string;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? String(value);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <View style={[styles.selectField, compact && styles.selectFieldCompact]}>
        {!compact ? <Text style={styles.sectionLabel}>{label}</Text> : null}
        <Pressable
          testID={testID}
          style={[styles.selectTrigger, compact && styles.selectTriggerCompact]}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${selectedLabel}`}
          accessibilityState={{ expanded: open }}
        >
          <Text
            style={[styles.selectValue, compact && styles.selectValueCompact]}
            numberOfLines={1}
          >
            {selectedLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={compact ? 14 : 18}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <View style={styles.selectBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
            accessibilityRole="button"
            accessibilityLabel="Close options"
          />
          <View
            style={[
              styles.selectSheet,
              { paddingBottom: Math.max(insets.bottom, spacing.md) },
            ]}
          >
            <View style={styles.selectSheetHeader}>
              <Text style={styles.selectSheetTitle}>{label}</Text>
              <Pressable
                onPress={closeMenu}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close options"
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.selectSheetScroll}
              contentContainerStyle={styles.selectSheetScrollContent}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.selectOption,
                      active && styles.selectOptionActive,
                    ]}
                    onPress={() => {
                      onChange(option.value);
                      closeMenu();
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        active && styles.selectOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {active ? (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export type ScoreboardControls = {
  state: ScoreboardClockState;
  adjustTeamAScore: (delta: number) => void;
  adjustTeamBScore: (delta: number) => void;
  toggleGameClock: () => void;
  toggleShotClock: () => void;
  resetGameClock: () => void;
  setGameClockSeconds: (seconds: number) => void;
  setShotClockSeconds: (seconds: number) => void;
  resetShotClock: (seconds?: number) => void;
  setQuarterMinutes: (minutes: number) => void;
  nextPeriod: () => void;
  setPeriod: (period: number) => void;
  startBuzzerHold: () => void;
  stopBuzzerHold: () => void;
  triggerBuzzer: () => void;
  resetAll: () => void;
};

type ScoreboardDrawerProps = {
  visible: boolean;
  onClose?: () => void;
  embedded?: boolean;
  teamALabel?: string;
  teamBLabel?: string;
  controls: ScoreboardControls;
};

function CompactScoreColumn({
  label,
  score,
  color,
  onMinus,
  onPlus,
}: {
  label: string;
  score: number;
  color: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.scoreColumn}>
      <Text style={styles.scoreLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.scoreValue, { color }]}>{score}</Text>
      <View style={styles.scoreBtns}>
        <Pressable style={styles.iconBtn} onPress={onMinus} hitSlop={6}>
          <Ionicons name="remove" size={20} color={colors.textMuted} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onPlus} hitSlop={6}>
          <Ionicons name="add" size={20} color={color} />
        </Pressable>
      </View>
    </View>
  );
}

function CompactClockPanel({
  title,
  seconds,
  maxSeconds,
  running,
  warning,
  shotClockMode,
  compact,
  onSetSeconds,
  onToggle,
  onReset,
  headerControl,
}: {
  title: string;
  seconds: number;
  maxSeconds: number;
  running: boolean;
  warning?: boolean;
  shotClockMode?: boolean;
  compact?: boolean;
  onSetSeconds: (value: number) => void;
  onToggle: () => void;
  onReset: () => void;
  headerControl?: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [editing, setEditing] = useState(false);

  return (
    <View
      style={[
        styles.clockPanel,
        styles.clockPanelExpanded,
        running && styles.clockPanelRunning,
        editing && styles.clockPanelEditing,
      ]}
    >
      <View style={styles.clockPanelHeader}>
        <View style={styles.clockTitleWrap}>
          <Text style={styles.clockTitle}>{title}</Text>
          <Text style={styles.clockTapHint}>
            {editing
              ? "Edit time · tap OK when done"
              : running
                ? "Running · tap card to pause"
                : "Tap card to start"}
          </Text>
        </View>
        <View style={styles.clockHeaderActions}>
          {headerControl}
          <Pressable
            style={styles.resetBtn}
            onPress={onReset}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Reset ${title}`}
          >
            <Ionicons name="refresh" size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      <View
        style={styles.clockTapZone}
        pointerEvents={editing ? "box-none" : "auto"}
      >
        <ClockMaskInput
          seconds={seconds}
          maxSeconds={maxSeconds}
          running={running}
          warning={warning}
          shotClockMode={shotClockMode}
          compact={compact}
          onToggle={editing ? undefined : onToggle}
          onCommit={onSetSeconds}
          onEditingChange={setEditing}
        />
      </View>
    </View>
  );
}

export function ScoreboardDrawer({
  visible,
  onClose,
  embedded = false,
  teamALabel = "Team A",
  teamBLabel = "Team B",
  controls,
}: ScoreboardDrawerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { state } = controls;
  const [buzzerHolding, setBuzzerHolding] = useState(false);

  useEffect(() => {
    if (!visible) {
      setBuzzerHolding(false);
      void stopGameBuzzerHold();
      return;
    }
    preloadScoreboardBuzzer();
  }, [visible]);
  const gameMaxSeconds = quarterLengthSeconds(state.quarterMinutes);
  const gameWarning =
    state.gameClockSeconds <= 60 && state.gameClockSeconds > 0;
  const shotWarning = state.shotClockSeconds <= 5 && state.shotClockSeconds > 0;
  const gameExpired = state.gameClockSeconds === 0;
  const shotExpired = state.shotClockSeconds === 0;
  const quarterMinuteOptions = useMemo(
    () =>
      QUARTER_MINUTE_OPTIONS.map((minutes) => ({
        value: minutes,
        label: `${minutes}m`,
      })),
    [],
  );
  const shotPresetOptions = useMemo(
    () =>
      SHOT_CLOCK_PRESETS.map((seconds) => ({
        value: seconds,
        label: `${seconds}s`,
      })),
    [],
  );

  if (!visible) return null;

  const panel = (
    <View style={[styles.fullScreen, embedded && styles.embedded]}>
      {!embedded ? (
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.headerSide}
            accessibilityRole="button"
            accessibilityLabel="Close scoreboard"
          >
            <Ionicons name="chevron-down" size={24} color={colors.textMuted} />
          </Pressable>
          <Text style={styles.headerTitle}>Scoreboard</Text>
          <View style={styles.headerSide} />
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <View style={styles.topSection}>
          <View style={styles.scoresRow}>
            <CompactScoreColumn
              label={teamALabel}
              score={state.teamAScore}
              color={colors.teamA}
              onMinus={() => controls.adjustTeamAScore(-1)}
              onPlus={() => controls.adjustTeamAScore(1)}
            />
            <View style={styles.scoreDivider} />
            <CompactScoreColumn
              label={teamBLabel}
              score={state.teamBScore}
              color={colors.teamB}
              onMinus={() => controls.adjustTeamBScore(-1)}
              onPlus={() => controls.adjustTeamBScore(1)}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Period</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.periodBar}
            >
              {[1, 2, 3, 4, 5].map((period) => (
                <Pressable
                  key={period}
                  style={[
                    styles.periodChip,
                    state.period === period && styles.periodChipActive,
                  ]}
                  onPress={() => controls.setPeriod(period)}
                >
                  <Text
                    style={[
                      styles.periodChipText,
                      state.period === period && styles.periodChipTextActive,
                    ]}
                  >
                    {formatPeriodLabel(period)}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.periodChip, styles.periodNextChip]}
                onPress={controls.nextPeriod}
                accessibilityLabel="Next period"
              >
                <Ionicons
                  name="play-forward"
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            </ScrollView>
          </View>
        </View>

        <View style={styles.clocksColumn}>
          <CompactClockPanel
            title="Game clock"
            seconds={state.gameClockSeconds}
            maxSeconds={gameMaxSeconds}
            running={state.gameRunning}
            warning={gameWarning || gameExpired}
            onSetSeconds={controls.setGameClockSeconds}
            onToggle={controls.toggleGameClock}
            onReset={controls.resetGameClock}
            headerControl={
              <ScoreboardSelect
                compact
                label="Minutes per quarter"
                value={state.quarterMinutes}
                options={quarterMinuteOptions}
                onChange={controls.setQuarterMinutes}
                testID="scoreboard-quarter-select"
              />
            }
          />

          <CompactClockPanel
            title="Shot clock"
            seconds={state.shotClockSeconds}
            maxSeconds={MAX_SHOT_CLOCK_SECONDS}
            running={state.shotRunning}
            warning={shotWarning || shotExpired}
            shotClockMode
            onSetSeconds={controls.setShotClockSeconds}
            onToggle={controls.toggleShotClock}
            onReset={() => controls.resetShotClock()}
            headerControl={
              <ScoreboardSelect
                compact
                label="Shot preset"
                value={state.defaultShotClockSeconds}
                options={shotPresetOptions}
                onChange={(seconds) => controls.resetShotClock(seconds)}
                testID="scoreboard-shot-preset-select"
              />
            }
          />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.buzzerBtn, buzzerHolding && styles.buzzerBtnActive]}
            onPressIn={() => {
              setBuzzerHolding(true);
              controls.startBuzzerHold();
            }}
            onPressOut={() => {
              setBuzzerHolding(false);
              controls.stopBuzzerHold();
            }}
            accessibilityRole="button"
            accessibilityLabel="Hold for buzzer"
            accessibilityHint="Press and hold to sound the buzzer continuously"
          >
            <Ionicons name="megaphone" size={24} color={colors.onPrimary} />
            <Text style={styles.buzzerText}>
              {buzzerHolding ? "Buzzing…" : "Hold buzzer"}
            </Text>
          </Pressable>
          <Pressable style={styles.resetAllBtn} onPress={controls.resetAll}>
            <Ionicons
              name="refresh-circle-outline"
              size={20}
              color={colors.textMuted}
            />
            <Text style={styles.resetAllText}>Reset all</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );

  if (embedded) return panel;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {panel}
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fullScreen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    embedded: {
      minHeight: 0,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    headerSide: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      ...typography.heading,
      flex: 1,
      textAlign: "center",
      color: colors.text,
      fontSize: 17,
    },
    scroll: {
      flex: 1,
    },
    body: {
      flexGrow: 1,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    topSection: {
      flexShrink: 0,
      gap: spacing.sm,
    },
    clocksColumn: {
      flex: 1,
      minHeight: 0,
      gap: spacing.sm,
    },
    sectionCard: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: spacing.md,
      gap: spacing.sm,
    },
    scoresRow: {
      flexDirection: "row",
      flexShrink: 0,
      minHeight: 100,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingVertical: spacing.md,
    },
    scoreColumn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    scoreDivider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: colors.cardBorder,
      marginVertical: spacing.sm,
    },
    scoreLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: "600",
      textAlign: "center",
    },
    scoreValue: {
      ...typography.hero,
      fontSize: 44,
      lineHeight: 48,
      textAlign: "center",
    },
    scoreBtns: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    sectionLabel: {
      ...typography.caption,
      color: colors.textDim,
      fontWeight: "700",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    selectField: {
      gap: spacing.xs,
      flexShrink: 0,
    },
    selectFieldCompact: {
      gap: 0,
      width: 72,
      position: "relative",
    },
    selectTrigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
    },
    selectTriggerCompact: {
      minHeight: 36,
      height: 36,
      gap: 2,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.sm,
    },
    selectValue: {
      ...typography.body,
      color: colors.text,
      fontWeight: "600",
      flex: 1,
    },
    selectValueCompact: {
      fontSize: 13,
      fontWeight: "700",
      flex: 0,
    },
    selectBackdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: withAlpha(colors.text, 0.45),
    },
    selectSheet: {
      maxHeight: "55%",
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.cardBorder,
      overflow: "hidden",
    },
    selectSheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    selectSheetTitle: {
      ...typography.heading,
      color: colors.text,
      fontSize: 16,
    },
    selectSheetScroll: {
      flexGrow: 0,
    },
    selectSheetScrollContent: {
      paddingBottom: spacing.sm,
    },
    selectOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    selectOptionActive: {
      backgroundColor: withAlpha(colors.primary, 0.1),
    },
    selectOptionText: {
      ...typography.body,
      color: colors.text,
      fontWeight: "500",
    },
    selectOptionTextActive: {
      color: colors.primary,
      fontWeight: "700",
    },
    periodBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    periodChip: {
      minWidth: 52,
      height: 44,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    periodChipActive: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, 0.14),
    },
    periodNextChip: {
      minWidth: 44,
      paddingHorizontal: spacing.sm,
    },
    periodChipText: {
      ...typography.body,
      fontSize: 17,
      color: colors.textMuted,
      fontWeight: "700",
    },
    periodChipTextActive: {
      color: colors.primary,
    },
    clockPanel: {
      width: "100%",
      alignSelf: "stretch",
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    clockPanelExpanded: {
      flex: 1,
      minHeight: 120,
    },
    clockPanelRunning: {
      borderColor: colors.success,
      backgroundColor: withAlpha(colors.success, 0.08),
    },
    clockPanelEditing: {
      borderColor: colors.primary,
      backgroundColor: withAlpha(colors.primary, 0.08),
    },
    clockPanelHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    clockHeaderActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      flexShrink: 0,
    },
    clockTitleWrap: {
      flex: 1,
      gap: 2,
    },
    clockTitle: {
      ...typography.heading,
      color: colors.textMuted,
      fontWeight: "700",
      fontSize: 18,
    },
    clockTapHint: {
      ...typography.caption,
      color: colors.textDim,
      fontSize: 11,
    },
    resetBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    clockTapZone: {
      flex: 1,
      width: "100%",
      minHeight: 0,
      alignItems: "stretch",
      justifyContent: "center",
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    iconBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    actionsRow: {
      flexDirection: "row",
      flexShrink: 0,
      gap: spacing.md,
      alignItems: "stretch",
      minHeight: 56,
      marginTop: "auto",
    },
    buzzerBtn: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      minHeight: 56,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.error,
    },
    buzzerBtnActive: {
      backgroundColor: colors.error,
      transform: [{ scale: 0.98 }],
    },
    buzzerText: {
      ...typography.button,
      fontSize: 16,
      color: colors.onPrimary,
    },
    resetAllBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      minHeight: 56,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },
    resetAllText: {
      ...typography.caption,
      color: colors.textDim,
      fontWeight: "700",
      textAlign: "center",
    },
  });
}
