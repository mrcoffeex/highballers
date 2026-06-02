# HighBallers Design System

## Brand: Court Midnight & Hoop Flame

Premium basketball social app — energetic, trustworthy, readable in sun and at night.

## Color roles

| Token | Role |
|-------|------|
| `primary` | Hoop Flame `#F0642F` — CTAs, active nav, key actions |
| `secondary` | Championship Gold — All-Star, achievements only |
| `tertiary` / `accent` | Court Teal — team B, links, secondary actions |
| `outline` / `outlineVariant` | Neutral borders (never use primary for every border) |
| `borderAccent` | Brand border for selected chips / emphasis |
| `background` → `screenGradientEnd` | Screen vertical gradients |

## Rules

1. **Borders**: Default `outlineVariant`; active/focus `borderAccent` or `primary`.
2. **Text**: `text` body, `textMuted` supporting, `textDim` placeholders only.
3. **Surfaces**: Prefer `surface` / `surfaceContainer` elevation ladder; avoid pure `#000` except media overlays.
4. **Theme**: Always `useTheme()` + `useThemedStyles()` in new UI; never `StyleSheet.create` with static `colors` at module scope.
5. **Gradients**: Use `getScreenGradient(colors)` / `getAuthGradient(colors)` from `lib/theme.ts`.

## Typography scale

`display` → `hero` → `title` → `headline` → `heading` → `body` → `bodySmall` → `caption` → `label`

## Spacing

`xs` 4 · `sm` 8 · `md` 16 · `lg` 24 · `xl` 32 · `xxl` 48

## Radius

Cards `xl` (20) · buttons `full` · inputs `md`
