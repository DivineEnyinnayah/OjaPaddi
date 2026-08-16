import React from "react";
import { View, type ViewProps } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/utils";

const StyledView = withUniwind(View);

export interface SkeletonProps extends ViewProps {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <StyledView
      className={cn("bg-surface-container-high rounded-input animate-skeleton-pulse", className)}
      {...props}
    />
  );
}
