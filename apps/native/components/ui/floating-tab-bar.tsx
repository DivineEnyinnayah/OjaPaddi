import React, { useRef, useEffect, useMemo } from 'react';
import { TouchableOpacity, Animated, useWindowDimensions, Platform, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColor } from '@/hooks/useThemeColor';

type TabIcon = keyof typeof Ionicons.glyphMap;

export interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[]; key: string; routeNames: string[]; stale: boolean; type: string };
  navigation: { navigate: (name: string, params?: Record<string, unknown>) => void };
  descriptors: Record<string, unknown>;
  insets: { top: number; right: number; bottom: number; left: number };
}

const TAB_CONFIG: Record<string, { label: string; activeIcon: TabIcon; inactiveIcon: TabIcon }> = {
  index: { label: 'Home', activeIcon: 'home', inactiveIcon: 'home-outline' },
  products: { label: 'Products', activeIcon: 'cube', inactiveIcon: 'cube-outline' },
  sales: { label: 'Sales', activeIcon: 'cart', inactiveIcon: 'cart-outline' },
  customers: { label: 'Customers', activeIcon: 'people', inactiveIcon: 'people-outline' },
  more: { label: 'More', activeIcon: 'ellipsis-horizontal', inactiveIcon: 'ellipsis-horizontal-outline' },
};

export function FloatingTabBar({ state, navigation, insets }: TabBarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const colors = useThemeColor();
  const margin = 16;

  const routes = useMemo(
    () => state.routes.filter((r): r is (typeof state.routes)[number] => r.name in TAB_CONFIG),
    [state.routes],
  );

  const tabCount = routes.length;
  const tabWidth = (screenWidth - margin * 2 - 16) / tabCount;

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
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate(routeName);
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: insets.bottom + 16,
        left: margin,
        right: margin,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 28,
          backgroundColor: colors.tabBarBg,
          paddingHorizontal: 8,
          paddingVertical: 8,
          ...Platform.select({
            ios: {
              shadowColor: colors.tabBarShadowColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: colors.tabBarShadowOpacity,
              shadowRadius: 16,
            },
            android: {
              elevation: colors.tabBarElevation,
            },
          }),
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            borderRadius: 22,
            width: tabWidth,
            height: 44,
            backgroundColor: colors.tabIndicatorBg,
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
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 44, gap: 1 }}
              activeOpacity={0.6}
            >
              <Ionicons
                name={isFocused ? config.activeIcon : config.inactiveIcon}
                size={24}
                color={isFocused ? colors.tabActiveIcon : colors.tabInactiveIcon}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isFocused ? '700' : '500',
                  color: isFocused ? colors.tabActiveIcon : colors.tabInactiveIcon,
                }}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
