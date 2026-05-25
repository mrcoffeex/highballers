export const colors = {
  background: '#0A0E14',
  surface: '#151B26',
  card: '#1E2736',
  cardBorder: '#2A3548',
  primary: '#FF6B2C',
  primaryDark: '#E55A1F',
  secondary: '#FFD166',
  accent: '#3B82F6',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  teamA: '#FF6B2C',
  teamB: '#3B82F6',
  overlay: 'rgba(10, 14, 20, 0.85)',
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
  xl: 24,
  full: 999,
};

export const typography = {
  hero: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};
