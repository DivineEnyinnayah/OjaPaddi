import { env } from "@ojapaddi/env/server";

/**
 * Minimal Cloudinary config — three keys are required in .env.
 * See https://cloudinary.com/documentation/api_reference#api_upload
 */
const CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME;
const API_KEY = env.CLOUDINARY_API_KEY;
const API_SECRET = env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = "products";

/**
 * Allowed MIME types for upload.
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

/**
 * Structural subset of the bucket binding used here (keeps tests easy).
 * Kept for API compatibility with the old R2 signature — the routes pass
 * `c.env.IMAGES` as the first arg, which Cloudinary ignores.
 */
export type R2BucketLike = {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
};

/**
 * Validate the file type and size before uploading.
 */
export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds the maximum limit of 2 MB. Received: ${(file.size / 1024 / 1024).toFixed(1)} MB`
    );
  }
}

/**
 * Upload an image buffer to Cloudinary and return the stable public URL.
 *
 * @param _bucket  — kept for API compatibility with the old R2 signature;
 *                   Cloudinary ignores the bucket and key.
 * @param key      — kept for API compatibility; Cloudinary uses it as the
 *                   `public_id` when `use_filename` is enabled, but we pass it
 *                   only to keep the call sites unchanged.
 * @param body     — the image buffer.
 * @param contentType — the image MIME type.
 * @returns the Cloudinary `secure_url`.
 */
export async function uploadImage(
  _bucket: unknown,
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error(
      `Invalid content type: ${contentType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Strip extension from the public_id so Cloudinary adds the correct format extension
  const publicId = key.replace(/\.[^.]+$/, "");

  const timestamp = Math.floor(Date.now() / 1000);

  // Signed upload: folder + public_id + timestamp + API_SECRET
  const paramsToSign = `folder=${CLOUDINARY_FOLDER}&public_id=${publicId}&timestamp=${timestamp}`;
  const stringToSign = `${paramsToSign}${API_SECRET}`;
  const crypto = await import("node:crypto");
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  const form = new FormData();
  form.append("file", new Blob([body], { type: contentType }));
  form.append("api_key", API_KEY);
  form.append("timestamp", timestamp.toString());
  form.append("signature", signature);
  form.append("folder", CLOUDINARY_FOLDER);
  form.append("public_id", publicId);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  const data = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!data.secure_url) {
    const msg = data.error?.message ?? JSON.stringify(data);
    throw new Error(`Cloudinary upload failed: ${msg}`);
  }

  return data.secure_url;
}

/**
 * Cloudinary returns a full absolute URL from the upload call, so we just
 * return the stored value unchanged.
 */
export function publicUrl(key: string): string {
  return key;
}

/**
 * Resolve a stored `image_url` into something the app can render.
 * - null/undefined → null
 * - already absolute → returned unchanged (Cloudinary URLs, or legacy data)
 * - storage key     → this version does NOT pre‑fix (Cloudinary URLs are absolute)
 */
export async function resolveImageUrl(
  imageUrl: string | null | undefined
): Promise<string | null> {
  if (!imageUrl) return null;
  return imageUrl;
}