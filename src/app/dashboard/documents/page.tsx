"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { formatFileSize } from "@/lib/crypto";
import Link from "next/link";

interface Document {
  id: string;
  originalName: string;
  originalSize: number;
  mimeType: string;
  fileType: string;
  status: string;
  createdAt: string;
  rsaKeyPair: { id: string; label: string } | null;
}

// ── Send Email Modal ──────────────────────────────────────────────────────────
function SendEmailModal({
  doc,
  senderEmail,
  isGoogleUser,
  onClose,
}: {
  doc: Document;
  senderEmail: string;
  isGoogleUser: boolean;
  onClose: () => void;
}) {
  const [recipient, setRecipient] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      toast.error("Masukkan alamat email yang valid");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: recipient }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "GOOGLE_TOKEN_EXPIRED") {
          toast.error("Sesi Google kadaluarsa. Logout dan login ulang dengan Google.", { duration: 5000 });
        } else {
          toast.error(data.error || "Gagal mengirim email");
        }
      } else {
        toast.success(data.message ?? "Email berhasil dikirim!");
        onClose();
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim email");
    } finally {
      setSending(false);
    }
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card p-6 animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-900/50 text-primary-400 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="font-semibold text-dark-100">Kirim via Gmail</h2>
          </div>
          <button onClick={onClose} className="text-dark-500 hover:text-dark-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Not Google user warning */}
        {!isGoogleUser ? (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4 mb-5">
            <p className="text-yellow-300 text-sm font-medium mb-1">Login Google Diperlukan</p>
            <p className="text-yellow-400/80 text-sm">
              Fitur kirim email hanya tersedia jika Anda login menggunakan akun Google. Silakan logout dan login ulang dengan Google.
            </p>
            <Link href="/auth/login" className="inline-block mt-3 text-primary-400 text-sm hover:underline">
              Login dengan Google →
            </Link>
          </div>
        ) : (
          <>
            {/* File info */}
            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              <p className="text-dark-400 text-xs font-medium mb-3 uppercase tracking-wider">File yang dikirim</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{doc.fileType === "PDF" ? "📄" : doc.fileType === "DOCX" ? "📝" : "📃"}</span>
                <div className="min-w-0">
                  <p className="text-dark-100 font-medium text-sm truncate">{doc.originalName}.encrypted</p>
                  <p className="text-dark-500 text-xs mt-0.5">{formatFileSize(doc.originalSize)} · Terenkripsi AES-256</p>
                </div>
              </div>
            </div>

            {/* Sender info */}
            <div className="mb-4">
              <label className="label">Pengirim (akun Google Anda)</label>
              <div
                className="input-field cursor-not-allowed flex items-center gap-2"
                style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)" }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="truncate">{senderEmail}</span>
              </div>
            </div>

            {/* Recipient */}
            <div className="mb-5">
              <label className="label">Kirim ke (email tujuan)</label>
              <input
                type="email"
                className="input-field"
                placeholder="tujuan@email.com"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                autoFocus
              />
            </div>

            <button onClick={handleSend} disabled={sending} className="btn-primary w-full py-2.5">
              {sending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mengirim...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Kirim via Gmail
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailModal, setEmailModal] = useState<Document | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialDeleteMode = (searchParams?.get("mode") ?? "") === "delete";
  const [deleteMode, setDeleteMode] = useState<boolean>(initialDeleteMode);

  const isGoogleUser = session?.provider === "google";

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => {
        setDocuments(d.documents ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // keep URL in sync when toggling delete mode
    if (deleteMode) {
      router.replace(`/dashboard/documents?mode=delete`);
    } else {
      router.replace(`/dashboard/documents`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteMode]);

  const fileIcon = (type: string) => {
    if (type === "PDF") return "📄";
    if (type === "DOCX" || type === "DOC") return "📝";
    return "📃";
  };

  const handleDownload = async (docId: string, name: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/download`);
      if (!res.ok) {
        toast.error("Gagal mengunduh");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.encrypted`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("File terenkripsi diunduh!");
    } catch {
      toast.error("Gagal mengunduh file");
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const requestDelete = (docId: string) => {
    setDeleteTarget(docId);
  };

  const performDelete = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Gagal menghapus dokumen");
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast.success(data?.message || "Dokumen dihapus");
    } catch (e) {
      toast.error("Terjadi kesalahan saat menghapus dokumen");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Send Email Modal */}
      {emailModal && (
        <SendEmailModal
          doc={emailModal}
          senderEmail={session?.user?.email ?? ""}
          isGoogleUser={isGoogleUser ?? false}
          onClose={() => setEmailModal(null)}
        />
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-50">Dokumen Terenkripsi</h1>
          <p className="text-dark-400 mt-1">{documents.length} dokumen tersimpan</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/encrypt" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Enkripsi Baru
          </Link>
          <button
            onClick={() => setDeleteMode((v) => !v)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${deleteMode ? "bg-red-600/10 text-red-400 border-red-600/20" : "text-dark-200 border-transparent"}`}
            title="Toggle Mode Hapus"
          >
            {deleteMode ? "Mode Hapus: Aktif" : "Mode Hapus"}
          </button>
        </div>
      </div>

      {/* Google user badge */}
      {isGoogleUser && (
        <div className="mb-5 flex items-center gap-2 text-sm text-green-400 bg-green-900/20 border border-green-800 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span>
            Login via Google aktif — Anda dapat mengirim file terenkripsi langsung via Gmail dari akun <strong>{session?.user?.email}</strong>
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : documents.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 text-dark-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-dark-300 font-medium mb-2">Belum ada dokumen</p>
          <p className="text-dark-500 text-sm mb-4">Enkripsi dokumen pertama Anda sekarang</p>
          <Link href="/dashboard/encrypt" className="btn-primary inline-flex">
            Enkripsi Sekarang
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-6 py-4">File</th>
                <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Ukuran</th>
                <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-4 py-4 hidden lg:table-cell">Key Pair</th>
                <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-4 py-4 hidden md:table-cell">Tanggal</th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{fileIcon(doc.fileType)}</span>
                      <div className="min-w-0">
                        <p className="text-dark-100 font-medium text-sm truncate max-w-48">{doc.originalName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="badge-blue text-xs">{doc.fileType}</span>
                          <span className="badge-green text-xs">Terenkripsi</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-dark-400 text-sm">{formatFileSize(doc.originalSize)}</span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    {doc.rsaKeyPair ? (
                      <span className="text-dark-300 text-sm">{doc.rsaKeyPair.label}</span>
                    ) : (
                      <span className="text-red-400 text-xs">Key dihapus</span>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-dark-500 text-sm">
                      {new Date(doc.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {/* Actions: show delete when in deleteMode, otherwise standard actions */}
                      {deleteMode ? (
                        <button
                          onClick={() => requestDelete(doc.id)}
                          className="text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-lg border font-medium text-red-500 border-red-600/20 hover:bg-red-50"
                          title="Hapus dokumen"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-1-3H6L5 7" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 11v6m4-6v6" />
                          </svg>
                          Hapus
                        </button>
                      ) : (
                        <>
                          {/* Download */}
                          <button
                            onClick={() => handleDownload(doc.id, doc.originalName)}
                            className="btn-secondary text-xs px-3 py-1.5"
                            title="Download file terenkripsi"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Download
                          </button>

                          {/* Send Email */}
                          <button
                            onClick={() => setEmailModal(doc)}
                            className={`text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-lg border font-medium transition-all
                              ${isGoogleUser ? "bg-blue-600/20 hover:bg-blue-600/30 text-blue-500 border-blue-600/30" : "opacity-50 cursor-default"}`}
                            title={isGoogleUser ? "Kirim via Gmail" : "Login dengan Google untuk fitur ini"}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            Email
                          </button>

                          {/* Decrypt */}
                          {doc.rsaKeyPair && (
                            <Link href={`/dashboard/decrypt?doc=${doc.id}`} className="btn-primary text-xs px-3 py-1.5">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                />
                              </svg>
                              Dekripsi
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Confirm delete modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Dokumen"
        description="Yakin ingin menghapus dokumen ini? Aksi ini tidak dapat dikembalikan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && performDelete(deleteTarget)}
      />
    </div>
  );
}
