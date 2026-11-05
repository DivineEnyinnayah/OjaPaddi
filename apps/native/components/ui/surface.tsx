import React from "react";
import { View, type ViewProps } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/utils";

const StyledView = withUniwind(View);

export interface SurfaceProps extends ViewProps {
  variant?: "primary" | "secondary" | "outline" | "primary-solid" | "secondary-solid" | "warning";
  className?: string;
}

export function Surface({
  children,
  variant = "primary",
  className,
  ...props
}: SurfaceProps) {
  const variantStyles = {
    primary: "bg-surface-container-lowest border border-outline-variant/40",
    secondary: "bg-surface-container-low border border-primary/20",
    outline: "bg-surface-container-lowest border border-outline-variant",
    "primary-solid": "bg-primary",
    "secondary-solid": "bg-secondary",
    warning: "bg-error-container border border-error/40",
  };

  return (
    <StyledView
      className={cn(
        "rounded-card p-4",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </StyledView>
  );
}
