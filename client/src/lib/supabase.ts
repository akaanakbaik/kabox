export interface SupabaseConfig {
  url: string;
  anonKey: string;
  bucketName: string;
}

export const supabaseConfig: SupabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  bucketName: import.meta.env.VITE_SUPABASE_BUCKET_NAME || "auten",
};

export function generateFileName(originalName: string): string {
  const extension = originalName.split('.').pop() || '';
  const uuid = crypto.randomUUID();
  return extension ? `${uuid}.${extension}` : uuid;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getExtensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop();
    return extension || null;
  } catch {
    return null;
  }
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
