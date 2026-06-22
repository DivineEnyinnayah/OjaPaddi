import React from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/utils";
import { useThemeColor } from "@/hooks/useThemeColor";

const StyledTextInput = withUniwind(TextInput);
const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, containerClassName, inputClassName, className, ...props }, ref) => {
    const colors = useThemeColor();

    return (
      <StyledView className={cn("w-full mb-4", containerClassName)}>
        {label && (
          <StyledText className="text-body-sm text-on-surface font-semibold mb-2 ml-1">
            {label}
          </StyledText>
        )}
        <StyledView
          className={cn(
            "w-full rounded-input border bg-surface-container-lowest px-4 h-12 justify-center",
            error ? "border-error" : "border-outline-variant",
            className
          )}
        >
          <StyledTextInput
            ref={ref}
            className={cn("flex-1 text-body-lg text-on-surface", inputClassName)}
            placeholderTextColor={colors.outline}
            {...props}
          />
        </StyledView>
        {error && (
          <StyledText className="text-body-sm text-error mt-1 ml-1">
            {error}
          </StyledText>
        )}
      </StyledView>
    );
  }
);

Input.displayName = "Input";
