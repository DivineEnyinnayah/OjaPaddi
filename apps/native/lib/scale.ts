import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Reference device width: iPhone 14 Pro (390pt) */
const BASE_WIDTH = 390;

const scale = SCREEN_WIDTH / BASE_WIDTH;

/**
 * Moderate scale — interpolates between the raw size and the fully-scaled size.
 * `factor` controls how aggressively it scales (0 = no scaling, 1 = full scaling).
 * Default factor of 0.5 provides a comfortable middle ground.
 */
export function ms(size: number, factor = 0.5): number {
  return Math.round(
    PixelRatio.roundToNearestPixel(size + (scale * size - size) * factor),
  );
}

/**
 * Height percentage — returns a pixel value that represents a percentage of screen height.
 * Useful for modals, bottom sheet snap points, etc.
 */
export function hp(percentage: number): number {
  return Math.round(
    PixelRatio.roundToNearestPixel((percentage * SCREEN_HEIGHT) / 100),
  );
}

/**
 * Width percentage — returns a pixel value that represents a percentage of screen width.
 */
export function wp(percentage: number): number {
  return Math.round(
    PixelRatio.roundToNearestPixel((percentage * SCREEN_WIDTH) / 100),
  );
}
