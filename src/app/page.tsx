import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)" }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow shadow-primary-600/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              HybridCrypto
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-secondary text-sm py-2">
              Masuk
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2">
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div
          className="inline-flex items-center gap-2 text-sm px-4 py-1.5 rounded-full mb-8"
          style={{
            backgroundColor: "rgba(37,99,235,0.1)",
            border: "1px solid rgba(37,99,235,0.3)",
            color: "#60a5fa",
          }}
        >
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
          AES-256-CBC + RSA-2048-OAEP
        </div>

        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 max-w-4xl" style={{ color: "var(--text-primary)" }}>
          Amankan Dokumen Digital dengan <span className="gradient-text">Hybrid Cryptosystem</span>
        </h1>

        <p className="text-xl max-w-2xl mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Platform enkripsi dokumen berbasis web menggunakan kombinasi AES-256 untuk kecepatan dan RSA-2048 untuk keamanan distribusi kunci. Dokumen
          PDF dan Word Anda aman secara kriptografis.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/auth/register" className="btn-primary px-8 py-3 text-base">
            Mulai Sekarang — Gratis
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link href="/auth/login" className="btn-secondary px-8 py-3 text-base">
            Sudah Punya Akun? Masuk
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {[
            {
              icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
              title: "AES-256-CBC",
              desc: "Enkripsi simetris dengan kunci 256-bit dan IV acak untuk setiap file. Standar industri yang dipakai oleh pemerintah dan militer.",
              iconBg: "rgba(37,99,235,0.12)",
              iconColor: "#60a5fa",
            },
            {
              icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
              title: "RSA-2048-OAEP",
              desc: "Kunci AES diproteksi dengan RSA-2048 menggunakan OAEP padding. Hanya pemilik private key yang bisa mendekripsi.",
              iconBg: "rgba(22,163,74,0.12)",
              iconColor: "#4ade80",
            },
            {
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              title: "PDF & Word",
              desc: "Mendukung file PDF, DOCX, DOC, dan TXT. Upload, enkripsi, download, dan dekripsi langsung dari browser.",
              iconBg: "rgba(202,138,4,0.12)",
              iconColor: "#fbbf24",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="card p-6 text-left transition-all duration-200 hover:shadow-lg"
              style={{ "--hover-border": "var(--text-muted)" } as React.CSSProperties}
            >
              <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: f.iconBg, color: f.iconColor }}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 font-mono" style={{ color: "var(--text-primary)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-sm" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
        HybridCrypto — Tugas UAS Kriptografi · Implementasi AES-256 + RSA-2048 Created By Farhan Fadhilah
      </footer>
    </main>
  );
}
