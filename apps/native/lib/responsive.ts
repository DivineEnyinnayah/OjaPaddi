import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'xs' | 'base' | 'lg' | 'tablet';

export const BREAKPOINTS = {
  xs: 320,
  base: 360,
  lg: 428,
  tablet: 768,
} as const;

export type Responsive = {
  width: number;
  height: number;
  bp: Breakpoint;
  isXs: boolean;
  isBase: boolean;
  isLg: boolean;
  isTablet: boolean;
  /** Multiply a number by the device scale: 1.0 on 390px, 0.88 on 320px, 1.12 on tablets. */
  scale: (value: number) => number;
  /** Static mobile-first padding; tablet gets more room. */
  gutter: number;
  /** 2% of viewport width, clamped between min and max. */
  vw: (value: number, min: number, max: number) => number;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const useResponsive = (): Responsive => {
  const { width, height } = useWindowDimensions();
  const bp: Breakpoint =
    width >= BREAKPOINTS.tablet
      ? 'tablet'
      : width >= BREAKPOINTS.lg
        ? 'lg'
        : width >= BREAKPOINTS.base
          ? 'base'
          : 'xs';
  const isXs = bp === 'xs';
  const isTablet = bp === 'tablet';
  const factor = isXs ? 0.88 : isTablet ? 1.12 : 1;

  return {
    width,
    height,
    bp,
    isXs,
    isBase: bp === 'base',
    isLg: bp === 'lg',
    isTablet,
    scale: (value: number) => Math.round(value * factor),
    gutter: isTablet ? 32 : 24,
    vw: (value: number, min: number, max: number) =>
      clamp((width * value) / 100, min, max),
  };
};
