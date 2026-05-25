import React, { useRef, useEffect, useMemo } from 'react';
import { TouchableOpacity, Animated, useWindowDimensions, Platform, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type TabIcon = keyof typeof Ionicons.glyphMap;

interface NavigationRoute {
  key: string;
  name: string;
}

interface TabBarProps {
  state: any;
  navigation: any;
  descriptors: any;
  insets: any;
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
  const margin = 16;

  const routes = useMemo(
    () => state.routes.filter((r: NavigationRoute) => TAB_CONFIG[r.name]),
    [state.routes],
  );
  
  const tabCount = routes.length;
  const tabWidth = (screenWidth - margin * 2) / tabCount;

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
    const event = navigation.emit({
      type: 'tabPress',
      target: routeName,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
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
          backgroundColor: 'white',
          paddingHorizontal: 8,
          paddingVertical: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
            },
            android: {
              elevation: 10,
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
            backgroundColor: 'rgba(26, 107, 60, 0.1)',
            transform: [{ translateX: indicatorAnim }],
          }}
        />
        {routes.map((route: NavigationRoute, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];

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
                color={isFocused ? '#1A6B3C' : '#9CA3AF'}
              />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isFocused ? '700' : '500',
                  color: isFocused ? '#1A6B3C' : '#9CA3AF',
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
