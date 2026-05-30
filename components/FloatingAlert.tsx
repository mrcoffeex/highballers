import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";

import { colors, radius, shadows, spacing, typography } from "../lib/theme";

export type FloatingAlertVariant = "success" | "error" | "info";

/** Distance from the bottom of the screen as a fraction of height (20%). */
const BOTTOM_OFFSET_RATIO = 0.2;

interface FloatingAlertProps {
  message: string | null;
  variant?: FloatingAlertVariant;
  duration?: number;
  /** Extra offset above the safe-area bottom (e.g. home indicator). */
  bottomInset?: number;
  onDismiss?: () => void;
}

const VARIANT_STYLES: Record<
  FloatingAlertVariant,
  {
    bg: string;
    border: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }
> = {
  success: {
    bg: `${colors.success}22`,
    border: `${colors.success}66`,
    icon: "checkmark-circle",
    color: colors.success,
  },
  error: {
    bg: `${colors.error}22`,
    border: `${colors.error}66`,
    icon: "alert-circle",
    color: colors.error,
  },
  info: {
    bg: `${colors.accent}22`,
    border: `${colors.accent}66`,
    icon: "information-circle",
    color: colors.accent,
  },
};

export function FloatingAlert({
  message,
  variant = "success",
  duration = 3200,
  bottomInset = 0,
  onDismiss,
}: FloatingAlertProps) {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [displayMessage, setDisplayMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleRef = useRef(false);

  const bottomOffset = windowHeight * BOTTOM_OFFSET_RATIO + bottomInset;
  const maxBannerWidth = windowWidth * 0.88;

  const runDismiss = useCallback(
    (notifyParent: boolean) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      if (!visibleRef.current) return;

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 12,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        visibleRef.current = false;
        setDisplayMessage(null);
        if (notifyParent) onDismiss?.();
      });
    },
    [onDismiss, opacity, translateY],
  );

  useEffect(() => {
    if (!message) {
      if (visibleRef.current) runDismiss(false);
      return;
    }

    if (hideTimer.current) clearTimeout(hideTimer.current);

    visibleRef.current = true;
    setDisplayMessage(message);
    opacity.setValue(0);
    translateY.setValue(14);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    hideTimer.current = setTimeout(() => {
      runDismiss(true);
    }, duration);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [message, duration, opacity, translateY, runDismiss]);

  if (!displayMessage) return null;

  const palette = VARIANT_STYLES[variant];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.host,
        {
          bottom: bottomOffset,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        onPress={() => runDismiss(true)}
        style={[
          styles.banner,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            maxWidth: maxBannerWidth,
          },
          shadows.card,
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Ionicons name={palette.icon} size={22} color={palette.color} />
        <Text style={styles.text}>{displayMessage}</Text>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
    elevation: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignSelf: "center",
  },
  text: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.text,
    flexShrink: 1,
  },
});
