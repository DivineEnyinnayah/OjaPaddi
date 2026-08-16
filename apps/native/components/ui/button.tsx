import React from "react";
import { type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { cn } from "../../lib/utils";
import { StyledPressable, StyledText } from "./styled";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "accent";
  isDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: React.ReactNode;
}

export function Button({
  children,
  size = "md",
  variant = "primary",
  isDisabled = false,
  style,
  className,
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: "px-3 py-1.5 h-9",
    md: "px-4 py-2.5 h-12",
    lg: "px-6 py-4 h-14",
  };

  const variantStyles = {
    primary: "bg-primary border border-primary",
    secondary: "bg-transparent border border-primary",
    accent: "bg-secondary-container border border-secondary-container",
  };

  const textSizeStyles = {
    sm: "text-body-sm font-semibold text-center",
    md: "text-body-lg font-semibold text-center",
    lg: "text-h2 text-center",
  };

  const textVariantStyles = {
    primary: "text-on-primary",
    secondary: "text-primary",
    accent: "text-on-secondary-container",
  };

  return (
    <StyledPressable
      disabled={isDisabled}
      className={cn(
        "justify-center items-center flex-row rounded-button",
        sizeStyles[size],
        variantStyles[variant],
        isDisabled && "opacity-50",
        className
      )}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
          opacity: pressed && !isDisabled ? 0.9 : 1,
        },
        style as ViewStyle,
      ]}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <StyledText className={cn(textSizeStyles[size], textVariantStyles[variant])}>
          {children}
        </StyledText>
      ) : (
        children
      )}
    </StyledPressable>
  );
}
