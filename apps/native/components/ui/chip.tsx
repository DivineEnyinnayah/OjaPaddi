import { type ViewProps } from "react-native";
import { cn } from "../../lib/utils";
import { StyledView, StyledText } from "./styled";

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
    success: "bg-success-container border-primary/30",
    warning: "bg-secondary-container border-secondary/40",
    error: "bg-error-container border-error/40",
    default: "bg-surface-container-low border-outline-variant",
  };

  const textStyles = {
    success: "text-on-success-container",
    warning: "text-secondary",
    error: "text-on-error-container",
    default: "text-on-surface-variant",
  };
  return (
    <StyledView
      className={cn(
        "rounded-full px-3 py-1.5 border self-start items-center justify-center min-h-[32px]",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <StyledText className={cn("text-label-caps", textStyles[variant])}>
        {children}
      </StyledText>
    </StyledView>
  );
}
