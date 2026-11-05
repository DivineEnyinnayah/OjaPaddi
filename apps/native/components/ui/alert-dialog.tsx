import React from "react";
import { Modal, Pressable, View, Text, type ViewProps } from "react-native";
import { withUniwind } from "uniwind";
import { cn } from "../../lib/utils";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledPressable = withUniwind(Pressable);

/**
 * AlertDialog — FigCraft `03 — Components` + `07 — States`.
 * Confirm sheet on a scrim. Uses FigCraft card / ink / muted / danger tokens.
 */
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <StyledView className="flex-1 justify-center bg-brand-strong/60 px-6">
        <StyledPressable
          className="absolute inset-0"
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <StyledView className="rounded-card bg-card p-6" style={{ gap: message ? 12 : 8 }}>
          {title ? (
            <StyledText className="text-center font-title text-card-title text-ink">
              {title}
            </StyledText>
          ) : null}
          {message ? (
            <StyledText className="text-center font-body text-body text-muted">{message}</StyledText>
          ) : null}
          {message ? <StyledView className="my-1 h-px bg-border" /> : null}
          <StyledView style={{ gap: 10 }}>
            <StyledPressable
              onPress={onConfirm}
              className={cn(
                "min-h-14 items-center justify-center rounded-button",
                destructive ? "bg-danger" : "bg-accent",
              )}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <StyledText
                className={cn(
                  "font-label text-body",
                  destructive ? "text-card" : "text-ink",
                )}
              >
                {confirmLabel}
              </StyledText>
            </StyledPressable>
            <StyledPressable
              onPress={onCancel}
              className="min-h-14 items-center justify-center rounded-button bg-brand-soft"
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <StyledText className="font-label text-body text-ink">{cancelLabel}</StyledText>
            </StyledPressable>
          </StyledView>
        </StyledView>
      </StyledView>
    </Modal>
  );
}
