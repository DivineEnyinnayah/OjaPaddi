import React, { useRef, useEffect, useMemo } from "react";
import { TouchableOpacity, Animated, Platform, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useResponsive } from "@/lib/responsive";
import { StyledText } from "./styled";

type TabIcon = keyof typeof Ionicons.glyphMap;

export interface TabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string }[];
    key: string;
    routeNames: string[];
    stale: boolean;
    type: string;
  };
  navigation: { navigate: (name: string, params?: Record<string, unknown>) => void };
  descriptors: Record<string, unknown>;
  insets: { top: number; right: number; bottom: number; left: number };
}

const TAB_CONFIG: Record<string, { label: string; activeIcon: TabIcon; inactiveIcon: TabIcon }> = {
  index: { label: "Home", activeIcon: "home", inactiveIcon: "home-outline" },
  products: { label: "Products", activeIcon: "cube", inactiveIcon: "cube-outline" },
  sales: { label: "Sales", activeIcon: "cart", inactiveIcon: "cart-outline" },
  customers: { label: "Customers", activeIcon: "people", inactiveIcon: "people-outline" },
  more: { label: "More", activeIcon: "ellipsis-horizontal", inactiveIcon: "ellipsis-horizontal-outline" },
};

/**
 * Floating tab bar — FigCraft `03 — Components` (bottom nav).
 * Behaviour (sliding indicator, haptics, responsive rail width) preserved per
 * the rebuild brief; FigCraft shows no shadow token, so the bar is a flat
 * `card` surface with a hairline border.
 */
export function FloatingTabBar({ state, navigation, insets }: TabBarProps) {
  const { width: screenWidth, isXs, isTablet } = useResponsive();
  const colors = useThemeColor();
  const horizontalMargin = isTablet ? Math.round((screenWidth - 640) / 2) : 16;

  const routes = useMemo(
    () => state.routes.filter((r): r is (typeof state.routes)[number] => r.name in TAB_CONFIG),
    [state.routes],
  );

  const tabCount = routes.length;
  const usableWidth = screenWidth - horizontalMargin * 2 - 16;
  const tabWidth = usableWidth / tabCount;

  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index * tabWidth + 8,
      tension: 120,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth, indicatorAnim]);

  const handleTabPress = (routeName: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate(routeName);
  };

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom + 12,
        left: horizontalMargin,
        right: horizontalMargin,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 28,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.card,
          paddingHorizontal: 8,
          paddingVertical: 8,
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            borderRadius: 20,
            width: tabWidth,
            height: 52,
            backgroundColor: colors.brandSoft,
            transform: [{ translateX: indicatorAnim }],
          }}
        />
        {routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name]!;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handleTabPress(route.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={config.label}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 52, gap: 2 }}
              activeOpacity={0.65}
            >
              <Ionicons
                name={isFocused ? config.activeIcon : config.inactiveIcon}
                size={isXs ? 20 : 24}
                color={isFocused ? colors.brand : colors.muted}
              />
              <StyledText
                className={`font-label text-micro ${isFocused ? "text-brand" : "text-muted"}`}
              >
                {config.label}
              </StyledText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
