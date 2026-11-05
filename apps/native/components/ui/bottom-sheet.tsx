import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
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
 * Shared bottom sheet used by every modal surface in the app — FigCraft
 * `03 — Components` (sheets). Behaviour (springs, pan-to-dismiss, safe areas,
 * keyboard avoidance) is preserved from the previous implementation; only the
 * visual values are re-pointed at FigCraft tokens.
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
          } else {
            Animated.spring(sheetY, { toValue: 0, ...SPRING, useNativeDriver: true }).start();
          }
        },
      }),
    [sheetY],
  );

  if (!rendered) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <StyledView className="flex-1 justify-end">
        <Animated.View
          style={{
            ...StyleSheetAbsoluteFill,
            opacity: scrimOpacity,
          }}
        >
          <Pressable
            className="flex-1 bg-brand-strong/60"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>

        <Animated.View
          style={[{ transform: [{ translateY: sheetY }] }, style]}
          className={cn("rounded-t-card bg-card", contentClassName)}
        >
          <StyledView
            {...panResponder.panHandlers}
            className="items-center pt-3 pb-1"
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <StyledView className="h-1 w-10 rounded-pill bg-border" />
          </StyledView>

          {(title || icon) && (
            <StyledView className="flex-row items-center gap-3 px-6 pt-2 pb-3">
              {icon}
              <StyledView className="flex-1">
                {title ? (
                  <StyledText className="font-title text-card-title text-ink">{title}</StyledText>
                ) : null}
                {subtitle ? (
                  <StyledText className="font-body text-body-sm text-muted">{subtitle}</StyledText>
                ) : null}
              </StyledView>
              <Pressable
                onPress={onClose}
                hitSlop={12}
                className="min-h-12 min-w-12 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={20} color={colors.muted} />
              </Pressable>
            </StyledView>
          )}

          <StyledKeyboardAvoidingView behavior="padding">
            {scrollable ? (
              <StyledScrollView
                className="px-6"
                style={{ maxHeight: screenHeight * maxHeightRatio }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </StyledScrollView>
            ) : (
              children
            )}

            {footer ? (
              <StyledView
                className="border-t border-border px-6 pt-4"
                style={{ paddingBottom: insets.bottom + 16 }}
              >
                {footer}
              </StyledView>
            ) : (
              <StyledView style={{ height: insets.bottom + 16 }} />
            )}
          </StyledKeyboardAvoidingView>
        </Animated.View>
      </StyledView>
    </Modal>
  );
}

const StyleSheetAbsoluteFill: ViewStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
