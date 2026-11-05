import React from "react";
import { type TextInput, type TextInputProps } from "react-native";
import { cn } from "../../lib/utils";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StyledView, StyledText, StyledTextInput } from "./styled";

/**
 * Input — FigCraft `03 — Components` (fields) and the sign-in frame
 * (`02` EMAIL box): card fill, 1px border, radius 14, 54px tall.
 * Focus/error states are not drawn; derived values are documented in the
 * parity report. Error uses `dangerSoft` fill + `danger` stroke per the
 * sign-in error banner treatment.
 */

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      containerClassName,
      inputClassName,
      className,
      accessibilityLabel,
      ...props
    },
    ref,
  ) => {
    const colors = useThemeColor();

    return (
      <StyledView className={cn("w-full", containerClassName)}>
        {label ? (
          <StyledText
            className="mb-2 font-label text-micro uppercase tracking-wide text-muted"
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {label}
          </StyledText>
        ) : null}
        <StyledView
          className={cn(
            "w-full min-h-[54px] justify-center rounded-input border px-4",
            error
              ? "border-danger bg-danger-soft"
              : "border-border bg-card",
            className,
          )}
        >
          <StyledTextInput
            ref={ref}
            className={cn("flex-1 py-3 font-body text-body text-ink", inputClassName)}
            placeholderTextColor={colors.muted}
            accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
            accessibilityState={{ invalid: !!error }}
            aria-invalid={!!error}
            {...props}
          />
        </StyledView>
        {error ? (
          <StyledText
            className="mt-2 ml-1 font-body text-body-sm text-danger"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {error}
          </StyledText>
        ) : null}
      </StyledView>
    );
  },
);

Input.displayName = "Input";
