import { files, type InsertFile } from "@shared/schema";

interface FileUploadInput {
  originalName: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}

interface UploadedFile {
  name: string;
  url: string;
  mime: string;
  size: number;
}

interface StoredFile {
  filename: string;
  data: Buffer;
  mimeType: string;
  size: number;
}

export interface IStorage {
  uploadFile(input: FileUploadInput, requestHost?: string): Promise<UploadedFile>;
  uploadFromUrl(url: string, requestHost?: string): Promise<UploadedFile>;
  getFile(filename: string): Promise<StoredFile | null>;
}

export class MemStorage implements IStorage {
  private fileStore: Map<string, StoredFile>;
  private supabaseUrl: string;
  private supabaseKey: string;
  private bucketName: string;

  constructor() {
    this.fileStore = new Map();
    this.supabaseUrl = process.env.SUPABASE_URL || "";
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || "";
    this.bucketName = process.env.SUPABASE_BUCKET_NAME || "auten";
  }

  private generateFileName(originalName: string): string {
    const extension = originalName.split('.').pop() || '';
    const uuid = this.generateUuid();
    return extension ? `${uuid}.${extension}` : uuid;
  }

  private generateUuid(): string {
    return 'xxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private getBaseUrl(requestHost?: string): string {
    // Priority 1: Deteksi dari request host (hosting domain yang sebenarnya)
    if (requestHost) {
      const protocol = requestHost.includes('localhost') || requestHost.includes('127.0.0.1') 
        ? 'http' : 'https';
      return `${protocol}://${requestHost}`;
    }
    
    // Priority 2: VERCEL_URL (untuk Vercel deployment otomatis)
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Priority 3: BASE_URL environment variable
    if (process.env.BASE_URL) {
      const baseUrl = process.env.BASE_URL;
      return baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    }
    
    // Priority 4: Fallback untuk development
    return "http://localhost:5000";
  }

  async uploadFile(input: FileUploadInput, requestHost?: string): Promise<UploadedFile> {
    const filename = this.generateFileName(input.originalName);
    
    try {
      // Store file in Supabase Storage
      const uploadResponse = await this.uploadToSupabase(filename, input.buffer, input.mimeType);
      
      if (!uploadResponse) {
        throw new Error("Failed to upload to Supabase");
      }

      // Store file metadata locally for faster access
      this.fileStore.set(filename, {
        filename,
        data: input.buffer,
        mimeType: input.mimeType,
        size: input.size,
      });

      const baseUrl = this.getBaseUrl(requestHost);
      
      return {
        name: filename,
        url: `${baseUrl}/files/${filename}`,
        mime: input.mimeType,
        size: input.size,
      };
    } catch (error) {
      console.error("Upload to Supabase failed:", error);
      
      // Fallback to local storage
      this.fileStore.set(filename, {
        filename,
        data: input.buffer,
        mimeType: input.mimeType,
        size: input.size,
      });

      const baseUrl = this.getBaseUrl(requestHost);
      
      return {
        name: filename,
        url: `${baseUrl}/files/${filename}`,
        mime: input.mimeType,
        size: input.size,
      };
    }
  }

  async uploadFromUrl(url: string, requestHost?: string): Promise<UploadedFile> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch from URL: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Extract filename from URL
      const urlPath = new URL(url).pathname;
      const originalName = urlPath.split('/').pop() || 'file';
      
      return this.uploadFile({
        originalName,
        buffer,
        mimeType: contentType,
        size: buffer.length,
      }, requestHost);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload from URL: ${errorMessage}`);
    }
  }

  async getFile(filename: string): Promise<StoredFile | null> {
    // First try local storage
    const localFile = this.fileStore.get(filename);
    if (localFile) {
      return localFile;
    }

    // Try to fetch from Supabase
    try {
      const fileData = await this.downloadFromSupabase(filename);
      if (fileData) {
        // Cache locally for future requests
        this.fileStore.set(filename, fileData);
        return fileData;
      }
    } catch (error) {
      console.error("Failed to fetch from Supabase:", error);
    }

    return null;
  }

  private async uploadToSupabase(filename: string, buffer: Buffer, mimeType: string): Promise<boolean> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.log("Supabase credentials not configured, using fallback storage");
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${this.supabaseUrl}/storage/v1/object/${this.bucketName}/${filename}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000',
          'x-upsert': 'true',
        },
        body: buffer,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Supabase upload failed: ${response.status} - ${errorText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Supabase upload error:", error);
      return false;
    }
  }

  private async downloadFromSupabase(filename: string): Promise<StoredFile | null> {
    if (!this.supabaseUrl || !this.supabaseKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filename}`);
      
      if (!response.ok) {
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const mimeType = response.headers.get('content-type') || 'application/octet-stream';

      return {
        filename,
        data: buffer,
        mimeType,
        size: buffer.length,
      };
    } catch (error) {
      console.error("Supabase download error:", error);
      return null;
    }
  }
}

export const storage = new MemStorage();
