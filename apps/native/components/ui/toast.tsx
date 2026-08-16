import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { CheckCircle, WarningCircle, Info, X } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/contexts/app-theme-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { cn } from '@/lib/utils';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledPressable = withUniwind(Pressable);

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

export interface ToastOption {
  label: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface DialogState {
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

function ToastCard({
  toast,
  colors,
  isDark,
  onDismiss,
}: {
  toast: ToastItem;
  colors: ReturnType<typeof useThemeColor>;
  isDark: boolean;
  onDismiss: (id: number) => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 12,
    }).start();
  }, [anim]);

  const iconColor =
    toast.type === 'success'
      ? isDark ? '#66bb6a' : '#2e7d32'
      : toast.type === 'error'
        ? colors.error
      : colors.primary;

    const ToastIcon = TOAST_ICONS[toast.type];

    return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }),
          },
        ],
      }}
    >
      <StyledPressable
        onPress={() => onDismiss(toast.id)}
        className="flex-row items-center gap-3 px-4 py-3.5 rounded-full bg-inverse-surface shadow-lg shadow-black/25 max-w-[92%] mx-auto"
      >
        <ToastIcon size={22} color={iconColor} />
        <StyledView className="flex-1 pr-2">
          {toast.title ? (
            <StyledText className="text-body-lg font-bold text-inverse-on-surface">
              {toast.title}
            </StyledText>
          ) : null}
          <StyledText
            className={cn(
              "text-body-md text-inverse-on-surface",
              toast.title && "opacity-90"
            )}
          >
            {toast.message}
          </StyledText>
        </StyledView>
        <X size={18} color={colors.outline} />
      </StyledPressable>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const colors = useThemeColor();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
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
    ({ type = 'info', title, message, duration = 3000 }: ShowParams) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-2), { id, type, title, message }]);
      timers.current[id] = setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => show({ type: 'success', title, message }), [show]);
  const error = useCallback((message: string, title?: string) => show({ type: 'error', title, message }), [show]);
  const info = useCallback((message: string, title?: string) => show({ type: 'info', title, message }), [show]);

  const closeDialog = useCallback((option?: ToastOption) => {
    setDialog((current) => {
      option?.onPress?.();
      return null;
    });
  }, []);

  const confirm = useCallback(
    ({
      title,
      message,
      confirmLabel = 'OK',
      cancelLabel = 'Cancel',
      destructive = false,
      onConfirm,
      onCancel,
    }: ConfirmParams) => {
      setDialog({
        id: nextId++,
        title,
        message,
        options: [
          { label: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
          { label: cancelLabel, style: 'cancel', onPress: onCancel },
        ],
      });
    },
    []
  );

  const action = useCallback(
    ({ title, message, options }: { title?: string; message?: string; options: ToastOption[] }) => {
      setDialog({ id: nextId++, title, message, options });
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show, success, error, info, confirm, action }}>
      {children}

      <StyledView
        pointerEvents="box-none"
        className="absolute left-0 right-0 z-[var(--z-toast)] items-center"
        style={{ top: insets.top + 8, gap: 8 }}
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} colors={colors} isDark={isDark} onDismiss={removeToast} />
        ))}
      </StyledView>

      <Modal
        visible={dialog !== null}
        transparent
        animationType="fade"
        onRequestClose={() => closeDialog()}
      >
        <StyledView className="flex-1 bg-black/50 justify-center px-6">
          <StyledPressable className="absolute inset-0 -z-10" onPress={() => closeDialog()} />
          <StyledView
            className="bg-surface-container-lowest rounded-card p-6 shadow-lg shadow-black/20"
            style={{ gap: dialog?.message ? 12 : 8 }}
          >
            {dialog?.title ? (
              <StyledText className="text-xl font-bold text-on-surface text-center">
                {dialog.title}
              </StyledText>
            ) : null}
            {dialog?.message ? (
              <StyledText className="text-body-lg text-on-surface-variant text-center leading-6">
                {dialog.message}
              </StyledText>
            ) : null}

            {dialog?.message ? <StyledView className="h-px bg-outline-variant my-1" /> : null}

            <StyledView style={{ gap: 10 }}>
              {dialog?.options.map((option, index) => {
                const isCancel = option.style === 'cancel';
                const isDestructive = option.style === 'destructive';
                return (
                  <StyledPressable
                    key={index}
                    onPress={() => closeDialog(option)}
                    className={cn(
                      "py-3 rounded-button items-center justify-center",
                      isCancel
                        ? "bg-surface-container"
                        : isDestructive
                          ? "bg-error"
                          : "bg-primary"
                    )}
                  >
                    <StyledText
                      className={cn(
                        "text-body-lg font-semibold",
                        isCancel
                          ? "text-on-surface"
                          : isDestructive
                            ? "text-on-error"
                            : "text-on-primary"
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
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}