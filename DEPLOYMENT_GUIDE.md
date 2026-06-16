# Panduan Deployment: Vercel + Supabase (PostgreSQL)

Dokumen ini berisi panduan langkah demi langkah untuk men-deploy aplikasi web **HybridCrypto** (Next.js 16 + Prisma) agar online menggunakan **Vercel** (untuk hosting aplikasi) dan **Supabase** (untuk database PostgreSQL cloud).

---

## Langkah 1: Persiapan Database di Supabase

Supabase menyediakan database PostgreSQL cloud gratis yang sangat cocok disandingkan dengan Prisma dan Vercel.

1. Buka [Supabase](https://supabase.com/) dan buat akun/login.
2. Klik **New Project** dan pilih organisasi Anda.
3. Isi detail project baru:
   * **Name:** `hybrid-crypto-db` (atau sesuaikan).
   * **Database Password:** Buat password yang kuat dan **simpan/catat password ini** karena akan digunakan di connection string.
   * **Region:** Pilih region terdekat dengan server Vercel (misalnya **Singapore** untuk pengguna di Indonesia).
   * **Pricing Plan:** Pilih **Free Tier**.
4. Klik **Create New Project** dan tunggu beberapa menit hingga server database selesai disiapkan.

### Mengambil Connection String Supabase untuk Prisma
Setelah database siap:
1. Pergi ke **Project Settings** (ikon gerigi di kiri bawah) -> **Database**.
2. Cari bagian **Connection string**.
3. Pilih tab **URI**.
4. Di sana Anda akan melihat connection string PostgreSQL. Supabase menyediakan dua jenis port:
   * **Port 6543 (Connection Pooler - Transaction Mode):** Digunakan untuk aplikasi serverless di Vercel agar database tidak kehabisan koneksi.
     * Contoh: `postgres://postgres.[username]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   * **Port 5432 (Direct Connection):** Digunakan secara lokal untuk melakukan migrasi/push skema database oleh Prisma CLI.
     * Contoh: `postgres://postgres.[username]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
5. Salin kedua connection string tersebut dan ganti tulisan `[YOUR-PASSWORD]` dengan password database yang Anda buat tadi.

---

## Langkah 2: Menyesuaikan Konfigurasi Prisma di Project

Karena aplikasi ini berjalan di lingkungan Serverless (Vercel), disarankan menggunakan fitur *Connection Pooling* Supabase untuk menghindari error batas koneksi PostgreSQL terlampaui.

1. Buka file `prisma/schema.prisma` di editor Anda.
2. Ubah konfigurasi `datasource db` agar mendukung `directUrl` (untuk migrasi direkt):
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```
3. Update file `.env.local` lokal Anda untuk pengujian (atau sebagai dokumentasi):
   ```env
   # Gunakan port pooler (6543) dengan parameter pgbouncer=true
   DATABASE_URL="postgres://postgres.[username]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

   # Gunakan port direkt (5432)
   DIRECT_URL="postgres://postgres.[username]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
   ```

---

## Langkah 3: Mengunggah Project ke GitHub

Vercel melakukan deployment secara otomatis dengan membaca repository GitHub Anda.

1. Buka git/terminal di folder project `D:\Kuliah\Materi Kuliah (Semester 6)\1. Kriptografi\UAS\Web`.
2. Pastikan file `.env` dan `.env.local` sudah terdaftar di `.gitignore` agar password database tidak tersebar ke publik.
3. Jalankan perintah Git berikut:
   ```bash
   git init
   git add .
   git commit -m "Setup deployment configuration"
   git branch -M main
   ```
4. Buka GitHub Anda, buat repository baru (disarankan **Private**).
5. Hubungkan git lokal ke GitHub dan lakukan *push* kode:
   ```bash
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```

---

## Langkah 4: Push Skema Prisma ke Supabase

Sebelum aplikasi dijalankan di Vercel, struktur tabel database harus di-push terlebih dahulu ke database Supabase yang masih kosong.

Jalankan perintah ini di terminal komputer lokal Anda (pastikan variabel `DIRECT_URL` di `.env.local` sudah diarahkan ke Supabase):
```bash
npx prisma db push
```
*Perintah ini akan secara otomatis membuat tabel `users`, `rsa_key_pairs`, `documents`, `activity_logs`, dll. di database Supabase Anda.*

---

## Langkah 5: Deployment di Vercel

1. Buka [Vercel](https://vercel.com/) dan masuk menggunakan akun GitHub Anda.
2. Klik tombol **Add New...** -> **Project**.
3. Di daftar repository GitHub, cari repository project **HybridCrypto** Anda lalu klik **Import**.
4. Pada bagian **Configure Project**:
   * **Framework Preset:** Pilih **Next.js**.
   * **Root Directory:** `./`
5. Buka bagian **Environment Variables** dan masukkan variabel lingkungan berikut satu per satu:

| Key | Value / Contoh | Keterangan |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://postgres.xxx:pass@aws-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` | URL database Supabase (Pooler Port 6543) |
| `DIRECT_URL` | `postgres://postgres.xxx:pass@aws-xxx.pooler.supabase.com:5432/postgres` | URL database Supabase (Direct Port 5432) |
| `AUTH_SECRET` | *Buat string acak 32 karakter* (Gunakan perintah: `openssl rand -hex 32` di terminal) | Kunci enkripsi token sesi NextAuth |
| `NEXTAUTH_URL` | `https://nama-project-anda.vercel.app` (atau biarkan kosong jika NextAuth v5 otomatis mendeteksinya) | Alamat domain utama website Anda |
| `GOOGLE_CLIENT_ID` | `123456-xxx.apps.googleusercontent.com` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxx` | Google OAuth Client Secret |

6. Klik tombol **Deploy** dan tunggu proses build selesai (sekitar 1-3 menit).
7. Setelah selesai, Vercel akan memberikan Anda URL domain publik gratis (misal: `https://hybrid-cryptosystem.vercel.app`).

---

## Langkah 6: Memperbarui Pengaturan Google OAuth (Sangat Penting!)

Setelah mendapatkan domain Vercel gratis dari langkah sebelumnya, Anda **wajib** mendaftarkan domain baru tersebut ke Google Cloud Console agar fitur login dengan Google dan pengiriman email Gmail tidak mengalami error `redirect_uri_mismatch`.

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Masuk ke project Google Cloud Anda -> **APIs & Services** -> **Credentials**.
3. Di bawah bagian **OAuth 2.0 Client IDs**, klik ikon edit (pensil) pada client ID project Anda.
4. Cari bagian **Authorized JavaScript origins**, tambahkan URL domain Vercel Anda:
   * `https://nama-project-anda.vercel.app`
5. Cari bagian **Authorized redirect URIs**, tambahkan URL callback NextAuth dengan domain Vercel Anda:
   * `https://nama-project-anda.vercel.app/api/auth/callback/google`
6. Klik **Save** di bagian bawah.
7. Tunggu sekitar 2-5 menit agar konfigurasi Google diperbarui secara global.
