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
  background: '#f1fcf7',
  surface: '#f1fcf7',
  surfaceDim: '#d1ddd8',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#ebf6f1',
  surfaceContainer: '#e5f0eb',
  surfaceContainerHigh: '#dfeae5',
  surfaceContainerHighest: '#e0e4dd',
  surfaceVariant: '#e0e4dd',

  // On-surface
  onBackground: '#181d19',
  onSurface: '#181d19',
  onSurfaceVariant: '#404940',

  // Outline
  outline: '#707a70',
  outlineVariant: '#bfc9c2',

  // Primary
  primary: '#2e8b57',
  onPrimary: '#ffffff',
  primaryContainer: '#bdf3d8',
  onPrimaryContainer: '#002111',

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
  tabActiveIcon: '#2E8B57',
  tabInactiveIcon: '#9CA3AF',
  tabBarBg: '#ffffff',
  tabIndicatorBg: 'rgba(46, 139, 87, 0.1)',
  tabBarShadowColor: '#000000',
  tabBarShadowOpacity: 0.12,
  tabBarElevation: 10,
  emptyStateIcon: '#D4D4D4',

  // StatusBar
  statusBarStyle: 'dark',
};

const DARK_COLORS: ThemeColors = {
  // Core surfaces
  background: '#121414',
  surface: '#121414',
  surfaceDim: '#121414',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerLow: '#1a1c1c',
  surfaceContainer: '#1e2020',
  surfaceContainerHigh: '#282b2b',
  surfaceContainerHighest: '#333535',
  surfaceVariant: '#404943',

  // On-surface
  onBackground: '#e1e3e0',
  onSurface: '#e1e3e0',
  onSurfaceVariant: '#bfc9c1',

  // Outline
  outline: '#8a938c',
  outlineVariant: '#404943',

  // Primary
  primary: '#238546',
  onPrimary: '#ffffff',
  primaryContainer: '#114223',
  onPrimaryContainer: '#a7f3c4',

  // Secondary
  secondary: '#ebc23e',
  onSecondary: '#3c2f00',
  secondaryContainer: '#574500',
  onSecondaryContainer: '#ffe087',

  // Tertiary
  tertiary: '#c8c6c5',
  onTertiary: '#303030',
  tertiaryContainer: '#9d9b9a',
  onTertiaryContainer: '#333333',

  // Error
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  // Inverse
  inverseSurface: '#e1e3e0',
  inverseOnSurface: '#2d322d',
  inversePrimary: '#006e1c',

  // Special semantic
  tabActiveIcon: '#78dc77',
  tabInactiveIcon: '#8a938c',
  tabBarBg: '#1e2020',
  tabIndicatorBg: 'rgba(120, 220, 119, 0.12)',
  tabBarShadowColor: '#000000',
  tabBarShadowOpacity: 0.25,
  tabBarElevation: 12,
  emptyStateIcon: '#404943',

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
