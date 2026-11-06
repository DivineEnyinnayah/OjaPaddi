import { eq } from "drizzle-orm";
import { images } from "@ojapaddi/db/schema";
import type { Database } from "@ojapaddi/db";

/**
 * Image storage backed by Turso/libSQL.
 *
 * Product images and business profile (logo) images are stored as BLOB rows
 * in the `images` table and served through `GET /v1/images/:id`. Uploads are
 * shrunk to ≤800px JPEG client-side before they reach here; the server
 * re-validates type and size and enforces the 2 MB cap as a backstop.
 */

/** Allowed MIME types for upload. */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export type ImageKind = "product" | "business_logo";

/** Structural subset of the bucket binding used here (kept for compatibility). */
export type R2BucketLike = {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
};

/** Validate the file type and size before uploading. */
export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds the maximum limit of 2 MB. Received: ${(file.size / 1024 / 1024).toFixed(1)} MB`
    );
  }
}

/**
 * Persist an image and return its public path (`/v1/images/:id`).
 * Store that path in `image_url` / `logo_url`; renderers prefix the API
 * origin. The caller is responsible for authorization and file validation.
 */
export async function saveImage(
  db: Database,
  businessId: string,
  kind: ImageKind,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(contentType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error(`Invalid content type: ${contentType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`);
  }

  if (body.byteLength > MAX_FILE_SIZE) {
    throw new Error("Image exceeds the maximum size of 2 MB");
  }

  const [row] = await db
    .insert(images)
    .values({
      businessId,
      kind,
      contentType,
      byteSize: body.byteLength,
      data: body,
    })
    .returning({ id: images.id });

  if (!row) {
    throw new Error("Failed to persist image");
  }

  return `/v1/images/${row.id}`;
}

/** Fetch an image row for the public binary endpoint. */
export async function getImage(
  db: Database,
  imageId: string
): Promise<{ contentType: string; byteSize: number; data: Buffer } | null> {
  const [row] = await db
    .select({
      contentType: images.contentType,
      byteSize: images.byteSize,
      data: images.data,
    })
    .from(images)
    .where(eq(images.id, imageId))
    .limit(1);

  return row ?? null;
}

/**
 * Legacy helper — call sites stored the returned absolute URL directly.
 * Kept for API compatibility; new code should use `getImage` / `saveImage`.
 */
export function publicUrl(key: string): string {
  return key;
}

/**
 * Resolve a stored `image_url` / `logo_url` into something the app can render.
 * Stored values are already usable paths or absolute URLs, so this is a
 * pass-through; kept because productService and businessService call it.
 */
export async function resolveImageUrl(
  imageUrl: string | null | undefined
): Promise<string | null> {
  if (!imageUrl) return null;
  return imageUrl;
}
