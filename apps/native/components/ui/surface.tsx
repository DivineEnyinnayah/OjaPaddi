import React from "react";
import { View, type ViewProps } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/utils";

const StyledView = withUniwind(View);

/**
 * Surface — FigCraft `03 — Components` (cards).
 *
 * `primary`   metric card: card fill, hairline border, radius 18
 * `hero`      hero card: brandStrong fill (one per screen)
 * `quiet`     brandSoft fill, no stroke
 * `warning`   accentSoft fill, accent stroke
 * `danger`    dangerSoft fill, danger stroke
 */
export type SurfaceVariant = "primary" | "hero" | "quiet" | "warning" | "danger";

export interface SurfaceProps extends ViewProps {
  variant?: SurfaceVariant;
  className?: string;
}

const VARIANT: Record<SurfaceVariant, string> = {
  primary: "bg-card border border-border",
  hero: "bg-brand-strong",
  quiet: "bg-brand-soft",
  warning: "bg-accent-soft border border-accent",
  danger: "bg-danger-soft border border-danger",
};

export function Surface({ children, variant = "primary", className, ...props }: SurfaceProps) {
  return (
    <StyledView className={cn("rounded-card p-4", VARIANT[variant], className)} {...props}>
      {children}
    </StyledView>
  );
}
