import { supabase } from "@/lib/supabaseClient";

const SUPABASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "submissions";

// Upload a file to Supabase Storage
export async function uploadFile(
  file: File,
  path: string
): Promise<string> {
  const filePath = path;
  const { data, error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// Get public URL for a file
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

// Delete a file from storage
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .remove([path]);
  if (error) throw error;
}

// List files in a folder
export async function listFiles(folder: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .list(folder);
  if (error) throw error;
  return data.map((file) => `${folder}/${file.name}`);
}