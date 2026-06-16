# HybridCrypto — Implementasi Hybrid Cryptosystem

> AES-256-CBC + RSA-2048-OAEP untuk Pengamanan Dokumen Digital Berbasis Web

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js (NextAuth v5) |
| Enkripsi | node-forge (AES-256-CBC + RSA-2048-OAEP) |

## Setup

### 1. Install PostgreSQL
Download dan install PostgreSQL dari https://www.postgresql.org/download/
Buat database baru:
```sql
CREATE DATABASE hybrid_crypto_db;
```

### 2. Konfigurasi Environment
Edit file `.env.local`:
```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/hybrid_crypto_db"
AUTH_SECRET="ganti-dengan-string-random-panjang-minimal-32-karakter"
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Generate AUTH_SECRET yang aman:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Setup Google OAuth (untuk Login Google + Kirim Email)
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru → **APIs & Services** → **OAuth consent screen**
   - User type: **External**
   - Isi App name, support email
   - Scopes: tambahkan `gmail.send`, `email`, `profile`, `openid`
3. **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. Salin **Client ID** dan **Client Secret** ke `.env.local`
5. Di **APIs & Services** → **Library** → aktifkan **Gmail API**

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka http://localhost:3000

## Fitur

- **Registrasi & Login** — Autentikasi aman dengan bcrypt password hashing
- **Kelola RSA Key Pair** — Generate RSA-2048 key pair, lihat public key
- **Enkripsi Dokumen** — Upload PDF/DOCX/TXT, enkripsi dengan AES-256-CBC
- **Download Terenkripsi** — Download file bundle `.encrypted`
- **Dekripsi Dokumen** — Dekripsi dengan RSA private key
- **Riwayat Aktivitas** — Log semua aktivitas dengan metadata kriptografi

## Alur Kriptografi

```
ENKRIPSI:
1. Generate random AES-256 key (32 byte) + IV (16 byte)
2. Enkripsi file dengan AES-256-CBC → Ciphertext
3. Enkripsi AES key dengan RSA-2048-OAEP (public key) → Encrypted Key
4. Simpan: Ciphertext + Encrypted Key + IV

DEKRIPSI:
1. Dekripsi Encrypted Key dengan RSA-2048-OAEP (private key) → AES Key
2. Dekripsi Ciphertext dengan AES-256-CBC (AES Key + IV) → File asli
```

## Struktur Project

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  — NextAuth handler
│   │   ├── auth/register/       — Registrasi user
│   │   ├── documents/           — CRUD dokumen
│   │   ├── documents/encrypt/   — Endpoint enkripsi
│   │   ├── documents/decrypt/   — Endpoint dekripsi
│   │   ├── documents/[id]/download/ — Download terenkripsi
│   │   ├── keys/                — CRUD RSA key pair
│   │   └── activities/          — Log aktivitas
│   ├── auth/login/              — Halaman login
│   ├── auth/register/           — Halaman register
│   ├── dashboard/               — Dashboard utama
│   ├── dashboard/encrypt/       — Halaman enkripsi
│   ├── dashboard/decrypt/       — Halaman dekripsi
│   ├── dashboard/documents/     — Daftar dokumen
│   ├── dashboard/keys/          — Kelola key pair
│   └── dashboard/activity/      — Riwayat aktivitas
├── lib/
│   ├── auth.ts                  — Konfigurasi NextAuth
│   ├── crypto.ts                — Implementasi AES-256 + RSA-2048
│   └── prisma.ts                — Prisma client singleton
├── components/
│   └── Sidebar.tsx              — Navigasi sidebar
└── proxy.ts                     — Route protection middleware
```
