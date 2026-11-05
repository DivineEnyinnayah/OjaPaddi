import { useMemo } from "react";
import { useAppTheme } from "@/contexts/app-theme-context";

/**
 * Resolved colour values for the current theme.
 *
 * Keys mirror the FigCraft token board `01 — Color Tokens` exactly
 * (collection "OjaPaddi Redesign", modes Light / Dark) and the
 * `--color-*` names declared in `global.css`. Use this hook only for React
 * Native props that require a raw colour string (e.g. `<Icon color={} />`,
 * `<ActivityIndicator color={} />`, `placeholderTextColor`). All layout and
 * styling should use the matching uniwind classes (`bg-card`, `text-ink`, …).
 *
 * No value here may be invented: every entry traces to a FigCraft token.
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

const LIGHT: ThemeColors = {
  background: "#FAFAF7",
  card: "#FFFFFF",
  ink: "#14201C",
  muted: "#5C6B66",
  brand: "#1F6F5C",
  brandStrong: "#154E40",
  brandSoft: "#E7F1EC",
  accent: "#D97706",
  accentSoft: "#FDE9C8",
  mint: "#A7D9BE",
  danger: "#B42318",
  dangerSoft: "#FDE8E4",
  border: "#E4E2DA",
  statusBarStyle: "dark",
};

const DARK: ThemeColors = {
  background: "#0F130F",
  card: "#1D241F",
  ink: "#EAF0EC",
  muted: "#9AA6A0",
  brand: "#79C7A0",
  brandStrong: "#A7D9BE",
  brandSoft: "#17251D",
  accent: "#F2B84B",
  accentSoft: "#332408",
  mint: "#A7D9BE",
  danger: "#FF8A7A",
  dangerSoft: "#331B19",
  border: "#262D29",
  statusBarStyle: "light",
};

export function useThemeColor(): ThemeColors {
  const { isDark } = useAppTheme();
  return useMemo(() => (isDark ? DARK : LIGHT), [isDark]);
}
