import React from "react";
import {
  ActivityIndicator,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { cn } from "../../lib/utils";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StyledPressable, StyledText } from "./styled";

/**
 * Button — FigCraft `03 — Components` (buttons).
 *
 * Variants:        primary (accent fill, ink label), secondary (card fill,
 *                  brand border, brand label), ghost (no fill, brand label),
 *                  danger (danger fill, card label).
 * Heights:         primary 56 (FigCraft controls), others 48.
 * Interaction:     pressed / disabled / loading are not drawn in FigCraft;
 *                  derived values are documented in the parity report.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style" | "disabled"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDisabled?: boolean;
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: React.ReactNode;
}

const SIZE: Record<ButtonSize, string> = {
  sm: "px-4 min-h-12 rounded-button",
  md: "px-5 min-h-14 rounded-button",
  lg: "px-5 min-h-14 rounded-button",
};

const VARIANT: Record<ButtonVariant, { box: string; label: string }> = {
  primary: { box: "bg-accent", label: "text-ink" },
  secondary: { box: "bg-card border border-brand", label: "text-brand" },
  ghost: { box: "bg-transparent", label: "text-brand" },
  danger: { box: "bg-danger", label: "text-card" },
};

const LABEL_SIZE: Record<ButtonSize, string> = {
  sm: "text-label",
  md: "text-body",
  lg: "text-body",
};

export function Button({
  children,
  size = "md",
  variant = "primary",
  isDisabled = false,
  isLoading = false,
  style,
  className,
  ...props
}: ButtonProps) {
  const colors = useThemeColor();
  const disabled = isDisabled || isLoading;

  return (
    <StyledPressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: isLoading }}
      disabled={disabled}
      className={cn(
        "flex-row items-center justify-center gap-2",
        SIZE[size],
        VARIANT[variant].box,
        disabled && "opacity-50",
        className,
      )}
      style={({ pressed }) => [
        { opacity: pressed && !disabled ? 0.9 : disabled ? 0.5 : 1 },
        style as ViewStyle,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          accessibilityLabel="Loading"
          color={variant === "primary" ? colors.ink : colors.brand}
        />
      ) : typeof children === "string" || typeof children === "number" ? (
        <StyledText className={cn("text-center font-label", LABEL_SIZE[size], VARIANT[variant].label)}>
          {children}
        </StyledText>
      ) : (
        children
      )}
    </StyledPressable>
  );
}
