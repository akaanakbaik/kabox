import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFileSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

// Configure multer for file uploads with better error handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 3, // Maximum 3 files
    fieldSize: 10 * 1024 * 1024, // 10MB field size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types
    cb(null, true);
  },
});

interface UploadedFile {
  name: string;
  url: string;
  mime: string;
  size: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload endpoint with proper error handling
  app.post("/api/upload", (req, res, next) => {
    upload.array("files", 3)(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: "File terlalu besar. Maksimal 50MB per file."
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: "Terlalu banyak file. Maksimal 3 file."
          });
        }
        return res.status(400).json({
          success: false,
          error: "Error saat upload file."
        });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[] || [];
      const urls = req.body.urls ? (Array.isArray(req.body.urls) ? req.body.urls : [req.body.urls]) : [];
      
      if (files.length === 0 && urls.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "Tidak ada file atau URL yang diberikan" 
        });
      }

      if (files.length + urls.length > 3) {
        return res.status(400).json({ 
          success: false, 
          error: "Maksimal 3 file dapat diupload sekaligus" 
        });
      }

      const uploadedFiles: UploadedFile[] = [];

      // Get request host for dynamic URL generation with Vercel support
      const requestHost = req.get('x-forwarded-host') || req.get('host') || process.env.VERCEL_URL;

      // Process direct file uploads
      for (const file of files) {
        try {
          const result = await storage.uploadFile({
            originalName: file.originalname,
            buffer: file.buffer,
            mimeType: file.mimetype,
            size: file.size,
          }, requestHost);
          uploadedFiles.push(result);
        } catch (error) {
          console.error("File upload error:", error);
          return res.status(500).json({ 
            success: false, 
            error: `Gagal mengupload file ${file.originalname}` 
          });
        }
      }

      // Process URL uploads
      for (const url of urls) {
        try {
          if (!isValidUrl(url)) {
            return res.status(400).json({ 
              success: false, 
              error: `URL tidak valid: ${url}` 
            });
          }

          const result = await storage.uploadFromUrl(url, requestHost);
          uploadedFiles.push(result);
        } catch (error) {
          console.error("URL upload error:", error);
          return res.status(500).json({ 
            success: false, 
            error: `Gagal mengupload dari URL: ${url}` 
          });
        }
      }

      res.json({
        success: true,
        files: uploadedFiles,
      });

    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Terjadi kesalahan saat mengupload file" 
      });
    }
  });

  // File proxy endpoint to serve files with domain URL
  app.get("/files/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const fileData = await storage.getFile(filename);
      
      if (!fileData) {
        return res.status(404).json({ error: "File tidak ditemukan" });
      }

      res.set({
        'Content-Type': fileData.mimeType,
        'Content-Length': fileData.size.toString(),
        'Cache-Control': 'public, max-age=31536000', // 1 year cache
      });
      
      res.send(fileData.data);
    } catch (error) {
      console.error("File serve error:", error);
      res.status(500).json({ error: "Gagal mengambil file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
