import { Platform, type ViewStyle } from "react-native";

/**
 * HighBallers design tokens — Court Midnight & Hoop Flame
 *
 * Color science:
 * - Warm orange primary (~L*55) for energy; white/dark-cream onPrimary for 4.5:1+ contrast
 * - Teal tertiary for team B / links — split-complement to orange, reduces visual fatigue vs blue+orange
 * - Gold secondary reserved for achievements (All-Star), not general UI chrome
 * - Neutral outline tokens for borders; brand orange via primary / borderAccent for focus & CTAs
 * - Dark surfaces use blue-navy undertone (not flat gray) for depth on OLED
 * - Light surfaces use warm paper neutrals (not sterile #FFF gray screens)
 */

const brand = {
  hoop: "#F0642F",
  hoopDark: "#D4521F",
  hoopLight: "#FF8A5C",
  gold: "#F5B942",
  goldDark: "#C98E12",
  courtTeal: "#2EC4B6",
  courtTealDark: "#1FA89C",
} as const;

export const darkColors = {
  background: "#0B0F14",
  surface: "#141B24",
  surfaceVariant: "#1E2834",
  surfaceContainerLowest: "#090C10",
  surfaceContainerLow: "#111820",
  surfaceContainer: "#171F2A",
  surfaceContainerHigh: "#1F2937",
  surfaceContainerHighest: "#283445",
  card: "#171F2A",
  cardBorder: "#2F3D4D",
  borderAccent: brand.hoop,
  primary: brand.hoop,
  onPrimary: "#FFF7F2",
  primaryContainer: "#4A2210",
  onPrimaryContainer: "#FFDCC8",
  primaryDark: brand.hoopDark,
  secondary: brand.gold,
  onSecondary: "#1F1600",
  secondaryContainer: "#3D3008",
  onSecondaryContainer: "#FFECC2",
  accent: brand.courtTeal,
  tertiary: brand.courtTeal,
  onTertiary: "#042220",
  tertiaryContainer: "#0D3D38",
  onTertiaryContainer: "#B8F5EF",
  text: "#F4F7FB",
  textMuted: "#9BA8B8",
  textDim: "#6B7A8C",
  outline: "#4A5C6E",
  outlineVariant: "#2F3D4D",
  inverseSurface: "#E8EDF2",
  inverseOnSurface: "#0B0F14",
  scrim: "rgba(5, 8, 12, 0.62)",
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  onError: "#2A0606",
  errorContainer: "#5C1A1A",
  onErrorContainer: "#FFDAD6",
  teamA: brand.hoop,
  teamB: brand.courtTeal,
  overlay: "rgba(5, 8, 12, 0.88)",
  screenGradientEnd: "#121A24",
  heroCard: "#141B24",
  heroOvrPill: "#0E141C",
  link: brand.courtTeal,
  focusRing: brand.hoopLight,
  storyGradientStart: "#1A2332",
  storyGradientMid: "#0B0F14",
  storyGradientEnd: "#0F2A2E",
} as const;

export const lightColors = {
  background: "#F6F4F1",
  surface: "#FFFFFF",
  surfaceVariant: "#EDE8E2",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#FAF8F5",
  surfaceContainer: "#F3F0EB",
  surfaceContainerHigh: "#E8E2DA",
  surfaceContainerHighest: "#DDD6CC",
  card: "#FFFFFF",
  cardBorder: "#E0D9CF",
  borderAccent: brand.hoop,
  primary: brand.hoop,
  onPrimary: "#FFFFFF",
  primaryContainer: "#FFE8DC",
  onPrimaryContainer: "#6B2D12",
  primaryDark: brand.hoopDark,
  secondary: brand.goldDark,
  onSecondary: "#FFFFFF",
  secondaryContainer: "#FFF4D6",
  onSecondaryContainer: "#5C4208",
  accent: brand.courtTealDark,
  tertiary: brand.courtTealDark,
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#D4F7F3",
  onTertiaryContainer: "#0D4A44",
  text: "#1A2332",
  textMuted: "#5C6B7A",
  textDim: "#8A97A6",
  outline: "#C9C0B4",
  outlineVariant: "#E0D9CF",
  inverseSurface: "#1A2332",
  inverseOnSurface: "#F6F4F1",
  scrim: "rgba(26, 35, 50, 0.45)",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
  onError: "#FFFFFF",
  errorContainer: "#FEE2E2",
  onErrorContainer: "#991B1B",
  teamA: brand.hoop,
  teamB: brand.courtTealDark,
  overlay: "rgba(26, 35, 50, 0.55)",
  screenGradientEnd: "#EDE8E2",
  heroCard: "#FFFFFF",
  heroOvrPill: "#FAF8F5",
  link: brand.courtTealDark,
  focusRing: brand.hoop,
  storyGradientStart: "#EDE8E2",
  storyGradientMid: "#F6F4F1",
  storyGradientEnd: "#D4F7F3",
} as const;

export function getStoryGradient(colors: ThemeColors): [string, string, string] {
  return [
    colors.storyGradientStart,
    colors.storyGradientMid,
    colors.storyGradientEnd,
  ];
}

export type ThemeColors = {
  [K in keyof typeof darkColors]: string;
};

export type ColorScheme = "light" | "dark";
export type ThemePreference = "system" | "light" | "dark";

/** @deprecated Use `useTheme().colors` for theme-aware UI. */
export const colors: ThemeColors = { ...darkColors };

export function getColorsForScheme(scheme: ColorScheme): ThemeColors {
  return { ...(scheme === "light" ? lightColors : darkColors) };
}

/** Apply alpha to #RRGGBB hex (for tinted surfaces). */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const clamped = Math.min(1, Math.max(0, alpha));
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalized}${a}`;
}

export function getScreenGradient(colors: ThemeColors): [string, string] {
  return [colors.background, colors.screenGradientEnd];
}

export function getAuthGradient(colors: ThemeColors): [string, string, string] {
  return [colors.background, colors.surfaceContainer, colors.background];
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const typography = {
  display: {
    fontSize: 34,
    fontWeight: "800" as const,
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  hero: {
    fontSize: 30,
    fontWeight: "800" as const,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: -0.35,
    lineHeight: 28,
  },
  headline: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: -0.25,
    lineHeight: 26,
  },
  heading: {
    fontSize: 17,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  button: {
    fontSize: 15,
    fontWeight: "700" as const,
    letterSpacing: 0.15,
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: "600" as const,
    letterSpacing: 0.6,
    textTransform: "uppercase" as const,
    lineHeight: 14,
  },
};

function createShadow(
  offset: { width: number; height: number },
  shadowRadius: number,
  opacity: number,
  elevation: number,
  shadowColor = "#000",
): ViewStyle {
  if (Platform.OS === "web") {
    const [r, g, b] = hexToRgb(shadowColor);
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${shadowRadius}px rgba(${r}, ${g}, ${b}, ${opacity})`,
    } as ViewStyle;
  }

  return {
    shadowColor,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius,
    elevation,
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace("#", "");
  const full = n.length === 6 ? n : "000000";
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export const shadows = {
  level0: {},
  level1: createShadow({ width: 0, height: 1 }, 2, 0.12, 1),
  level2: createShadow({ width: 0, height: 2 }, 6, 0.14, 2),
  level3: createShadow({ width: 0, height: 4 }, 12, 0.16, 4),
  card: createShadow({ width: 0, height: 2 }, 10, 0.1, 2),
};

export function getShadowsForScheme(scheme: ColorScheme) {
  if (scheme === "light") {
    return {
      ...shadows,
      card: createShadow({ width: 0, height: 2 }, 12, 0.08, 2, "#1A2332"),
      level2: createShadow({ width: 0, height: 2 }, 8, 0.1, 2, "#1A2332"),
    };
  }
  return shadows;
}
