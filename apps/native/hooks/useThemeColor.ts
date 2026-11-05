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

  // Success
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;

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
  background: '#FAFAF7',
  surface: '#FAFAF7',
  surfaceDim: '#E4E2DA',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#E7F1EC',
  surfaceContainer: '#E7F1EC',
  surfaceContainerHigh: '#DCEBE4',
  surfaceContainerHighest: '#CDE0D4',
  surfaceVariant: '#E4E2DA',

  // On-surface
  onBackground: '#14201C',
  onSurface: '#14201C',
  onSurfaceVariant: '#5C6B66',

  // Outline
  outline: '#5C6B66',
  outlineVariant: '#E4E2DA',

  // Primary
  primary: '#1F6F5C',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E7F1EC',
  onPrimaryContainer: '#154E40',

  // Secondary
  secondary: '#D97706',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#FDE9C8',
  onSecondaryContainer: '#6B4500',

  // Tertiary
  tertiary: '#154E40',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#E7F1EC',
  onTertiaryContainer: '#154E40',

  // Error
  error: '#B42318',
  onError: '#FFFFFF',
  errorContainer: '#FDE8E4',
  onErrorContainer: '#B42318',

  // Success
  success: '#1F6F5C',
  onSuccess: '#FFFFFF',
  successContainer: '#E7F1EC',
  onSuccessContainer: '#154E40',

  // Inverse
  inverseSurface: '#154E40',
  inverseOnSurface: '#FFFFFF',
  inversePrimary: '#A7D9BE',

  // Special semantic
  tabActiveIcon: '#1F6F5C',
  tabInactiveIcon: '#9AA6A0',
  tabBarBg: '#FFFFFF',
  tabIndicatorBg: 'rgba(31, 111, 92, 0.12)',
  tabBarShadowColor: '#14201C',
  tabBarShadowOpacity: 0.16,
  tabBarElevation: 8,
  emptyStateIcon: '#D2D0C7',

  // StatusBar
  statusBarStyle: 'dark',
};

const DARK_COLORS: ThemeColors = {
  // Core surfaces
  background: '#0F130F',
  surface: '#0F130F',
  surfaceDim: '#262D29',
  surfaceContainerLowest: '#1D241F',
  surfaceContainerLow: '#17251D',
  surfaceContainer: '#17251D',
  surfaceContainerHigh: '#1F2A23',
  surfaceContainerHighest: '#26352D',
  surfaceVariant: '#262D29',

  // On-surface
  onBackground: '#EAF0EC',
  onSurface: '#EAF0EC',
  onSurfaceVariant: '#9AA6A0',

  // Outline
  outline: '#9AA6A0',
  outlineVariant: '#262D29',

  // Primary
  primary: '#79C7A0',
  onPrimary: '#0F130F',
  primaryContainer: '#17251D',
  onPrimaryContainer: '#A7D9BE',

  // Secondary
  secondary: '#F2B84B',
  onSecondary: '#2E2100',
  secondaryContainer: '#332408',
  onSecondaryContainer: '#F2B84B',

  // Tertiary
  tertiary: '#A7D9BE',
  onTertiary: '#0F130F',
  tertiaryContainer: '#17251D',
  onTertiaryContainer: '#A7D9BE',

  // Error
  error: '#FF8A7A',
  onError: '#331B19',
  errorContainer: '#331B19',
  onErrorContainer: '#FF8A7A',

  // Success
  success: '#79C7A0',
  onSuccess: '#0F130F',
  successContainer: '#17251D',
  onSuccessContainer: '#A7D9BE',

  // Inverse
  inverseSurface: '#EAF0EC',
  inverseOnSurface: '#0F130F',
  inversePrimary: '#1F6F5C',

  // Special semantic
  tabActiveIcon: '#79C7A0',
  tabInactiveIcon: '#9AA6A0',
  tabBarBg: '#1D241F',
  tabIndicatorBg: 'rgba(121, 199, 160, 0.14)',
  tabBarShadowColor: '#000000',
  tabBarShadowOpacity: 0.28,
  tabBarElevation: 10,
  emptyStateIcon: '#404A43',

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
