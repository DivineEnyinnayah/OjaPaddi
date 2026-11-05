/**
 * Design tokens — the typed mirror of the FigCraft file
 * `ojapaddi-design.figcraft` → page `01 Redesign — Design System`.
 *
 * Source boards:
 *   01 — Color Tokens  (12 colours × Light/Dark, sRGB)
 *   02 — Type & Space  (family roles, type scale, radii, 4px grid)
 *
 * This module and `global.css` are the same contract: any change to one must
 * be made in the other. No value here may be invented — every entry traces to
 * a FigCraft token.
 */

export const colorTokens = {
  background: { light: "#FAFAF7", dark: "#0F130F" },
  card: { light: "#FFFFFF", dark: "#1D241F" },
  ink: { light: "#14201C", dark: "#EAF0EC" },
  muted: { light: "#5C6B66", dark: "#9AA6A0" },
  brand: { light: "#1F6F5C", dark: "#79C7A0" },
  brandStrong: { light: "#154E40", dark: "#A7D9BE" },
  brandSoft: { light: "#E7F1EC", dark: "#17251D" },
  accent: { light: "#D97706", dark: "#F2B84B" },
  accentSoft: { light: "#FDE9C8", dark: "#332408" },
  mint: { light: "#A7D9BE", dark: "#A7D9BE" },
  danger: { light: "#B42318", dark: "#FF8A7A" },
  dangerSoft: { light: "#FDE8E4", dark: "#331B19" },
  border: { light: "#E4E2DA", dark: "#262D29" },
} as const;

export type ColorTokenName = keyof typeof colorTokens;
export type ThemeMode = "light" | "dark";

/** FigCraft `02 — Type & Space`: family roles. */
export const fontFamily = {
  display: "LeagueSpartan_800ExtraBold",
  title: "LeagueSpartan_700Bold",
  body: "HankenGrotesk_400Regular",
  label: "HankenGrotesk_600SemiBold",
  ledger: "IBMPlexMono_400Regular",
} as const;

/** FigCraft `02 — Type & Space`: type scale (size / line-height). */
export const typeScale = {
  display: { fontSize: 48, lineHeight: 44 },
  hero: { fontSize: 34, lineHeight: 36 },
  title: { fontSize: 26, lineHeight: 30 },
  section: { fontSize: 22, lineHeight: 28 },
  cardTitle: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySm: { fontSize: 14, lineHeight: 21 },
  label: { fontSize: 12, lineHeight: 16 },
  micro: { fontSize: 11, lineHeight: 16 },
  ledger: { fontSize: 14, lineHeight: 18 },
} as const;

export type TypeScaleName = keyof typeof typeScale;

/** FigCraft `02 — Type & Space`: corner radii. */
export const radius = {
  card: 18,
  button: 14,
  input: 14,
  appIcon: 26,
  pill: 999,
} as const;

/** FigCraft `02 — Type & Space`: 4px grid + 24px page gutter. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  gutter: 24,
} as const;

export type SpacingName = keyof typeof spacing;

/** Layout constants from FigCraft controls: heights + minimum touch target. */
export const controlHeight = {
  control: 48,
  primaryButton: 56,
  listRow: 64,
  tabBar: 68,
  /** WCAG AA / FigCraft §7 minimum touch target. */
  minTouchTarget: 48,
} as const;
