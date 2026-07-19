import { supabase } from '@/lib/supabase';

export type UploadResult = {
  id: string;
  url: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
};

export async function uploadFile(
  uri: string,
  filename: string,
  mimeType: string,
  bucket: string = 'establishments'
): Promise<UploadResult> {
  const path = `uploads/${Date.now()}-${filename.replace(/\s/g, '_')}`;

  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(error.message);

  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    id: data.path,
    url: publicData.publicUrl,
    originalFilename: filename,
    contentType: mimeType,
    sizeBytes: arrayBuffer.byteLength,
  };
}

export async function deleteFile(fileId: string, bucket: string = 'establishments'): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([fileId]);
  if (error) throw new Error(error.message);
}
