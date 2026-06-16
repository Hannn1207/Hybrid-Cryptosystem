"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const errorMessages: Record<string, string> = {
  Configuration: "Terjadi masalah konfigurasi server. Hubungi administrator.",
  AccessDenied: "Akses ditolak. Anda tidak memiliki izin untuk masuk.",
  Verification: "Link verifikasi tidak valid atau sudah kadaluarsa.",
  OAuthSignin: "Gagal memulai proses login Google. Coba lagi.",
  OAuthCallback: "Gagal menyelesaikan login Google. Coba lagi.",
  OAuthCreateAccount: "Gagal membuat akun dari Google. Email mungkin sudah terdaftar.",
  EmailCreateAccount: "Gagal membuat akun. Coba dengan email lain.",
  Callback: "Terjadi kesalahan saat callback autentikasi.",
  OAuthAccountNotLinked: "Email ini sudah terdaftar dengan metode login lain.",
  Default: "Terjadi kesalahan autentikasi.",
};

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Default";
  const message = errorMessages[error] ?? errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg-base)" }}>
      <div className="w-full max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6"
          style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-dark-50 mb-2">Autentikasi Gagal</h1>
        <p className="text-dark-400 mb-2">{message}</p>
        <p className="text-dark-600 text-xs font-mono mb-8">Kode error: {error}</p>

        <div className="flex flex-col gap-3">
          <Link href="/auth/login" className="btn-primary justify-center py-2.5">
            Coba Login Lagi
          </Link>
          <Link href="/" className="btn-secondary justify-center py-2.5">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: "var(--bg-base)" }} />}>
      <ErrorContent />
    </Suspense>
  );
}
