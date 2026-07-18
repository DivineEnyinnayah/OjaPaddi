import { useMemo } from 'react';
import { useAppTheme } from '@/contexts/app-theme-context';

/**
 * Returns resolved hex color values based on the current theme.
 *
 * Use this hook for React Native props that require raw color strings
 * (e.g. `<Ionicons color={} />`, `<ActivityIndicator color={} />`).
 * For Uniwind className-based styling, use semantic tokens directly.
 */

export interface ThemeColors {
  // Core surfaces
  background: string;
  surface: string;
  surfaceDim: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceVariant: string;

  // On-surface
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;

  // Outline
  outline: string;
  outlineVariant: string;

  // Primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  // Error
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  // Inverse
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  // Special semantic
  tabActiveIcon: string;
  tabInactiveIcon: string;
  tabBarBg: string;
  tabIndicatorBg: string;
  tabBarShadowColor: string;
  tabBarShadowOpacity: number;
  tabBarElevation: number;
  emptyStateIcon: string;

  // StatusBar
  statusBarStyle: 'light' | 'dark';
}

const LIGHT_COLORS: ThemeColors = {
  // Core surfaces
  background: '#f7faf3',
  surface: '#f7faf3',
  surfaceDim: '#d7dbd4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f1f5ee',
  surfaceContainer: '#ebefe8',
  surfaceContainerHigh: '#e6e9e2',
  surfaceContainerHighest: '#e0e4dd',
  surfaceVariant: '#e0e4dd',

  // On-surface
  onBackground: '#181d19',
  onSurface: '#181d19',
  onSurfaceVariant: '#404940',

  // Outline
  outline: '#707a70',
  outlineVariant: '#bfc9be',

  // Primary
  primary: '#005129',
  onPrimary: '#ffffff',
  primaryContainer: '#1a6b3c',
  onPrimaryContainer: '#9ae9ae',

  // Secondary
  secondary: '#835500',
  onSecondary: '#ffffff',
  secondaryContainer: '#feae2c',
  onSecondaryContainer: '#6b4500',

  // Tertiary
  tertiary: '#782c38',
  onTertiary: '#ffffff',
  tertiaryContainer: '#96434f',
  onTertiaryContainer: '#ffcace',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Inverse
  inverseSurface: '#2d322d',
  inverseOnSurface: '#eef2eb',
  inversePrimary: '#89d89e',

  // Special semantic
  tabActiveIcon: '#1A6B3C',
  tabInactiveIcon: '#9CA3AF',
  tabBarBg: '#ffffff',
  tabIndicatorBg: 'rgba(26, 107, 60, 0.1)',
  tabBarShadowColor: '#000000',
  tabBarShadowOpacity: 0.12,
  tabBarElevation: 10,
  emptyStateIcon: '#D4D4D4',

  // StatusBar
  statusBarStyle: 'dark',
};

const DARK_COLORS: ThemeColors = {
  // Core surfaces
  background: '#101411',
  surface: '#101411',
  surfaceDim: '#101411',
  surfaceContainerLowest: '#0a0f0c',
  surfaceContainerLow: '#181d19',
  surfaceContainer: '#1c211d',
  surfaceContainerHigh: '#262b27',
  surfaceContainerHighest: '#313632',
  surfaceVariant: '#404940',

  // On-surface
  onBackground: '#e0e4dd',
  onSurface: '#e0e4dd',
  onSurfaceVariant: '#bfc9be',

  // Outline
  outline: '#8a9389',
  outlineVariant: '#404940',

  // Primary
  primary: '#89d89e',
  onPrimary: '#00391a',
  primaryContainer: '#005229',
  onPrimaryContainer: '#a5f4b8',

  // Secondary
  secondary: '#ffb955',
  onSecondary: '#452b00',
  secondaryContainer: '#633f00',
  onSecondaryContainer: '#ffddb4',

  // Tertiary
  tertiary: '#ffb2b9',
  onTertiary: '#680016',
  tertiaryContainer: '#792d39',
  onTertiaryContainer: '#ffd9dc',

  // Error
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  // Inverse
  inverseSurface: '#e0e4dd',
  inverseOnSurface: '#2d322d',
  inversePrimary: '#005129',

  // Special semantic
  tabActiveIcon: '#89d89e',
  tabInactiveIcon: '#8a9389',
  tabBarBg: '#1c211d',
  tabIndicatorBg: 'rgba(137, 216, 158, 0.12)',
  tabBarShadowColor: '#000000',
  tabBarShadowOpacity: 0.25,
  tabBarElevation: 12,
  emptyStateIcon: '#404940',

  // StatusBar
  statusBarStyle: 'light',
};

export function useThemeColor(): ThemeColors {
  const { isDark } = useAppTheme();

  return useMemo(
    () => (isDark ? DARK_COLORS : LIGHT_COLORS),
    [isDark],
  );
}
