import React from "react";
import { type PressableProps } from "react-native";
import { cn } from "../../lib/utils";
import { StyledPressable, StyledText } from "./styled";

/**
 * Chip — FigCraft `03 — Components` (chips: All / Low / Out).
 *
 * `default` (All)  card fill, border hairline, muted label
 * `success`        brandSoft fill, brand label (in stock)
 * `warning`        accentSoft fill, ink label (low)
 * `error`          dangerSoft fill, danger label (out)
 *
 * Active/selected styling and pressed feedback are not drawn; the selected
 * treatment (brand fill, card label) follows DESIGN.md §5 and is recorded as
 * derived in the parity report.
 */

export type ChipVariant = "default" | "success" | "warning" | "error";

export interface ChipProps extends Omit<PressableProps, "children"> {
  variant?: ChipVariant;
  isActive?: boolean;
  children: React.ReactNode;
}

const VARIANT: Record<ChipVariant, string> = {
  default: "bg-card border border-border",
  success: "bg-brand-soft border border-brand-soft",
  warning: "bg-accent-soft border border-accent-soft",
  error: "bg-danger-soft border border-danger-soft",
};

const VARIANT_TEXT: Record<ChipVariant, string> = {
  default: "text-muted",
  success: "text-brand",
  warning: "text-ink",
  error: "text-danger",
};

export function Chip({ children, variant = "default", isActive = false, className, ...props }: ChipProps) {
  const pressable = typeof props.onPress === "function";

  return (
    <StyledPressable
      accessibilityRole={pressable ? "button" : undefined}
      accessibilityState={pressable ? { selected: isActive } : undefined}
      className={cn(
        "min-h-[32px] flex-row items-center justify-center self-start rounded-pill border px-3 py-2",
        isActive ? "border-brand bg-brand" : VARIANT[variant],
        className,
      )}
      {...props}
    >
      <StyledText
        className={cn(
          "font-label text-label",
          isActive ? "text-card" : VARIANT_TEXT[variant],
        )}
      >
        {children}
      </StyledText>
    </StyledPressable>
  );
}
