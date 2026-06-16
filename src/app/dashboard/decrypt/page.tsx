"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { formatFileSize } from "@/lib/crypto";
import ConfirmModal from "@/components/ConfirmModal";

interface Document {
  id: string;
  originalName: string;
  originalSize: number;
  mimeType: string;
  createdAt: string;
  rsaKeyPair: { id: string; label: string } | null;
}

interface DecryptResult {
  decryptedData: string;
  originalName: string;
  mimeType: string;
  originalSize: number;
  decryptionTimeMs: number;
}

export default function DecryptPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecryptResult | null>(null);
  const [uploadedEncryptedData, setUploadedEncryptedData] = useState<string>("");
  const [uploadedEncryptedAesKey, setUploadedEncryptedAesKey] = useState<string>("");
  const [uploadedAesIv, setUploadedAesIv] = useState<string>("");
  const [uploadedName, setUploadedName] = useState<string>("");
  const [uploadedMime, setUploadedMime] = useState<string>("");

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setDocuments(d.documents ?? []));
  }, []);

  const handleDecrypt = async () => {
    if (!selected) {
      toast.error("Pilih dokumen terlebih dahulu");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/documents/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selected }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Dekripsi gagal");
      } else {
        setResult(data);
        toast.success("File berhasil didekripsi!");
      }
    } catch {
      toast.error("Terjadi kesalahan saat dekripsi");
    } finally {
      setLoading(false);
    }
  };

  const downloadDecrypted = () => {
    if (!result) return;
    const binary = atob(result.decryptedData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.originalName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File diunduh!");
  };

  const fileIcon = (name: string) => {
    if (name.endsWith(".pdf")) return "📄";
    if (name.endsWith(".docx") || name.endsWith(".doc")) return "📝";
    return "📃";
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const requestDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const performDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Gagal menghapus dokumen");
        return;
      }
      // Remove from list
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selected === id) setSelected("");
      setResult(null);
      toast.success(data?.message || "Dokumen dihapus");
    } catch (e) {
      toast.error("Terjadi kesalahan saat menghapus dokumen");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Dekripsi Dokumen
        </h1>
        <p className="mt-1 text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
          Pilih dokumen terenkripsi dan dekripsi menggunakan RSA private key Anda
        </p>
      </div>

      {/* Select Document */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-5">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">1</div>
          <h2 className="font-semibold text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
            Pilih Dokumen Terenkripsi
          </h2>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-6 sm:py-8" style={{ color: "var(--text-muted)" }}>
            <svg className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-xs sm:text-sm">Belum ada dokumen terenkripsi</p>
            <a href="/dashboard/encrypt" className="text-primary-400 text-sm hover:underline mt-1 inline-block">
              Enkripsi dokumen pertama Anda →
            </a>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelected(doc.id);
                  setResult(null);
                }}
                className={`w-full flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border text-left transition-all ${
                  selected === doc.id ? "border-primary-600 bg-primary-900/20" : ""
                }`}
                style={
                  selected !== doc.id
                    ? {
                        borderColor: "var(--border)",
                        backgroundColor: "var(--bg-elevated)",
                      }
                    : undefined
                }
              >
                <span className="text-xl sm:text-2xl flex-shrink-0">{fileIcon(doc.originalName)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate" style={{ color: "var(--text-primary)" }}>
                    {doc.originalName}
                  </p>
                  <p className="text-xs mt-0.5 line-clamp-1 sm:line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {formatFileSize(doc.originalSize)} · {new Date(doc.createdAt).toLocaleDateString("id-ID")}
                    {doc.rsaKeyPair && (
                      <>
                        {" "}
                        · <span style={{ color: "var(--text-secondary)" }}>{doc.rsaKeyPair.label}</span>
                      </>
                    )}
                  </p>
                </div>
                {selected === doc.id && (
                  <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {/* Delete control */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDelete(doc.id);
                  }}
                  title="Hapus dokumen"
                  className="ml-2 sm:ml-3 text-red-500 hover:text-red-400 cursor-pointer flex-shrink-0"
                >
                  <svg className="w-4 sm:w-5 h-4 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-1-3H6L5 7" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 11v6m4-6v6" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        )}
        {/* confirm modal for decrypt page deletions */}
        <ConfirmModal
          open={!!deleteTarget}
          title="Hapus Dokumen"
          description="Yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dikembalikan."
          confirmLabel="Hapus"
          cancelLabel="Batal"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteTarget && performDelete(deleteTarget)}
        />
      </div>

      {/* Decrypt */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-5">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">2</div>
          <h2 className="font-semibold text-sm sm:text-base" style={{ color: "var(--text-primary)" }}>
            Dekripsi
          </h2>
        </div>

        <div
          className="rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 font-mono text-xs space-y-1 overflow-x-auto"
          style={{
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <p>Langkah dekripsi:</p>
          <p className="pl-2">1. Encrypted AES Key → RSA-2048 Decrypt(private key) → AES Key</p>
          <p className="pl-2">2. Ciphertext → AES-256-CBC Decrypt(AES key, IV) → File asli</p>
        </div>

        <button onClick={handleDecrypt} disabled={!selected || loading || documents.length === 0} className="btn-primary w-full py-2 sm:py-3">
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mendekripsi...
            </>
          ) : (
            <>
              <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              Dekripsi File
            </>
          )}
        </button>

        {/* Upload encrypted payload */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs sm:text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
            Unggah file terenkripsi (opsional)
          </p>
          <input
            type="file"
            accept=".encrypted,application/json,text/plain"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const txt = await f.text();
                // Try parse JSON, otherwise assume raw encryptedData
                try {
                  const j = JSON.parse(txt);
                  setUploadedEncryptedData(j.encryptedData ?? "");
                  setUploadedEncryptedAesKey(j.encryptedAesKey ?? "");
                  setUploadedAesIv(j.aesIv ?? "");
                  setUploadedName(j.originalName ?? f.name ?? "uploaded.dat");
                  setUploadedMime(j.mimeType ?? "application/octet-stream");
                } catch {
                  // treat as raw encryptedData; support filename like 'formatif.pdf.encrypted'
                  setUploadedEncryptedData(txt.trim());
                  setUploadedEncryptedAesKey("");
                  setUploadedAesIv("");
                  // derive original name by removing trailing .encrypted
                  const name = f.name ?? "uploaded.dat";
                  const origName = name.endsWith(".encrypted") ? name.replace(/\.encrypted$/i, "") : name;
                  setUploadedName(origName);
                  // infer mime from extension
                  const ext = origName.split(".").pop()?.toLowerCase() ?? "";
                  const mimeMap: Record<string, string> = {
                    pdf: "application/pdf",
                    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    doc: "application/msword",
                    txt: "text/plain",
                  };
                  setUploadedMime((mimeMap[ext] ?? f.type) || "application/octet-stream");
                }
                setResult(null);
                toast.success("File terenkripsi berhasil dimuat (isi akan dipakai saat dekripsi)");
              } catch {
                toast.error("Gagal membaca file");
              }
            }}
          />

          <div className="mt-2 space-y-2">
            <input
              className="input-field w-full text-xs sm:text-sm"
              placeholder="encryptedAesKey (base64)"
              value={uploadedEncryptedAesKey}
              onChange={(e) => setUploadedEncryptedAesKey(e.target.value)}
            />
            <input
              className="input-field w-full text-xs sm:text-sm"
              placeholder="aesIv (base64)"
              value={uploadedAesIv}
              onChange={(e) => setUploadedAesIv(e.target.value)}
            />
            <input
              className="input-field w-full text-xs sm:text-sm"
              placeholder="Original name"
              value={uploadedName}
              onChange={(e) => setUploadedName(e.target.value)}
            />
            <input
              className="input-field w-full text-xs sm:text-sm"
              placeholder="Mime type"
              value={uploadedMime}
              onChange={(e) => setUploadedMime(e.target.value)}
            />

            <button
              disabled={loading || (!uploadedEncryptedData && !uploadedEncryptedAesKey)}
              onClick={async () => {
                // Submit FormData to new endpoint
                setLoading(true);
                setResult(null);
                try {
                  const fd = new FormData();
                  if (uploadedEncryptedData) fd.append("encryptedData", uploadedEncryptedData);
                  if (uploadedEncryptedAesKey) fd.append("encryptedAesKey", uploadedEncryptedAesKey);
                  if (uploadedAesIv) fd.append("aesIv", uploadedAesIv);
                  if (uploadedName) fd.append("originalName", uploadedName);
                  if (uploadedMime) fd.append("mimeType", uploadedMime);

                  const res = await fetch("/api/documents/decrypt-upload", { method: "POST", body: fd });
                  const data = await res.json();
                  if (!res.ok) {
                    toast.error(data.error || "Dekripsi upload gagal");
                  } else {
                    setResult(data);
                    toast.success("File upload berhasil didekripsi!");
                  }
                } catch (e) {
                  toast.error("Gagal mengirim data dekripsi");
                } finally {
                  setLoading(false);
                }
              }}
              className="btn-secondary w-full py-2"
            >
              Dekripsi File Unggahan
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card p-4 sm:p-6 border-green-700 animate-slide-up">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 bg-green-900/50 text-green-400 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm sm:text-base text-green-400">Dekripsi Berhasil!</h3>
          </div>
          <div
            className="rounded-xl p-3 sm:p-4 font-mono text-xs space-y-2 mb-3 sm:mb-4 overflow-x-auto"
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <p>
              File: <span style={{ color: "var(--text-primary)" }}>{result.originalName}</span>
            </p>
            <p>
              Ukuran: <span style={{ color: "var(--text-primary)" }}>{formatFileSize(result.originalSize)}</span>
            </p>
            <p>
              Waktu dekripsi: <span className="text-green-400">{result.decryptionTimeMs}ms</span>
            </p>
          </div>
          <button onClick={downloadDecrypted} className="btn-primary w-full py-2 sm:py-2.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download File Asli
          </button>
        </div>
      )}
    </div>
  );
}
