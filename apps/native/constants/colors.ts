/**
 * Centralized Material Design 3 color tokens for light and dark themes.
 *
 * Import via:
 *   import { COLORS } from '@/constants/colors';
 *   const theme = COLORS.light;  // or COLORS.dark
 *
 * These tokens mirror the ThemeColors interface in @/hooks/useThemeColor
 * and match the uniwind M3 / Tailwind v4 design-token system.
 */

export interface ThemeColorTokens {
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
}

export const COLORS: { light: ThemeColorTokens; dark: ThemeColorTokens } = {
  light: {
    background: '#FAFAF7', surface: '#FAFAF7', surfaceDim: '#E4E2DA', surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#E7F1EC', surfaceContainer: '#E7F1EC', surfaceContainerHigh: '#DCEBE4', surfaceContainerHighest: '#CDE0D4', surfaceVariant: '#E4E2DA',
    onBackground: '#14201C', onSurface: '#14201C', onSurfaceVariant: '#5C6B66',
    outline: '#5C6B66', outlineVariant: '#E4E2DA',
    primary: '#1F6F5C', onPrimary: '#FFFFFF', primaryContainer: '#E7F1EC', onPrimaryContainer: '#154E40',
    secondary: '#D97706', onSecondary: '#FFFFFF', secondaryContainer: '#FDE9C8', onSecondaryContainer: '#6B4500',
    tertiary: '#154E40', onTertiary: '#FFFFFF', tertiaryContainer: '#E7F1EC', onTertiaryContainer: '#154E40',
    error: '#B42318', onError: '#FFFFFF', errorContainer: '#FDE8E4', onErrorContainer: '#B42318',
    success: '#1F6F5C', onSuccess: '#FFFFFF', successContainer: '#E7F1EC', onSuccessContainer: '#154E40',
    inverseSurface: '#154E40', inverseOnSurface: '#FFFFFF', inversePrimary: '#A7D9BE',
  },
  dark: {
    background: '#0F130F', surface: '#0F130F', surfaceDim: '#262D29', surfaceContainerLowest: '#1D241F', surfaceContainerLow: '#17251D', surfaceContainer: '#17251D', surfaceContainerHigh: '#1F2A23', surfaceContainerHighest: '#26352D', surfaceVariant: '#262D29',
    onBackground: '#EAF0EC', onSurface: '#EAF0EC', onSurfaceVariant: '#9AA6A0',
    outline: '#9AA6A0', outlineVariant: '#262D29',
    primary: '#79C7A0', onPrimary: '#0F130F', primaryContainer: '#17251D', onPrimaryContainer: '#A7D9BE',
    secondary: '#F2B84B', onSecondary: '#2E2100', secondaryContainer: '#332408', onSecondaryContainer: '#F2B84B',
    tertiary: '#A7D9BE', onTertiary: '#0F130F', tertiaryContainer: '#17251D', onTertiaryContainer: '#A7D9BE',
    error: '#FF8A7A', onError: '#331B19', errorContainer: '#331B19', onErrorContainer: '#FF8A7A',
    success: '#79C7A0', onSuccess: '#0F130F', successContainer: '#17251D', onSuccessContainer: '#A7D9BE',
    inverseSurface: '#EAF0EC', inverseOnSurface: '#0F130F', inversePrimary: '#1F6F5C',
  },
};
