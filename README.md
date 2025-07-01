# Kabox - Upload File Modern & Mudah

Layanan upload file publik modern yang dibangun dengan React, Tailwind CSS, dan Supabase. Aplikasi ini memungkinkan pengguna untuk mengupload file langsung atau dari URL tanpa perlu registrasi atau login.

## 🚀 Fitur Utama

- 📤 Upload hingga 3 file sekaligus (maksimal 50MB per file)
- 🔗 Upload file dari URL eksternal
- 🌙 Dark/Light mode toggle dengan localStorage
- 📱 Responsive design (mobile, tablet, desktop)
- ☁️ Integrasi dengan Supabase Storage + fallback memory storage
- 🔄 Progress tracking real-time saat upload
- 📋 Copy & share URL hasil upload
- 🛡️ Proxy URL untuk konsistensi domain
- ⚡ API yang cepat dan reliable
- 🎨 UI modern dengan shadcn/ui components

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 18 + Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Multer untuk file upload
- **Storage**: Supabase Storage dengan fallback memory storage
- **Database**: PostgreSQL dengan Drizzle ORM
- **State Management**: React Query untuk server state
- **Routing**: Wouter untuk client-side routing
- **Deployment**: Optimized untuk Vercel

## 📋 Prasyarat

- Node.js 18+ 
- npm atau yarn
- Akun Supabase (untuk storage dan database)
- Akun Vercel (untuk deployment)

## ⚙️ Setup Environment Variables

### 1. Untuk Development (.env.local)

```env
# Supabase Configuration (WAJIB)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_BUCKET_NAME=kabox-files

# Database (gunakan Supabase PostgreSQL URL)
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres

# Frontend Variables (untuk development)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_SUPABASE_BUCKET_NAME=kabox-files

# Optional: Custom Base URL (jika menggunakan custom domain)
BASE_URL=https://yourdomain.com
```

### 2. Untuk Production (Vercel Environment Variables)

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_BUCKET_NAME=kabox-files
DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres
```

**Note**: Vercel secara otomatis menyediakan `VERCEL_URL` yang akan digunakan untuk generate URL file.

## 🔧 Setup Supabase

### 1. Buat Project Supabase
1. Login ke [supabase.com](https://supabase.com)
2. Klik "New Project"
3. Isi nama project, password database
4. Tunggu hingga project selesai dibuat

### 2. Setup Storage Bucket
```sql
-- 1. Buat storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kabox-files', 'kabox-files', true);

-- 2. Set policy untuk public access
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'kabox-files');

CREATE POLICY "Public Upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'kabox-files');
```

### 3. Ambil Kredensial
1. Pergi ke Project Settings > API
2. Copy `Project URL` untuk `SUPABASE_URL`
3. Copy `anon public` key untuk `SUPABASE_ANON_KEY`
4. Pergi ke Settings > Database
5. Copy `Connection string` untuk `DATABASE_URL`

## 💻 Installation & Development

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/kabox.git
cd kabox
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
```bash
# Copy template environment
cp .env.example .env.local

# Edit dengan kredensial Supabase Anda
nano .env.local
```

### 4. Setup Database Schema
```bash
# Push schema ke database
npm run db:push
```

### 5. Run Development Server
```bash
npm run dev
```

Website akan tersedia di `http://localhost:5000`

### 6. Build untuk Production
```bash
npm run build
```

## 🚀 Deployment ke Vercel

### Metode 1: Vercel CLI (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login ke Vercel
vercel login

# 3. Deploy
vercel

# 4. Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_BUCKET_NAME
vercel env add DATABASE_URL

# 5. Redeploy dengan environment variables
vercel --prod
```

### Metode 2: GitHub Integration

1. **Push ke GitHub**
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

2. **Import di Vercel**
- Login ke [vercel.com](https://vercel.com)
- Klik "New Project"
- Import repository GitHub Anda
- Set environment variables di dashboard

3. **Environment Variables di Vercel Dashboard**
- Pergi ke Project Settings > Environment Variables
- Tambahkan semua environment variables yang diperlukan
- Redeploy project

### 📁 Struktur Build

Setelah `npm run build`, struktur akan menjadi:
```
dist/
├── index.js          # Server bundle (Express)
└── public/           # Frontend bundle (React)
    ├── index.html
    ├── assets/
    └── ...
```

## 🔧 Konfigurasi Advanced

### Custom Domain di Vercel

1. **Add Domain**
   - Pergi ke Project Settings > Domains
   - Add domain Anda (misal: kabox.yourdomain.com)

2. **Update DNS**
   ```
   Type: CNAME
   Name: kabox
   Value: cname.vercel-dns.com
   ```

### Performance Optimization

File `vercel.json` sudah dikonfigurasi untuk:
- ✅ Maksimal file size 50MB untuk lambda
- ✅ Static file caching 1 tahun
- ✅ CORS support
- ✅ Routing yang optimal
- ✅ Memory allocation 512MB

## 📚 API Documentation

### POST /api/upload

Upload file atau dari URL dengan support multipart/form-data.

**Request Options:**

1. **File Upload (multipart/form-data)**
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

fetch('/api/upload', {
  method: 'POST',
  body: formData
});
```

2. **URL Upload (JSON)**
```javascript
fetch('/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: ['https://example.com/image.jpg']
  })
});
```

3. **Mixed Upload**
```javascript
const formData = new FormData();
formData.append('files', file);
formData.append('urls', 'https://example.com/image.jpg');
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "name": "abc123-def456.jpg",
      "url": "https://yourapp.vercel.app/files/abc123-def456.jpg", 
      "mime": "image/jpeg",
      "size": 284392,
      "originalName": "my-photo.jpg"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "File terlalu besar. Maksimal 50MB per file."
}
```

### GET /files/:filename

Retrieve uploaded file dengan proper content headers.

**Response Headers:**
- `Content-Type`: MIME type file
- `Content-Length`: Size file
- `Cache-Control`: Public caching (1 tahun)

## 🔍 Troubleshooting

### ❌ Error 405 Method Not Allowed
**Penyebab**: Routing issue di Vercel
**Solusi**:
1. Pastikan `vercel.json` dikonfigurasi dengan benar
2. Check apakah build berhasil: `npm run build`
3. Pastikan methods di routes sesuai dengan vercel.json

### ❌ Error 404 Not Found  
**Penyebab**: Static files tidak ditemukan
**Solusi**:
1. Check apakah `dist/public/` folder ada setelah build
2. Pastikan Vercel build command benar
3. Check routing di vercel.json

### ❌ Error 500 Internal Server Error
**Penyebab**: Server-side error
**Solusi**:
1. Check Vercel function logs
2. Pastikan environment variables lengkap
3. Check Supabase credentials

### ❌ Invalid request: images missing required property sizes
**Penyebab**: Meta tag OpenGraph yang tidak lengkap  
**Solusi**: ✅ Sudah diperbaiki di `client/index.html`

### ❌ Error Supabase Connection
**Penyebab**: Kredensial salah atau bucket tidak exist
**Solusi**:
1. Verify SUPABASE_URL dan SUPABASE_ANON_KEY
2. Check apakah bucket sudah dibuat dan public
3. Check koneksi DATABASE_URL

### ❌ File Upload Gagal
**Penyebab**: File size atau format issue
**Solusi**:
1. Check file size < 50MB per file
2. Maksimal 3 file per upload
3. Check network connection

### 🔧 Debug Mode

Enable debug logging:
```bash
# Development
DEBUG=* npm run dev

# Production (di Vercel)
# Add environment variable: DEBUG=express:*
```

## 📊 Monitoring & Analytics

### Vercel Analytics
```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to main.tsx
import { Analytics } from '@vercel/analytics/react';
```

### Error Tracking
File logs tersedia di:
- Development: Console browser & terminal
- Production: Vercel Dashboard > Functions > Logs

## 🚨 Security Considerations

### File Upload Security
- ✅ File size validation (50MB limit)
- ✅ File count validation (3 files max)
- ✅ CORS configuration
- ✅ No executable file upload
- ⚠️ **TODO**: Add virus scanning untuk production

### Environment Security
- ✅ Environment variables di Vercel secure
- ✅ Database credentials encrypted
- ✅ API keys tidak exposed ke frontend

## 🧪 Testing

### Manual Testing Checklist
- [ ] Upload single file ≤ 50MB
- [ ] Upload multiple files (3 max)
- [ ] Upload from URL
- [ ] File download via proxy URL
- [ ] Dark/light mode toggle
- [ ] Mobile responsive
- [ ] Error handling

### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Test upload endpoint
artillery quick --count 10 --num 3 https://yourapp.vercel.app/api/upload
```

## 📈 Performance Metrics

### Target Performance
- ⚡ Upload response time: < 5 seconds
- 🚀 Page load time: < 2 seconds  
- 📱 Mobile PageSpeed: > 90
- 🖥️ Desktop PageSpeed: > 95

### Optimization Features
- Static file caching (1 year)
- Image optimization via Vercel
- Code splitting dengan Vite
- Lazy loading components
- Optimized bundle size

## 🤝 Contributing

1. **Fork repository**
2. **Create feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Create Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS untuk styling
- Ensure mobile responsiveness
- Add proper error handling
- Write clear commit messages

## 📞 Support

### Quick Links
- 🐛 [Report Bug](https://github.com/yourusername/kabox/issues)
- 💡 [Request Feature](https://github.com/yourusername/kabox/issues)
- 📖 [Documentation](https://github.com/yourusername/kabox/wiki)
- 💬 [Discussions](https://github.com/yourusername/kabox/discussions)

### Contact
- GitHub Issues untuk bug reports
- Email: your.email@example.com
- Discord: YourUsername#1234

## 📄 License

MIT License - lihat [LICENSE](LICENSE) untuk detail lengkap.

---

**⭐ Jika project ini membantu, silakan berikan star di GitHub!**

Made with ❤️ by [Your Name](https://github.com/yourusername)