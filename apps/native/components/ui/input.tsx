import React from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/utils";

const StyledTextInput = withUniwind(TextInput);

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ label, error, containerClassName, inputClassName, className, ...props }, ref) => {
    return (
      <View className={cn("w-full mb-4", containerClassName)}>
        {label && (
          <Text className="text-body-sm text-on-surface font-semibold mb-2 ml-1">
            {label}
          </Text>
        )}
        <View
          className={cn(
            "w-full rounded-input border bg-surface-container-lowest px-4 h-12 justify-center",
            error ? "border-error" : "border-outline-variant",
            className
          )}
        >
          <StyledTextInput
            ref={ref}
            className={cn("flex-1 text-body-lg text-on-surface", inputClassName)}
            placeholderTextColor="#8a9389" // outline color as placeholder
            {...props}
          />
        </View>
        {error && (
          <Text className="text-body-sm text-error mt-1 ml-1">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
