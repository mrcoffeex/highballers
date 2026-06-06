import { Platform, type ViewStyle } from "react-native";

/**
 * HighBallers design tokens — Blue, Dark Gray & White
 *
 * Color science:
 * - Blue primary for CTAs, links, and focus; white onPrimary for 4.5:1+ contrast
 * - Dark gray surfaces in dark mode; white / light gray surfaces in light mode
 * - Slate tertiary for team B / secondary accents — keeps palette cohesive
 * - Gold secondary reserved for achievements (All-Star), not general UI chrome
 * - Neutral outline tokens for borders; brand blue via primary / borderAccent
 */

const brand = {
  blue: "#3B82F6",
  blueDark: "#2563EB",
  blueLight: "#60A5FA",
  slate: "#64748B",
  slateDark: "#475569",
  gold: "#F5B942",
  goldDark: "#C98E12",
} as const;

export const darkColors = {
  background: "#111827",
  surface: "#1F2937",
  surfaceVariant: "#374151",
  surfaceContainerLowest: "#0D1117",
  surfaceContainerLow: "#161B22",
  surfaceContainer: "#1C2128",
  surfaceContainerHigh: "#262C36",
  surfaceContainerHighest: "#30363D",
  card: "#1F2937",
  cardBorder: "#374151",
  borderAccent: brand.blue,
  primary: brand.blue,
  onPrimary: "#FFFFFF",
  primaryContainer: "#1E3A8A",
  onPrimaryContainer: "#DBEAFE",
  primaryDark: brand.blueDark,
  secondary: brand.gold,
  onSecondary: "#1F1600",
  secondaryContainer: "#3D3008",
  onSecondaryContainer: "#FFECC2",
  accent: brand.blueLight,
  tertiary: brand.slate,
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#334155",
  onTertiaryContainer: "#E2E8F0",
  text: "#F9FAFB",
  textMuted: "#9CA3AF",
  textDim: "#6B7280",
  outline: "#4B5563",
  outlineVariant: "#374151",
  inverseSurface: "#F3F4F6",
  inverseOnSurface: "#111827",
  scrim: "rgba(17, 24, 39, 0.62)",
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  onError: "#2A0606",
  errorContainer: "#5C1A1A",
  onErrorContainer: "#FFDAD6",
  teamA: brand.blue,
  teamB: brand.blueLight,
  overlay: "rgba(17, 24, 39, 0.88)",
  screenGradientEnd: "#1A1F2E",
  heroCard: "#1F2937",
  heroOvrPill: "#111827",
  link: brand.blueLight,
  focusRing: brand.blueLight,
  storyGradientStart: "#1E293B",
  storyGradientMid: "#111827",
  storyGradientEnd: "#172554",
} as const;

export const lightColors = {
  background: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceVariant: "#F3F4F6",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#FAFAFA",
  surfaceContainer: "#F3F4F6",
  surfaceContainerHigh: "#E5E7EB",
  surfaceContainerHighest: "#D1D5DB",
  card: "#FFFFFF",
  cardBorder: "#E5E7EB",
  borderAccent: brand.blueDark,
  primary: brand.blueDark,
  onPrimary: "#FFFFFF",
  primaryContainer: "#DBEAFE",
  onPrimaryContainer: "#1E40AF",
  primaryDark: "#1D4ED8",
  secondary: brand.goldDark,
  onSecondary: "#FFFFFF",
  secondaryContainer: "#FFF4D6",
  onSecondaryContainer: "#5C4208",
  accent: brand.blue,
  tertiary: brand.slateDark,
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#E2E8F0",
  onTertiaryContainer: "#334155",
  text: "#111827",
  textMuted: "#6B7280",
  textDim: "#9CA3AF",
  outline: "#D1D5DB",
  outlineVariant: "#E5E7EB",
  inverseSurface: "#111827",
  inverseOnSurface: "#F9FAFB",
  scrim: "rgba(17, 24, 39, 0.45)",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
  onError: "#FFFFFF",
  errorContainer: "#FEE2E2",
  onErrorContainer: "#991B1B",
  teamA: brand.blueDark,
  teamB: brand.blue,
  overlay: "rgba(17, 24, 39, 0.55)",
  screenGradientEnd: "#F3F4F6",
  heroCard: "#FFFFFF",
  heroOvrPill: "#F9FAFB",
  link: brand.blueDark,
  focusRing: brand.blueDark,
  storyGradientStart: "#E5E7EB",
  storyGradientMid: "#F9FAFB",
  storyGradientEnd: "#DBEAFE",
} as const;

export function getStoryGradient(
  colors: ThemeColors,
): [string, string, string] {
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
      card: createShadow({ width: 0, height: 2 }, 12, 0.08, 2, "#111827"),
      level2: createShadow({ width: 0, height: 2 }, 8, 0.1, 2, "#111827"),
    };
  }
  return shadows;
}
