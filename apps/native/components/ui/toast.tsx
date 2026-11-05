import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, AccessibilityInfo, Modal, Pressable, Text, View } from "react-native";
import { withUniwind } from "uniwind";
import { CheckCircle, WarningCircle, Info, X } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/useThemeColor";
import { cn } from "@/lib/utils";
import { AlertDialog } from "./alert-dialog";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledPressable = withUniwind(Pressable);

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

export interface ToastOption {
  label: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

interface ConfirmDialogState {
  id: number;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ActionDialogState {
  id: number;
  title?: string;
  message?: string;
  options: ToastOption[];
}

export interface ConfirmParams {
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ShowParams {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  show: (params: ShowParams) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  confirm: (params: ConfirmParams) => void;
  action: (params: { title?: string; message?: string; options: ToastOption[] }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

const TOAST_ICONS: Record<ToastType, React.ComponentType<{ size?: number; color?: string }>> = {
  success: CheckCircle,
  error: WarningCircle,
  info: Info,
};

/**
 * Toast — FigCraft `07 — States` (feedback). Behaviour (queue, auto-dismiss,
 * a11y announcement, confirm/action dialogs) is preserved; visual values are
 * re-pointed at FigCraft tokens.
 */
function ToastCard({
  toast,
  colors,
  onDismiss,
}: {
  toast: ToastItem;
  colors: ReturnType<typeof useThemeColor>;
  onDismiss: (id: number) => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const announced = useRef(false);

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 12,
    }).start();
  }, [anim]);

  useEffect(() => {
    if (!announced.current) {
      announced.current = true;
      AccessibilityInfo.announceForAccessibility(
        toast.title ? `${toast.title}. ${toast.message}` : toast.message,
      );
    }
  }, [toast]);

  const iconColor =
    toast.type === "success" ? colors.brand : toast.type === "error" ? colors.danger : colors.brand;

  const ToastIcon = TOAST_ICONS[toast.type];

  const label = toast.title ? `${toast.title}. ${toast.message}` : toast.message;

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
      }}
    >
      <StyledPressable
        onPress={() => onDismiss(toast.id)}
        className="mx-auto max-w-[92%] flex-row items-center gap-3 rounded-card border border-border bg-card px-4 py-3"
        accessibilityRole={toast.type === "error" ? "alert" : "button"}
        accessibilityLiveRegion={toast.type === "error" ? "assertive" : "polite"}
        accessibilityLabel={label}
      >
        <ToastIcon size={22} color={iconColor} />
        <StyledView className="flex-1 pr-2">
          {toast.title ? (
            <StyledText className="font-label text-body text-ink">{toast.title}</StyledText>
          ) : null}
          <StyledText className={cn("font-body text-body-sm text-muted", toast.title && "mt-0.5")}>
            {toast.message}
          </StyledText>
        </StyledView>
        <X size={18} color={colors.muted} />
      </StyledPressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [actionDialog, setActionDialog] = useState<ActionDialogState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: number) => {
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ type = "info", title, message, duration = 3000 }: ShowParams) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-2), { id, type, title, message }]);
      timers.current[id] = setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  const success = useCallback(
    (message: string, title?: string) => show({ type: "success", title, message }),
    [show],
  );
  const error = useCallback(
    (message: string, title?: string) => show({ type: "error", title, message }),
    [show],
  );
  const info = useCallback(
    (message: string, title?: string) => show({ type: "info", title, message }),
    [show],
  );

  const closeActionDialog = useCallback((option?: ToastOption) => {
    setActionDialog((current) => {
      option?.onPress?.();
      return null;
    });
  }, []);

  const confirm = useCallback(
    ({
      title,
      message,
      confirmLabel = "OK",
      cancelLabel = "Cancel",
      destructive = false,
      onConfirm,
      onCancel,
    }: ConfirmParams) => {
      setConfirmDialog({
        id: nextId++,
        title,
        message,
        confirmLabel,
        cancelLabel,
        destructive,
        onConfirm,
        onCancel,
      });
    },
    [],
  );

  const action = useCallback(
    ({ title, message, options }: { title?: string; message?: string; options: ToastOption[] }) => {
      setActionDialog({ id: nextId++, title, message, options });
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ show, success, error, info, confirm, action }}>
      {children}

      <StyledView
        pointerEvents="box-none"
        className="absolute left-0 right-0 items-center"
        style={{ top: insets.top + 8, gap: 8, zIndex: 60 }}
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} colors={colors} onDismiss={removeToast} />
        ))}
      </StyledView>

      <AlertDialog
        visible={confirmDialog !== null}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        cancelLabel={confirmDialog?.cancelLabel}
        destructive={confirmDialog?.destructive}
        onConfirm={() => {
          const d = confirmDialog;
          setConfirmDialog(null);
          d?.onConfirm?.();
        }}
        onCancel={() => {
          const d = confirmDialog;
          setConfirmDialog(null);
          d?.onCancel?.();
        }}
      />

      {actionDialog ? (
        <Modal
          visible={actionDialog !== null}
          transparent
          animationType="fade"
          onRequestClose={() => closeActionDialog()}
        >
          <StyledView className="flex-1 justify-center bg-brand-strong/60 px-6">
            <StyledPressable
              className="absolute inset-0"
              onPress={() => closeActionDialog()}
              accessibilityRole="button"
              accessibilityLabel="Close"
            />
            <StyledView
              className="rounded-card bg-card p-6"
              style={{ gap: actionDialog.message ? 12 : 8 }}
            >
              {actionDialog.title ? (
                <StyledText className="text-center font-title text-card-title text-ink">
                  {actionDialog.title}
                </StyledText>
              ) : null}
              {actionDialog.message ? (
                <StyledText className="text-center font-body text-body text-muted">
                  {actionDialog.message}
                </StyledText>
              ) : null}
              {actionDialog.message ? <StyledView className="my-1 h-px bg-border" /> : null}
              <StyledView style={{ gap: 10 }}>
                {actionDialog.options.map((option, index) => {
                  const isCancel = option.style === "cancel";
                  const isDestructive = option.style === "destructive";
                  return (
                    <StyledPressable
                      key={index}
                      onPress={() => closeActionDialog(option)}
                      className={cn(
                        "min-h-14 items-center justify-center rounded-button",
                        isCancel ? "bg-brand-soft" : isDestructive ? "bg-danger" : "bg-accent",
                      )}
                      accessibilityRole="button"
                      accessibilityLabel={option.label}
                    >
                      <StyledText
                        className={cn(
                          "font-label text-body",
                          isCancel ? "text-ink" : isDestructive ? "text-card" : "text-ink",
                        )}
                      >
                        {option.label}
                      </StyledText>
                    </StyledPressable>
                  );
                })}
              </StyledView>
            </StyledView>
          </StyledView>
        </Modal>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
