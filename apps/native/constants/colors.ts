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

  // Inverse
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export const COLORS: { light: ThemeColorTokens; dark: ThemeColorTokens } = {
  light: {
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
  },

  dark: {
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
  },
};
