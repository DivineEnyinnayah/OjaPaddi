import { useMemo } from "react";
import { useAppTheme } from "@/contexts/app-theme-context";
import { colorTokens } from "@/constants/tokens";

/**
 * Resolved colour values for the current theme.
 *
 * Keys mirror the FigCraft token board `01 — Color Tokens` exactly and the
 * `--color-*` names declared in `global.css`. Use this hook only for React
 * Native props that require a raw colour string (e.g. `<Icon color={} />`,
 * `placeholderTextColor`). All layout and styling should use the matching
 * uniwind classes (`bg-card`, `text-ink`, …).
 *
 * Values come from `constants/tokens.ts` — the single typed source of truth.
 */

export interface ThemeColors {
  background: string;
  card: string;
  ink: string;
  muted: string;
  brand: string;
  brandStrong: string;
  brandSoft: string;
  accent: string;
  accentSoft: string;
  mint: string;
  danger: string;
  dangerSoft: string;
  border: string;

  /** Status bar foreground; derived from surface luminance, not a colour token. */
  statusBarStyle: "light" | "dark";
}

function build(mode: "light" | "dark", statusBarStyle: "light" | "dark"): ThemeColors {
  return {
    background: colorTokens.background[mode],
    card: colorTokens.card[mode],
    ink: colorTokens.ink[mode],
    muted: colorTokens.muted[mode],
    brand: colorTokens.brand[mode],
    brandStrong: colorTokens.brandStrong[mode],
    brandSoft: colorTokens.brandSoft[mode],
    accent: colorTokens.accent[mode],
    accentSoft: colorTokens.accentSoft[mode],
    mint: colorTokens.mint[mode],
    danger: colorTokens.danger[mode],
    dangerSoft: colorTokens.dangerSoft[mode],
    border: colorTokens.border[mode],
    statusBarStyle,
  };
}

const LIGHT = build("light", "dark");
const DARK = build("dark", "light");

export function useThemeColor(): ThemeColors {
  const { isDark } = useAppTheme();
  return useMemo(() => (isDark ? DARK : LIGHT), [isDark]);
}
