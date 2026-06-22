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
    primary: "bg-surface-container-lowest shadow-sm shadow-black/5",
    secondary: "bg-surface-container-lowest shadow-md",
    outline: "bg-surface-container-lowest shadow-md ",
    "primary-solid": "bg-primary",
    "secondary-solid": "bg-secondary-container",
    warning: "bg-error-container border border-error/30",
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
