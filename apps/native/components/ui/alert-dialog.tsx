import React from "react";
import { Modal, Pressable, View, Text, type ViewProps } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledPressable = withUniwind(Pressable);

export interface AlertDialogProps extends ViewProps {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AlertDialog({
  visible,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <StyledView className="flex-1 bg-black/50 justify-center px-6">
        <StyledPressable className="absolute inset-0 -z-10" onPress={onCancel} />
        <StyledView
          className="bg-surface-container-lowest rounded-card p-6 shadow-lg shadow-black/20"
          style={{ gap: message ? 12 : 8 }}
        >
          {title ? (
            <StyledText className="text-xl font-bold text-on-surface text-center">
              {title}
            </StyledText>
          ) : null}
          {message ? (
            <StyledText className="text-body-lg text-on-surface-variant text-center leading-6">
              {message}
            </StyledText>
          ) : null}
          {message ? <StyledView className="h-px bg-outline-variant my-1" /> : null}
          <StyledView style={{ gap: 10 }}>
            <StyledPressable
              onPress={onConfirm}
              className={cn(
                "py-3 rounded-button items-center justify-center",
                destructive ? "bg-error" : "bg-primary"
              )}
              accessible
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <StyledText
                className={cn(
                  "text-body-lg font-semibold",
                  destructive ? "text-on-error" : "text-on-primary"
                )}
              >
                {confirmLabel}
              </StyledText>
            </StyledPressable>
            <StyledPressable
              onPress={onCancel}
              className="py-3 rounded-button items-center justify-center bg-surface-container"
              accessible
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <StyledText className="text-body-lg font-semibold text-on-surface">
                {cancelLabel}
              </StyledText>
            </StyledPressable>
          </StyledView>
        </StyledView>
      </StyledView>
    </Modal>
  );
}
