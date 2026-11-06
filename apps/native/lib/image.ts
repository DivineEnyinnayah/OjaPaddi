/**
 * Image helpers.
 *
 * Uploads go to the API as 800px-JPEG (stored in Turso, served at
 * `/v1/images/:id`). `imageUri` resolves a stored value for `<Image>`:
 * absolute URLs pass through (legacy/external), stored relative paths get
 * the API origin prepended.
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { env } from './env';

const MAX_IMAGE_DIMENSION = 800;
const JPEG_QUALITY = 0.8;

// SERVER_URL includes the /v1 prefix (e.g. http://192.168.1.5:3001/v1).
const API_ORIGIN = env.SERVER_URL.replace(/\/v1\/?$/, '');

/** Resolve a stored image_url / logo_url into an absolute URI for <Image>. */
export function imageUri(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|file:)/.test(url)) return url;
  return `${API_ORIGIN}${url}`;
}

export type ImageSource = {
  uri: string;
  width?: number;
  height?: number;
};

export type PreparedImage = {
  uri: string;
  name: string;
  type: 'image/jpeg';
};

/**
 * Shrink a local image so its longest edge is at most 800px and re-encode it
 * as JPEG. Used before every upload — product photos and business logos are
 * stored in the database, so payload size matters.
 */
export async function prepareImageForUpload(asset: ImageSource): Promise<PreparedImage> {
  const { uri, width, height } = asset;
  const longest = Math.max(width ?? 0, height ?? 0);
  const needsResize = !width || !height || longest > MAX_IMAGE_DIMENSION;
  const resize =
    width && height && longest > MAX_IMAGE_DIMENSION
      ? width >= height
        ? { width: MAX_IMAGE_DIMENSION }
        : { height: MAX_IMAGE_DIMENSION }
      : { width: MAX_IMAGE_DIMENSION };

  const context = ImageManipulator.manipulate(uri);
  const prepared = needsResize ? context.resize(resize) : context;
  const image = await prepared.renderAsync();
  const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  context.release();
  image.release();
  return { uri: result.uri, name: `image-${Date.now()}.jpg`, type: 'image/jpeg' };
}
