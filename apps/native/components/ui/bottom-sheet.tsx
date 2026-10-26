import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
import { cn } from "../../lib/utils";
import { useThemeColor } from "@/hooks/useThemeColor";
import { StyledKeyboardAvoidingView, StyledScrollView, StyledText, StyledView } from "./styled";

/** Entrance/settle spring. Tuned to feel quick but not abrupt on a content sheet. */
const SPRING = { damping: 24, stiffness: 240, mass: 0.9 };

/** Drag past this many points down, or flick faster than this, and the sheet closes. */
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 0.75;

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Small rounded badge rendered left of the title. */
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Rendered in a sticky bar under the scroll area — use for primary actions so they never scroll away. */
  footer?: React.ReactNode;
  /** Wrap children in a ScrollView. Turn off only when children manage their own scrolling. */
  scrollable?: boolean;
  /** Fraction of screen height the sheet may occupy at most. */
  maxHeightRatio?: number;
  contentClassName?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Shared bottom sheet used by every modal surface in the app.
 *
 * Replaces the hand-rolled `Modal` + `justify-end` pattern, which had no
 * keyboard avoidance, no safe-area padding, and no drag-to-dismiss — so the
 * primary action on form sheets could sit under the home indicator or the
 * keyboard.
 */
export function BottomSheet({
  visible,
  onClose,
  icon,
  title,
  subtitle,
  footer,
  scrollable = true,
  maxHeightRatio = 0.88,
  contentClassName,
  style,
  children,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColor();
  const screenHeight = Dimensions.get("window").height;

  // The sheet stays mounted while it animates out, so `visible` cannot drive the
  // Modal directly without cutting the exit animation short.
  const [rendered, setRendered] = useState(visible);
  const renderedRef = useRef(visible);

  const sheetY = useRef(new Animated.Value(screenHeight)).current;
  const scrimOpacity = useRef(new Animated.Value(0)).current;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      renderedRef.current = true;
      setRendered(true);
      sheetY.setValue(screenHeight);
      scrimOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(sheetY, { toValue: 0, ...SPRING, useNativeDriver: true }),
        Animated.timing(scrimOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      return;
    }

    if (!renderedRef.current) return;
    renderedRef.current = false;

    // `sheetY` animates from wherever the drag gesture left it, so a flick-to-dismiss
    // continues from the finger instead of snapping back to the top first.
    Animated.parallel([
      Animated.timing(sheetY, { toValue: screenHeight, duration: 200, useNativeDriver: true }),
      Animated.timing(scrimOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [visible, screenHeight, sheetY, scrimOpacity]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Only claim the gesture once it is clearly downward and mostly vertical,
        // so horizontal swipes inside the content are left alone.
        onMoveShouldSetPanResponder: (_evt, gesture) =>
          gesture.dy > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2,
        onPanResponderGrant: () => {
          sheetY.stopAnimation();
        },
        onPanResponderMove: (_evt, gesture) => {
          // Rubber-band upward drags instead of letting the sheet detach upward.
          if (gesture.dy > 0) sheetY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_evt, gesture) => {
          if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
            onCloseRef.current();
            return;
          }
          Animated.spring(sheetY, { toValue: 0, ...SPRING, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(sheetY, { toValue: 0, ...SPRING, useNativeDriver: true }).start();
        },
      }),
    [sheetY],
  );

  const hasHeader = Boolean(title || icon);
  const sheetStyle: StyleProp<ViewStyle> = [
    styles.sheet,
    {
      maxHeight: screenHeight * maxHeightRatio,
      transform: [{ translateY: sheetY }],
    },
    style,
  ];

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StyledView className="flex-1 justify-end">
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: scrimOpacity }]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <StyledKeyboardAvoidingView behavior="padding" pointerEvents="box-none" style={styles.av}>
          <Animated.View accessibilityViewIsModal className="bg-surface-container-lowest" style={sheetStyle}>
            {/* Drag handle + header. This block is the drag zone, which keeps the gesture
                from fighting the ScrollView below it. */}
            <StyledView {...panResponder.panHandlers}>
              <StyledView className="items-center pt-3 pb-1">
                <StyledView className="w-12 h-1.5 rounded-full bg-outline/40" />
              </StyledView>

              {hasHeader ? (
                <StyledView className="flex-row items-center gap-3 px-6 pt-2 pb-4">
                  {icon ? (
                    <StyledView className="w-10 h-10 rounded-xl bg-primary-container items-center justify-center">
                      {icon}
                    </StyledView>
                  ) : null}
                  <StyledView className="flex-1">
                    {title ? (
                      <StyledText className="text-h3 font-bold text-on-surface" numberOfLines={2}>
                        {title}
                      </StyledText>
                    ) : null}
                    {subtitle ? (
                      <StyledText className="text-body-sm text-on-surface-variant mt-0.5">
                        {subtitle}
                      </StyledText>
                    ) : null}
                  </StyledView>
                  <Pressable
                    onPress={onClose}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    className="w-9 h-9 rounded-full bg-surface-container items-center justify-center"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <X size={18} color={colors.onSurfaceVariant} />
                  </Pressable>
                </StyledView>
              ) : null}
            </StyledView>

            {hasHeader ? <StyledView className="h-px bg-outline-variant/40" /> : null}

            {scrollable ? (
              <StyledScrollView
                className={cn("px-6", contentClassName)}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {children}
              </StyledScrollView>
            ) : (
              <StyledView className={cn("px-6", contentClassName)}>{children}</StyledView>
            )}

            {footer ? (
              <>
                <StyledView className="h-px bg-outline-variant/40" />
                <StyledView className="px-6 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
                  {footer}
                </StyledView>
              </>
            ) : (
              <StyledView style={{ height: Math.max(insets.bottom, 8) }} />
            )}
          </Animated.View>
        </StyledKeyboardAvoidingView>
      </StyledView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  av: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -10 },
    elevation: 24,
  },
});