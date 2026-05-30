import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format, isToday, isTomorrow } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radius, spacing, typography } from "../lib/theme";

interface DateTimePickerFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

type PickerMode = "date" | "time";

interface Preset {
  id: string;
  label: string;
  date: Date;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeInputValue(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function applyDatePart(base: Date, dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const next = new Date(base);
  next.setFullYear(year, month - 1, day);
  return next;
}

function applyTimePart(base: Date, timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  const next = new Date(base);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function atTime(base: Date, hours: number, minutes = 0) {
  const next = new Date(base);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function nextWeekday(from: Date, weekday: number, hours: number, minutes = 0) {
  const next = new Date(from);
  const offset = (weekday - next.getDay() + 7) % 7 || 7;
  next.setDate(next.getDate() + offset);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function buildPresets(minimumDate: Date): Preset[] {
  const now = new Date();
  const presets: Preset[] = [];

  const tonight = atTime(now, 19);
  if (tonight.getTime() > minimumDate.getTime()) {
    presets.push({ id: "tonight", label: "Tonight", date: tonight });
  }

  const tomorrow = atTime(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
    19,
  );
  presets.push({ id: "tomorrow", label: "Tomorrow", date: tomorrow });

  const saturdayMorning = nextWeekday(now, 6, 10);
  presets.push({ id: "sat-am", label: "Sat 10 AM", date: saturdayMorning });

  const saturdayNight = nextWeekday(now, 6, 19);
  presets.push({ id: "sat-pm", label: "Sat 7 PM", date: saturdayNight });

  return presets;
}

function formatSummaryDate(date: Date) {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

function isSamePreset(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours() &&
    a.getMinutes() === b.getMinutes()
  );
}

function PickerSheet({
  visible,
  mode,
  value,
  minimumDate,
  onModeChange,
  onChange,
  onClose,
}: {
  visible: boolean;
  mode: PickerMode;
  value: Date;
  minimumDate?: Date;
  onModeChange: (mode: PickerMode) => void;
  onChange: (date: Date) => void;
  onClose: () => void;
}) {
  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      onClose();
      if (event.type === "dismissed" || !selected) return;
      onChange(selected);
      return;
    }

    if (selected) {
      onChange(selected);
    }
  };

  if (Platform.OS === "android") {
    if (!visible) return null;

    return (
      <DateTimePicker
        value={value}
        mode={mode}
        minimumDate={mode === "date" ? minimumDate : undefined}
        onChange={handleChange}
        display="default"
        themeVariant="dark"
      />
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.modalSheet}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule game</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.segmentRow}>
            <SegmentButton
              active={mode === "date"}
              label="Date"
              icon="calendar-outline"
              onPress={() => onModeChange("date")}
            />
            <SegmentButton
              active={mode === "time"}
              label="Time"
              icon="time-outline"
              onPress={() => onModeChange("time")}
            />
          </View>

          <View style={styles.pickerPreview}>
            <Text style={styles.pickerPreviewDate}>
              {format(value, "EEEE, MMMM d")}
            </Text>
            <Text style={styles.pickerPreviewTime}>
              {format(value, "h:mm a")}
            </Text>
          </View>

          <DateTimePicker
            value={value}
            mode={mode}
            minimumDate={mode === "date" ? minimumDate : undefined}
            onChange={handleChange}
            display="spinner"
            themeVariant="dark"
            style={styles.iosPicker}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SegmentButton({
  active,
  label,
  icon,
  onPress,
}: {
  active: boolean;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? colors.primary : colors.textMuted}
      />
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const webHiddenInputStyle = {
  position: "absolute" as const,
  opacity: 0,
  width: 1,
  height: 1,
  pointerEvents: "none" as const,
};

export function DateTimePickerField({
  value,
  onChange,
  minimumDate,
}: DateTimePickerFieldProps) {
  const minDate = minimumDate ?? new Date();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>("date");
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const presets = useMemo(() => buildPresets(minDate), [minDate]);
  const isValid = value.getTime() > minDate.getTime();
  const activePresetId = presets.find((preset) =>
    isSamePreset(preset.date, value),
  )?.id;

  const openPicker = (mode: PickerMode) => {
    setPickerMode(mode);
    setPickerOpen(true);
  };

  const openWebPicker = (mode: PickerMode) => {
    const input = mode === "date" ? dateInputRef.current : timeInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  };

  const handleTilePress = (mode: PickerMode) => {
    if (Platform.OS === "web") {
      openWebPicker(mode);
      return;
    }

    if (Platform.OS === "android") {
      openPicker(mode);
      return;
    }

    openPicker(mode);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[`${colors.primary}22`, `${colors.accent}12`, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="calendar" size={22} color={colors.primary} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{formatSummaryDate(value)}</Text>
            <Text style={styles.heroTitle}>{format(value, "h:mm a")}</Text>
            <Text style={styles.heroMeta}>
              {format(value, "EEEE · MMMM d, yyyy")}
            </Text>
          </View>
        </View>

        {!isValid ? (
          <View style={styles.warningRow}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
            <Text style={styles.warningText}>Pick a future date and time</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.tileRow}>
        <Pressable
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          onPress={() => handleTilePress("date")}
        >
          <View style={styles.tileIcon}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />
          </View>
          <Text style={styles.tileLabel}>Date</Text>
          <Text style={styles.tileValue}>{format(value, "MMM d, yyyy")}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          onPress={() => handleTilePress("time")}
        >
          <View style={styles.tileIcon}>
            <Ionicons name="time-outline" size={18} color={colors.accent} />
          </View>
          <Text style={styles.tileLabel}>Time</Text>
          <Text style={styles.tileValue}>{format(value, "h:mm a")}</Text>
        </Pressable>
      </View>

      <Text style={styles.presetsLabel}>Quick picks</Text>
      <View style={styles.presetsRow}>
        {presets.map((preset) => {
          const active = preset.id === activePresetId;

          return (
            <Pressable
              key={preset.id}
              onPress={() => onChange(preset.date)}
              style={[styles.presetChip, active && styles.presetChipActive]}
            >
              <Text
                style={[styles.presetText, active && styles.presetTextActive]}
              >
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {Platform.OS === "web" ? (
        <>
          <input
            ref={dateInputRef}
            type="date"
            value={toDateInputValue(value)}
            min={toDateInputValue(minDate)}
            onChange={(event) =>
              onChange(applyDatePart(value, event.target.value))
            }
            style={webHiddenInputStyle}
          />
          <input
            ref={timeInputRef}
            type="time"
            value={toTimeInputValue(value)}
            onChange={(event) =>
              onChange(applyTimePart(value, event.target.value))
            }
            style={webHiddenInputStyle}
          />
        </>
      ) : (
        <PickerSheet
          visible={pickerOpen}
          mode={pickerMode}
          value={value}
          minimumDate={minDate}
          onModeChange={setPickerMode}
          onChange={onChange}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  heroCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}35`,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: `${colors.primary}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  heroEyebrow: {
    ...typography.label,
    color: colors.primary,
    fontSize: 11,
  },
  heroTitle: {
    ...typography.title,
    color: colors.text,
    fontSize: 28,
    lineHeight: 32,
  },
  heroMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  warningText: {
    ...typography.caption,
    color: colors.error,
  },
  tileRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  tilePressed: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  tileLabel: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 10,
  },
  tileValue: {
    ...typography.heading,
    color: colors.text,
    fontSize: 15,
  },
  presetsLabel: {
    ...typography.label,
    color: colors.textDim,
    fontSize: 10,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  presetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  presetChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}18`,
  },
  presetText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  presetTextActive: {
    color: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.cardBorder,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.text,
  },
  doneText: {
    ...typography.heading,
    color: colors.primary,
    fontSize: 16,
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  segmentBtnActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  segmentLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  segmentLabelActive: {
    color: colors.primary,
  },
  pickerPreview: {
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: 2,
  },
  pickerPreviewDate: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pickerPreviewTime: {
    ...typography.heading,
    color: colors.text,
    fontSize: 22,
  },
  iosPicker: {
    height: 200,
  },
});
