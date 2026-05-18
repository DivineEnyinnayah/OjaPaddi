import { supabase } from "../lib/supabase";

export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string,
  options: { upsert?: boolean } = {}
) {
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

export async function deleteFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
