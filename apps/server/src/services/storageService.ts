import { supabase } from "../lib/supabase";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;


const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
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

export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string,
  options: { upsert?: boolean } = {}
) {
  // Ensure the bucket exists (or try to create it)
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.id === bucket);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: false,
      });
      if (createError) {
        console.error(`Failed to create bucket ${bucket}:`, createError.message);
      }
    }
  } catch (e) {
    console.error(`Error ensuring bucket ${bucket} exists:`, e);
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: options.upsert,
    });

  if (error) {
    throw new Error(error.message);
  }

  return data.path;
}


export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  return getSignedUrl(bucket, path, 3600);
}


export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

/**
 * Resolve an image_url value to a usable URL.
 * - If it's already an HTTP URL (legacy signed URL), return as-is.
 * - If it's a storage path (e.g. "products/businessId/file.jpg"), generate a fresh signed URL.
 * - If null/undefined, return null.
 */
export async function resolveImageUrl(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl) return null;
  // Already a full URL (legacy data or external URL)
  if (imageUrl.startsWith("http")) return imageUrl;
  // It's a storage path — generate a fresh signed URL (1 hour expiry)
  return getSignedUrl("products", imageUrl, 3600);
}
