import React from "react";
import { View, Text, type ViewProps } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/utils";

const StyledView = withUniwind(View);

export interface ChipProps extends ViewProps {
  variant?: "success" | "warning" | "error" | "default";
  children: React.ReactNode;
}

export function Chip({
  children,
  variant = "default",
  className,
  ...props
}: ChipProps) {
  const variantStyles = {
    success: "bg-[#e8f5e9] border-[#c8e6c9]", // Using custom semantic literal or standard green if mapped
    warning: "bg-secondary-container border-secondary",
    error: "bg-error-container border-error",
    default: "bg-surface-container border-outline-variant",
  };

  const textStyles = {
    success: "text-[#2e7d32]",
    warning: "text-on-secondary-container",
    error: "text-on-error-container",
    default: "text-on-surface-variant",
  };

  return (
    <StyledView
      className={cn(
        "rounded-full px-3 py-1 border self-start",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <Text className={cn("text-label-caps", textStyles[variant])}>
        {children}
      </Text>
    </StyledView>
  );
}
