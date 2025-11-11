// lib/vercel-blob-upload.ts
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function uploadToVercelBlob(
  file: File | Blob,
  options: {
    folder?: string;
    maxSize?: number;
  } = {}
): Promise<{ url: string }> {
  const { folder = 'uploads', maxSize = 5 * 1024 * 1024 } = options;

  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
  }

  const fileExtension = file instanceof File ? file.name.split('.').pop() || 'bin' : 'bin';
  const fileName = `${uuidv4()}.${fileExtension}`;
  const fullPath = `${folder}/${fileName}`;
// const { url } = await put('articles/blob.txt', 'Hello World!', { access: 'public' });
  const blob = await put(fullPath, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  });

  return { url: blob.url };
}