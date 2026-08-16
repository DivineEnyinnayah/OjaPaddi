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
  },

  dark: {
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
  },
};
