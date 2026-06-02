import { Platform, type ViewStyle } from "react-native";

export const colors = {
  background: "#0A0E14",
  surface: "#121820",
  surfaceVariant: "#202A36",
  surfaceContainerLowest: "#0D131A",
  surfaceContainerLow: "#151C25",
  surfaceContainer: "#1B2430",
  surfaceContainerHigh: "#243142",
  surfaceContainerHighest: "#2E3C50",
  card: "#1B2430",
  cardBorder: "#334155",
  primary: "#FF6B2C",
  onPrimary: "#241108",
  primaryContainer: "#5E260D",
  onPrimaryContainer: "#FFD8C7",
  primaryDark: "#E55A1F",
  secondary: "#FFD166",
  onSecondary: "#2C2100",
  secondaryContainer: "#4D3B00",
  onSecondaryContainer: "#FFE8A3",
  accent: "#3B82F6",
  tertiary: "#3B82F6",
  onTertiary: "#071526",
  tertiaryContainer: "#153B73",
  onTertiaryContainer: "#D6E6FF",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textDim: "#64748B",
  outline: "#64748B",
  outlineVariant: "#334155",
  inverseSurface: "#E2E8F0",
  inverseOnSurface: "#101720",
  scrim: "rgba(0, 0, 0, 0.45)",
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  onError: "#2A0606",
  errorContainer: "#5F1414",
  onErrorContainer: "#FFDAD6",
  teamA: "#FF6B2C",
  teamB: "#3B82F6",
  overlay: "rgba(10, 14, 20, 0.85)",
};

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
  xl: 28,
  xxl: 32,
  full: 999,
};

export const typography = {
  display: { fontSize: 36, fontWeight: "800" as const, letterSpacing: -0.6 },
  hero: { fontSize: 32, fontWeight: "800" as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.3 },
  headline: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.2 },
  heading: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: "500" as const },
  button: { fontSize: 14, fontWeight: "700" as const, letterSpacing: 0.1 },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
};

function createShadow(
  offset: { width: number; height: number },
  radius: number,
  opacity: number,
  elevation: number,
): ViewStyle {
  if (Platform.OS === "web") {
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px rgba(0, 0, 0, ${opacity})`,
    } as ViewStyle;
  }

  return {
    shadowColor: "#000",
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export const shadows = {
  level0: {},
  level1: createShadow({ width: 0, height: 1 }, 3, 0.18, 1),
  level2: createShadow({ width: 0, height: 2 }, 6, 0.2, 3),
  level3: createShadow({ width: 0, height: 4 }, 12, 0.24, 6),
  card: createShadow({ width: 0, height: 2 }, 8, 0.2, 3),
};
