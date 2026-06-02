import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ClockMaskInput } from "./ClockMaskInput";
import {
  DEFAULT_QUARTER_MINUTES,
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
import { colors, radius, spacing, typography } from "../lib/theme";

const QUARTER_PRESETS = [8, 10, 12] as const;

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
  onOpen: () => void;
  onClose: () => void;
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

function PresetGrid({ children }: { children: ReactNode }) {
  return <View style={styles.presetGrid}>{children}</View>;
}

function PresetCell({
  label,
  active,
  onPress,
  isInput,
  onBlurMinutes,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  isInput?: boolean;
  onBlurMinutes?: (minutes: number) => void;
}) {
  if (isInput) {
    return (
      <View style={styles.presetCell}>
        <TextInput
          style={styles.qInput}
          keyboardType="number-pad"
          defaultValue={label}
          key={`q-input-${label}`}
          placeholder={String(DEFAULT_QUARTER_MINUTES)}
          placeholderTextColor={colors.textDim}
          maxLength={2}
          onEndEditing={(event) => {
            const parsed = Number.parseInt(event.nativeEvent.text, 10);
            if (!Number.isNaN(parsed) && onBlurMinutes) {
              onBlurMinutes(parsed);
            }
          }}
        />
      </View>
    );
  }

  if (!onPress) {
    return <View style={[styles.presetCell, styles.presetCellSpacer]} />;
  }

  return (
    <Pressable
      style={[styles.presetCell, active && styles.presetCellActive]}
      onPress={onPress}
    >
      <Text style={[styles.presetCellText, active && styles.presetCellTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function QuarterLengthRow({
  quarterMinutes,
  onSetQuarterMinutes,
}: {
  quarterMinutes: number;
  onSetQuarterMinutes: (minutes: number) => void;
}) {
  return (
    <View style={styles.quarterLengthSection}>
      <Text style={styles.sectionLabel}>Minutes per quarter</Text>
      <PresetGrid>
        {QUARTER_PRESETS.map((minutes) => (
          <PresetCell
            key={minutes}
            label={`${minutes} min`}
            active={quarterMinutes === minutes}
            onPress={() => onSetQuarterMinutes(minutes)}
          />
        ))}
        <PresetCell
          label={String(quarterMinutes)}
          isInput
          onBlurMinutes={(minutes) =>
            onSetQuarterMinutes(
              Math.min(
                MAX_QUARTER_MINUTES,
                Math.max(MIN_QUARTER_MINUTES, minutes),
              ),
            )
          }
        />
      </PresetGrid>
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
  footer,
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
  footer?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <View
      style={[
        styles.clockPanel,
        running && styles.clockPanelRunning,
        editing && styles.clockPanelEditing,
      ]}
    >
      <View style={styles.clockPanelHeader}>
        <View style={styles.clockTitleWrap}>
          <Text style={styles.clockTitle}>{title}</Text>
          {!editing ? (
            <Text style={styles.clockTapHint}>
              {running ? "Running · tap below to pause" : "Tap below to start"}
            </Text>
          ) : (
            <Text style={styles.clockTapHint}>Edit time · tap OK when done</Text>
          )}
        </View>
        <Pressable
          style={styles.resetBtn}
          onPress={onReset}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Reset ${title}`}
        >
          <Ionicons name="refresh" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable
        style={[
          styles.clockPanelTapZone,
          compact && styles.clockTimeSectionCompact,
        ]}
        onPress={editing ? undefined : onToggle}
        pointerEvents={editing ? "box-none" : "auto"}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={
          editing ? undefined : running ? "Tap to pause" : "Tap to start"
        }
        accessibilityState={{ disabled: editing }}
      >
        <ClockMaskInput
          seconds={seconds}
          maxSeconds={maxSeconds}
          running={running}
          warning={warning}
          shotClockMode={shotClockMode}
          onCommit={onSetSeconds}
          onEditingChange={setEditing}
        />
      </Pressable>

      {footer ? (
        <View style={styles.clockFooterSection}>{footer}</View>
      ) : null}
    </View>
  );
}

export function ScoreboardDrawer({
  visible,
  onOpen,
  onClose,
  teamALabel = "Team A",
  teamBLabel = "Team B",
  controls,
}: ScoreboardDrawerProps) {
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
  const gameWarning = state.gameClockSeconds <= 60 && state.gameClockSeconds > 0;
  const shotWarning = state.shotClockSeconds <= 5 && state.shotClockSeconds > 0;
  const gameExpired = state.gameClockSeconds === 0;
  const shotExpired = state.shotClockSeconds === 0;

  return (
    <>
      {!visible ? (
        <Pressable
          style={[styles.fab, { top: insets.top + 56 }]}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel="Open scoreboard"
        >
          <Ionicons name="timer-outline" size={24} color={colors.text} />
          <Text style={styles.fabText}>Clock</Text>
        </Pressable>
      ) : null}

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <View
          style={[
            styles.fullScreen,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12} style={styles.headerSide}>
              <Ionicons name="chevron-down" size={24} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.headerTitle}>Scoreboard</Text>
            <View style={styles.headerSide} />
          </View>

          <View style={styles.body}>
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

            <View style={styles.clocksColumn}>
              <View style={styles.periodSection}>
                <Text style={styles.sectionLabel}>Period</Text>
                <View style={styles.periodBar}>
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
                          state.period === period &&
                            styles.periodChipTextActive,
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
                </View>
              </View>

              <CompactClockPanel
                title="Game clock"
                seconds={state.gameClockSeconds}
                maxSeconds={gameMaxSeconds}
                running={state.gameRunning}
                warning={gameWarning || gameExpired}
                onSetSeconds={controls.setGameClockSeconds}
                onToggle={controls.toggleGameClock}
                onReset={controls.resetGameClock}
                footer={
                  <QuarterLengthRow
                    quarterMinutes={state.quarterMinutes}
                    onSetQuarterMinutes={controls.setQuarterMinutes}
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
                compact
                onSetSeconds={controls.setShotClockSeconds}
                onToggle={controls.toggleShotClock}
                onReset={() => controls.resetShotClock()}
                footer={
                  <View style={styles.shotPresetSection}>
                    <Text style={styles.sectionLabel}>Shot preset</Text>
                    <PresetGrid>
                      {SHOT_CLOCK_PRESETS.map((seconds) => (
                        <PresetCell
                          key={seconds}
                          label={`${seconds} sec`}
                          active={state.defaultShotClockSeconds === seconds}
                          onPress={() => controls.resetShotClock(seconds)}
                        />
                      ))}
                    </PresetGrid>
                  </View>
                }
              />
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={[
                  styles.buzzerBtn,
                  buzzerHolding && styles.buzzerBtnActive,
                ]}
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
                <Ionicons name="megaphone" size={32} color={colors.text} />
                <Text style={styles.buzzerText}>
                  {buzzerHolding ? "Buzzing…" : "Hold buzzer"}
                </Text>
              </Pressable>
              <Pressable style={styles.resetAllBtn} onPress={controls.resetAll}>
                <Text style={styles.resetAllText}>Reset all</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
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
  body: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  fab: {
    position: "absolute",
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    borderTopLeftRadius: radius.md,
    borderBottomLeftRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.cardBorder,
  },
  fabText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  scoresRow: {
    flexDirection: "row",
    minHeight: 108,
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
    fontSize: 40,
    lineHeight: 44,
    textAlign: "center",
  },
  scoreBtns: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  clocksColumn: {
    flex: 1,
    flexDirection: "column",
    gap: spacing.sm,
    minHeight: 0,
    width: "100%",
  },
  periodSection: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textDim,
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  quarterLengthSection: {
    width: "100%",
    gap: spacing.xs,
  },
  shotPresetSection: {
    width: "100%",
    gap: spacing.xs,
  },
  periodBar: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.sm,
    height: 48,
  },
  periodChip: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  periodChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}22`,
  },
  periodNextChip: {
    flex: 0,
    width: 48,
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
  clockPanelRunning: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}12`,
  },
  clockPanelEditing: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  clockPanelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
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
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  clockPanelTapZone: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 76,
    borderRadius: radius.md,
  },
  clockTimeSectionCompact: {
    minHeight: 56,
  },
  clockFooterSection: {
    minHeight: 32,
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
  presetGrid: {
    flexDirection: "row",
    gap: spacing.xs,
    width: "100%",
  },
  presetCell: {
    flex: 1,
    minHeight: 36,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  presetCellActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}22`,
  },
  presetCellSpacer: {
    opacity: 0,
    borderWidth: 0,
  },
  presetCellText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "700",
  },
  presetCellTextActive: {
    color: colors.primary,
  },
  qInput: {
    width: "100%",
    height: "100%",
    color: colors.text,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    padding: 0,
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "stretch",
    height: 64,
  },
  buzzerBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.error,
  },
  buzzerBtnActive: {
    backgroundColor: "#C62828",
    transform: [{ scale: 0.98 }],
  },
  buzzerText: {
    ...typography.hero,
    fontSize: 28,
    lineHeight: 32,
    color: colors.text,
    fontWeight: "800",
  },
  resetAllBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
  },
  resetAllText: {
    ...typography.caption,
    color: colors.textDim,
    fontWeight: "700",
  },
});
