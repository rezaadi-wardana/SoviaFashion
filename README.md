# Sovia Fashion - E-Commerce & Virtual Try-On Platform

## 📖 Deskripsi Proyek
Sovia Fashion adalah aplikasi web e-commerce modern yang dilengkapi dengan fitur *Virtual Try-On* (VTO) berbasis AI. Pengguna dapat melihat katalog produk busana muslimah, mencoba pakaian secara virtual, dan melakukan pemesanan. Aplikasi ini juga memiliki Dashboard Admin yang komprehensif untuk mengelola produk, kategori, slider (hero), pesanan, serta melihat statistik analitik kunjungan.

## 🚀 Teknologi Utama
- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Bahasa Pemrograman:** TypeScript & JavaScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Database ORM:** [Prisma ORM](https://www.prisma.io/)
- **Database:** MySQL (Hosted di Railway)
- **Autentikasi:** [Auth.js / NextAuth](https://authjs.dev/) dengan Google OAuth
- **Image Processing:** `sharp` (untuk kompresi otomatis)
- **Integrasi Pihak Ketiga:**
  - **Replicate API:** Model AI untuk Virtual Try-On (IDM-VTON / FLUX.1)
  - **OpenRouter API:** Akses ke model LLM
  - **Biteship API:** Penghitungan ongkos kirim

---

## 🛠️ Persiapan & Instalasi (Setup Guide)

### 1. Kebutuhan Sistem (Prerequisites)
Pastikan sistem Anda sudah memiliki:
- [Node.js](https://nodejs.org/) (direkomendasikan versi 20 atau lebih baru)
- [Git](https://git-scm.com/)

### 2. Kloning Repositori
```bash
git clone https://github.com/rezaadi-wardana/SoviaFashion.git
cd SoviaFashion
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment Variables (`.env`)
Buat file `.env` di direktori root project Anda, lalu masukkan konfigurasi rahasia Anda:
```env
# Database (contoh URL dari Railway)
DATABASE_URL="mysql://username:password@host:port/database"

# NextAuth / Auth.js Config
NEXTAUTH_SECRET="your-secret-key-change-this"
AUTH_SECRET="your-secret-key-change-this"
AUTH_TRUST_HOST=true

# Domain / URL Local
NEXTAUTH_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"

# Google OAuth (untuk Login)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# API Keys 3rd Party
REPLICATE_API_TOKEN="your-replicate-token"
OPENROUTER_API_KEY="your-openrouter-key"
BITESHIP_API_KEY="your-biteship-key"
```

### 5. Sinkronisasi Database
Pastikan struktur database Anda sesuai dengan schema Prisma:
```bash
npx prisma generate
npx prisma db push
```
*(Catatan: Jika sudah ada data, hindari `db push` karena bisa me-reset struktur tabel tanpa warning. Lebih baik menggunakan `npx prisma migrate dev` jika Anda ingin migrasi yang terstruktur).*

### 6. Menjalankan Server (Development)
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000).

---

## ⚙️ Deployment & Konfigurasi Lanjutan (Vercel)

Proyek ini telah di-setting agar siap untuk dideploy di **Vercel**. 
1. Saat membuat proyek di Vercel, **wajib menyalin seluruh isi `.env`** ke menu *Environment Variables* di dashboard Vercel.
2. Pastikan file `package.json` memiliki script `"postinstall": "prisma generate"`. Ini memastikan Prisma Client di-*generate* ulang setiap kali Vercel melakukan build.
3. Konfigurasi `next.config.ts` telah dilengkapi opsi `unoptimized: true` untuk **mengatasi masalah batasan server Vercel (Vercel limits)** ketika melakukan load gambar ukuran raksasa.
4. **Perlu Diperhatikan:** *Upload API* saat ini (`src/app/api/upload/route.ts`) menyimpan file langsung ke dalam direktori `/public/uploads`. Karena sistem penyimpanan Vercel (Serverless) bersifat *read-only* setelah build, gambar yang di-*upload* via Vercel Production bisa jadi akan menghilang atau error. Ke depannya sangat disarankan menggunakan S3 Bucket, Cloudinary, atau Vercel Blob untuk penyimpanan *production*.

---

## ⚠️ Troubleshooting & Catatan Kesalahan Umum

Jika di kemudian hari proyek ini ditinggalkan cukup lama lalu dijalankan lagi, ini adalah masalah-masalah yang sering terjadi beserta solusinya:

### 1. Gambar Tidak Muncul di Vercel (Broken Images / 500 Error)
- **Penyebab:** Image optimization Next.js gagal jika menangani gambar mentah > 4 MB (Vercel hobby limit). Atau file di dalam `public/uploads/` tidak terbaca.
- **Solusi saat ini:** Kita telah menambahkan plugin `sharp` (server-side auto-compress) yang mengubah *file* ke `.webp` dengan resolusi maksimal 1920px. Kita juga menonaktifkan *image optimization* Next.js di `next.config.ts` (`unoptimized: true`).
- **Penyelesaian Masa Depan:** Sangat dianjurkan pindah ke Vercel Blob / Supabase Storage.

### 2. Vercel Build Gagal ("Failed to type check")
- **Penyebab:** Mode Strict TypeScript akan menolak build jika tipe data tidak serasi (misal ketika update Next.js atau library `sharp`).
- **Solusi:** Jalankan `npm run build` di lokal. Baca error terminalnya. Jika terdapat warning dari TS, seringkali mem-bypass-nya dengan memberi casting `any` (misal `let x: any = y;`) akan menyelesaikan masalah *build*.

### 3. Vercel Gagal Baca Database ("Prisma Client is not initialized")
- **Penyebab:** Prisma Client tidak terbentuk (*generated*) pada server Vercel.
- **Solusi:** Cek kembali command `postinstall` di `package.json`. Kadang perlu clear build-cache di Vercel dan re-deploy.

### 4. Tidak Bisa Git Push (Error GitHub Push Protection)
- **Penyebab:** GitHub *Secret Scanning* memblokir Anda karena secara tidak sadar ikut mem-push file yang berisi "Rahasia" (seperti token Google OAuth) misal dalam file backup database (`.sql`).
- **Solusi:** 
  1. Hapus dari git cache: `git rm --cached nama_file.sql`
  2. Tambahkan ekstensi file berbahaya ke `.gitignore`
  3. Lakukan `git commit --amend`
  4. Baru lakukan `git push`

### 5. Muncul Warning "Tracking Prevention blocked access to storage..."
- **Penyebab:** Browser dengan sekuritas tinggi (Safari, Brave, dsb) memblokir file skrip third-party (seperti `@mediapipe` untuk fitur VTO) dari membaca *localStorage*.
- **Efek:** Ini hanyalah pesan peringatan (*warning* merah/kuning di console), tidak menyebabkan error fatal pada antarmuka *website*.
