import React from "react";
import { View, type ViewProps } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/utils";

const StyledView = withUniwind(View);

/**
 * Skeleton — FigCraft `07 — States` (loading).
 * FigCraft specifies a fade (no pulse parallax). Reduced motion → static.
 */
export interface SkeletonProps extends ViewProps {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <StyledView
      className={cn("rounded-input bg-brand-soft", className)}
      {...props}
    />
  );
}
