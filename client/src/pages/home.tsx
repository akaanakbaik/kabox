import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { apiRequest } from "@/lib/queryClient";
import { formatFileSize, isValidUrl, getExtensionFromUrl } from "@/lib/supabase";
import { 
  Cloud, 
  Upload, 
  Link, 
  Sun, 
  Moon, 
  Copy, 
  ExternalLink, 
  Trash2, 
  File, 
  Code,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface UploadResult {
  name: string;
  url: string;
  mime: string;
  size: number;
  originalName: string;
}

interface UploadResponse {
  success: boolean;
  files: UploadResult[];
}

export default function Home() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<UploadResponse> => {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadResults(data.files);
      setSelectedFiles([]);
      setUrls([]);
      setUrlInput("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Upload Berhasil!",
        description: `${data.files.length} file berhasil diupload`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: File[]) => {
    const totalItems = selectedFiles.length + files.length + urls.length;
    if (totalItems > 3) {
      toast({
        title: "Batas Maksimal",
        description: "Maksimal 3 file dapat diupload sekaligus",
        variant: "destructive",
      });
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelect(files);
    }
  };

  const addUrl = () => {
    if (!urlInput.trim() || !isValidUrl(urlInput.trim())) {
      toast({
        title: "URL Tidak Valid",
        description: "Masukkan URL yang valid",
        variant: "destructive",
      });
      return;
    }

    const totalItems = selectedFiles.length + urls.length + 1;
    if (totalItems > 3) {
      toast({
        title: "Batas Maksimal",
        description: "Maksimal 3 file/URL dapat diupload sekaligus",
        variant: "destructive",
      });
      return;
    }

    setUrls([...urls, urlInput.trim()]);
    setUrlInput("");
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 && urls.length === 0) {
      toast({
        title: "Tidak Ada File",
        description: "Pilih file atau masukkan URL terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    
    urls.forEach((url) => {
      formData.append("urls", url);
    });

    // Simulate progress for better UX
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      await uploadMutation.mutateAsync(formData);
      setUploadProgress(100);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Tersalin!",
        description: "URL berhasil disalin ke clipboard",
      });
    } catch {
      toast({
        title: "Gagal Menyalin",
        description: "Tidak dapat menyalin URL ke clipboard",
        variant: "destructive",
      });
    }
  };

  const totalItems = selectedFiles.length + urls.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">kabox</h1>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4 text-blue-400" />
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
            Upload File Mudah & Cepat
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Layanan upload file publik modern tanpa registrasi. Unggah hingga 3 file sekaligus atau dari URL.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-6 flex items-center">
              <Upload className="text-primary mr-2" />
              Upload File
            </h3>
            
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-all duration-300 cursor-pointer ${
                isDragOver
                  ? "border-primary bg-primary/10"
                  : "border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seret & lepas file di sini
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                atau klik untuk memilih file (Maksimal 3 file)
              </p>
              <Button onClick={(e) => e.stopPropagation()}>
                Pilih File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            {/* Selected Files */}
            {totalItems > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                  File Terpilih:
                </h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`file-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <File className="text-primary" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {urls.map((url, index) => (
                    <div
                      key={`url-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Link className="text-green-500" />
                        <div>
                          <p className="font-medium text-sm truncate max-w-xs">{url}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Dari URL</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUrl(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* URL Upload */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Link className="text-primary mr-2" />
                Upload dari URL
              </h4>
              <div className="flex space-x-3">
                <Input
                  type="url"
                  placeholder="https://example.com/file.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addUrl} className="bg-green-500 hover:bg-green-600">
                  Tambah URL
                </Button>
              </div>
            </div>

            {/* Upload Button & Progress */}
            <div className="mt-6">
              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending || totalItems === 0}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadMutation.isPending ? "Mengupload..." : "Upload File"}
              </Button>
              
              {uploadProgress > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Mengupload...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-green-600">
                <CheckCircle className="mr-2" />
                Upload Berhasil!
              </h3>
              <div className="space-y-4">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <File className="text-green-500" />
                        <div>
                          <p className="font-medium text-sm">{result.originalName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(result.size)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          value={result.url}
                          readOnly
                          className="flex-1 text-sm bg-white dark:bg-gray-800"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(result.url)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Salin
                        </Button>
                        <Button
                          size="sm"
                          asChild
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <a href={result.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            Buka
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Documentation */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Code className="text-primary mr-2" />
              Dokumentasi API
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint</h4>
                <code className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded text-sm block">
                  POST /api/upload
                </code>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Deskripsi</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Menerima multipart/form-data dan/atau field url untuk upload file
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Contoh Response</h4>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`{
  "success": true,
  "files": [
    {
      "name": "abc123.jpg",
      "url": "https://kabox.domain/files/abc123.jpg",
      "mime": "image/jpeg",
      "size": 284392
    }
  ]
}`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Creator Profile */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <img
                src="https://files.catbox.moe/qfamnx.jpg"
                alt="Foto profil aka"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Tentang Pembuat</h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Nama:</strong> aka</p>
                  <p><strong>Umur:</strong> 15 tahun</p>
                  <p><strong>Asal:</strong> Sumatera Barat</p>
                  <p><strong>Status:</strong> pelajar</p>
                  <p className="italic text-gray-500 dark:text-gray-400">
                    "gw hanya pemula 🛏️"
                  </p>
                </div>
                
                <Button
                  asChild
                  className="mt-4 bg-green-500 hover:bg-green-600"
                >
                  <a
                    href="https://wa.me/6281266950382"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    Hubungi via WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400">
          <p>
            kabox © 2025 - dibuat oleh <span className="text-primary font-medium">aka</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
