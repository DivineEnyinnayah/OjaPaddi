import React from "react";
import { type TextProps } from "react-native";
import { cn } from "../../lib/utils";
import { StyledText } from "./styled";
import { type TypographyVariant } from "@/constants/typography";

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant | "body-lg" | "body-sm" | "label-bold" | "label-caps";
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  display: "text-display font-bold text-on-surface",
  h1: "text-h1 font-bold text-on-surface",
  h2: "text-h2 font-semibold text-on-surface",
  h3: "text-h3 font-semibold text-on-surface",
  bodyLg: "text-body-lg font-normal text-on-surface",
  "body-lg": "text-body-lg font-normal text-on-surface",
  bodySm: "text-body-sm font-normal text-on-surface-variant",
  "body-sm": "text-body-sm font-normal text-on-surface-variant",
  labelBold: "text-label-bold font-semibold text-on-surface",
  "label-bold": "text-label-bold font-semibold text-on-surface",
  labelCaps: "text-label-caps font-bold text-on-surface-variant uppercase tracking-wider",
  "label-caps": "text-label-caps font-bold text-on-surface-variant uppercase tracking-wider",
};

export function Typography({
  variant = "bodyLg",
  className,
  children,
  ...props
}: TypographyProps) {
  const selectedStyle = variantStyles[variant] || variantStyles.bodyLg;

  return (
    <StyledText className={cn(selectedStyle, className)} {...props}>
      {children}
    </StyledText>
  );
}

export { Typography as Text };
